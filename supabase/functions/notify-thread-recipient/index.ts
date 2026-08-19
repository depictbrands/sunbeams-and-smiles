import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const admin = createClient(supabaseUrl, serviceKey)

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

    const { error } = await admin.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'portal-message-notification',
        recipientEmail,
        idempotencyKey: `thread-${threadId}-${Date.now()}`,
        templateData: {
          recipientName: (recipientProf?.display_name ?? '').split(' ')[0] ?? '',
          senderName: senderProf?.display_name || senderProf?.email || 'Portal Sonsoles',
          subject: cleanSubject || '(sin asunto)',
          body: String(messageBody ?? '').slice(0, 2000),
          portalUrl: 'https://preescolarsonsoles.com/portal-padres',
        },
      },
    })
    if (error) {
      console.error('send-transactional-email failed', error)
      return json({ error: 'Failed to send notification' }, 500)
    }

    return json({ success: true })
  } catch (e) {
    console.error('notify-thread-recipient error', e)
    return json({ error: e instanceof Error ? e.message : 'Unknown error' }, 500)
  }
})
