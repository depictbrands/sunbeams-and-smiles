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

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  try {
    const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
    const { data: userData } = await admin.auth.getUser(token)
    const sender = userData?.user
    if (!sender) return json({ error: 'Unauthorized' }, 401)

    // Only staff (admin/teacher) may trigger document notifications
    const { data: roles } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', sender.id)
    const isStaff = (roles ?? []).some((r: { role: string }) =>
      r.role === 'admin' || r.role === 'teacher'
    )
    if (!isStaff) return json({ error: 'Forbidden' }, 403)

    const payload = await req.json().catch(() => ({}))
    const studentId = typeof payload.studentId === 'string' ? payload.studentId : ''
    const categoryLabel = String(payload.categoryLabel ?? 'Documento').slice(0, 120)
    const documentTitle = String(payload.documentTitle ?? '').slice(0, 200)
    if (!studentId) return json({ error: 'studentId is required' }, 400)

    const { data: student } = await admin
      .from('allowed_students')
      .select('id, student_name, parent_user_id')
      .eq('id', studentId)
      .maybeSingle()
    if (!student) return json({ error: 'Student not found' }, 404)
    if (!student.parent_user_id) return json({ skipped: 'student has no linked parent' })

    const { data: prof } = await admin
      .from('profiles')
      .select('display_name, email')
      .eq('user_id', student.parent_user_id)
      .maybeSingle()

    let recipientEmail = prof?.email ?? ''
    if (!recipientEmail) {
      const { data: authUser } = await admin.auth.admin.getUserById(student.parent_user_id)
      recipientEmail = authUser?.user?.email ?? ''
    }
    if (!recipientEmail) return json({ skipped: 'parent has no email' })

    const { error } = await admin.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'portal-document-notification',
        recipientEmail,
        idempotencyKey: `doc-${studentId}-${categoryLabel}-${Date.now()}`,
        templateData: {
          recipientName: (prof?.display_name ?? '').split(' ')[0] ?? '',
          studentName: student.student_name ?? '',
          categoryLabel,
          documentTitle,
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
    console.error('notify-parent-document error', e)
    return json({ error: e instanceof Error ? e.message : 'Unknown error' }, 500)
  }
})
