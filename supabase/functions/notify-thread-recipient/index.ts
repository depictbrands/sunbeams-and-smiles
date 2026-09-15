import { createClient } from 'npm:@supabase/supabase-js@2'
import { sendTemplateEmail } from '../_shared/transactional-email-templates/send-email.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const TEMPLATE_NAME = 'portal-message-notification'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const admin = createClient(supabaseUrl, serviceKey)

  const logSend = async (
    recipientEmail: string,
    status: 'sent' | 'suppressed' | 'failed',
    errorMessage?: string,
  ) => {
    const { error } = await admin.from('email_send_log').insert({
      message_id: null,
      template_name: TEMPLATE_NAME,
      recipient_email: recipientEmail,
      status,
      error_message: errorMessage ? errorMessage.slice(0, 1000) : null,
    })
    if (error) console.error('Failed to write email_send_log', error)
  }

  try {
    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.replace('Bearer ', '')
    const { data: userData } = await admin.auth.getUser(token)
    const sender = userData?.user
    if (!sender) return json({ error: 'Unauthorized' }, 401)

    const { threadId, body: messageBody } = await req.json()
    if (!threadId) return json({ error: 'threadId is required' }, 400)

    const { data: thread } = await admin
      .from('message_threads')
      .select('id, subject, parent_id, assigned_teacher_id')
      .eq('id', threadId)
      .maybeSingle()
    if (!thread) return json({ error: 'Thread not found' }, 404)

    // Only participants may trigger a notification
    if (sender.id !== thread.parent_id && sender.id !== thread.assigned_teacher_id) {
      return json({ error: 'Forbidden' }, 403)
    }

    const recipientId =
      sender.id === thread.parent_id ? thread.assigned_teacher_id : thread.parent_id
    if (!recipientId) return json({ skipped: 'no recipient assigned' })

    const { data: profs } = await admin
      .from('profiles')
      .select('user_id, display_name, email')
      .in('user_id', [sender.id, recipientId])

    const senderProf = (profs ?? []).find((p) => p.user_id === sender.id)
    const recipientProf = (profs ?? []).find((p) => p.user_id === recipientId)

    let recipientEmail = recipientProf?.email ?? ''
    if (!recipientEmail) {
      const { data: authUser } = await admin.auth.admin.getUserById(recipientId)
      recipientEmail = authUser?.user?.email ?? ''
    }
    if (!recipientEmail) return json({ skipped: 'recipient has no email' })

    const cleanSubject = String(thread.subject ?? '')
      .replace(/^\[[^\]]+\]\s*/, '')
      .slice(0, 200)

    try {
      const result = await sendTemplateEmail(TEMPLATE_NAME, recipientEmail, {
        idempotencyKey: `thread-${threadId}-${Date.now()}`,
        templateData: {
          recipientName: (recipientProf?.display_name ?? '').split(' ')[0] ?? '',
          senderName: senderProf?.display_name || senderProf?.email || 'Portal Sonsoles',
          subject: cleanSubject || '(sin asunto)',
          body: String(messageBody ?? '').slice(0, 2000),
          portalUrl: 'https://preescolarsonsoles.com/portal-padres',
        },
      })

      if (!result.sent) {
        await logSend(recipientEmail, 'suppressed')
        return json({ success: false, reason: result.reason })
      }

      await logSend(recipientEmail, 'sent')
      return json({ success: true })
    } catch (sendError) {
      const message = sendError instanceof Error ? sendError.message : String(sendError)
      console.error('Notification email failed', message)
      await logSend(recipientEmail, 'failed', message)
      return json({ error: 'Failed to send notification' }, 500)
    }
  } catch (e) {
    console.error('notify-thread-recipient error', e)
    return json({ error: e instanceof Error ? e.message : 'Unknown error' }, 500)
  }
})
