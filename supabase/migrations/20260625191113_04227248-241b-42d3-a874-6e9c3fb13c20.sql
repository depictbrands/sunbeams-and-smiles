
CREATE POLICY "Parents view their own linked student"
ON public.allowed_students
FOR SELECT
TO authenticated
USING (parent_user_id = auth.uid() AND status = 'active');
