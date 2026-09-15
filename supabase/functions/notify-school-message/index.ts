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

const TEMPLATE_NAME = 'new-parent-message'
const SCHOOL_EMAIL = 'preescolarsonsoles@gmail.com'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const logSend = async (
    status: 'sent' | 'suppressed' | 'failed',
    errorMessage?: string,
  ) => {
    const { error } = await admin.from('email_send_log').insert({
      message_id: null,
      template_name: TEMPLATE_NAME,
      recipient_email: SCHOOL_EMAIL,
      status,
      error_message: errorMessage ? errorMessage.slice(0, 1000) : null,
    })
    if (error) console.error('Failed to write email_send_log', error)
  }

  try {
    const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
    const { data: userData } = await admin.auth.getUser(token)
    const sender = userData?.user
    if (!sender) return json({ error: 'Unauthorized' }, 401)

    const payload = await req.json().catch(() => ({}))
    const threadId = typeof payload.threadId === 'string' ? payload.threadId : ''
    const messageBody = String(payload.body ?? '').slice(0, 5000)
    if (!threadId) return json({ error: 'threadId is required' }, 400)

    const { data: thread } = await admin
      .from('message_threads')
      .select('id, subject, parent_id, assigned_teacher_id')
      .eq('id', threadId)
      .maybeSingle()
    if (!thread) return json({ error: 'Thread not found' }, 404)
    if (sender.id !== thread.parent_id && sender.id !== thread.assigned_teacher_id) {
      return json({ error: 'Forbidden' }, 403)
    }

    const subject = String(thread.subject ?? '')
    // Los mensajes internos entre personal no se copian a la oficina
    if (subject.startsWith('[Interno')) return json({ skipped: 'internal thread' })

    const cleanSubject = subject.replace(/^\[[^\]]+\]\s*/, '').slice(0, 200)
    const contactMatch = subject.match(/\[(?:Interno · )?Para:\s*([^\]]+)\]/)

    const ids = [sender.id, thread.parent_id].filter(Boolean) as string[]
    const { data: profs } = await admin
      .from('profiles')
      .select('user_id, display_name, email')
      .in('user_id', ids)
    const senderProf = (profs ?? []).find((p) => p.user_id === sender.id)
    const parentProf = (profs ?? []).find((p) => p.user_id === thread.parent_id)

    const senderIsParent = sender.id === thread.parent_id
    const senderName = senderProf?.display_name || senderProf?.email || 'Portal'
    const parentName = senderIsParent ? senderName : `${senderName} (respuesta)`
    const teacherName = senderIsParent
      ? (contactMatch?.[1]?.trim() || 'la escuela')
      : (parentProf?.display_name || parentProf?.email || 'Padre')

    try {
      const result = await sendTemplateEmail(TEMPLATE_NAME, SCHOOL_EMAIL, {
        idempotencyKey: `msg-${threadId}-${Date.now()}`,
        templateData: {
          parentName,
          parentEmail: senderProf?.email ?? '',
          teacherName,
          subject: cleanSubject || '(sin asunto)',
          body: messageBody,
        },
      })

      if (!result.sent) {
        await logSend('suppressed')
        return json({ success: false, reason: result.reason })
      }

      await logSend('sent')
      return json({ success: true })
    } catch (sendError) {
      const message = sendError instanceof Error ? sendError.message : String(sendError)
      console.error('School notification email failed', message)
      await logSend('failed', message)
      return json({ error: 'Failed to send notification' }, 500)
    }
  } catch (e) {
    console.error('notify-school-message error', e)
    return json({ error: e instanceof Error ? e.message : 'Unknown error' }, 500)
  }
})
