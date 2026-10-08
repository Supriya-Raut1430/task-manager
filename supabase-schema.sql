-- ========================================================================
-- Supabase PostgreSQL Schema for Task Manager Application
-- ========================================================================
-- To apply this schema:
-- 1. Open your Supabase project dashboard (https://supabase.com/dashboard)
-- 2. Navigate to SQL Editor in the left sidebar
-- 3. Click "New query", paste the contents of this file, and click "Run"
-- ========================================================================

-- Enable pgcrypto extension for gen_random_uuid() if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Create the `tasks` table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(120) NOT NULL,
    description VARCHAR(1000) DEFAULT '',
    category VARCHAR(50) DEFAULT 'Personal',
    priority VARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed')),
    due_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Create function to automatically update `updated_at` timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger for `updated_at`
DROP TRIGGER IF EXISTS set_tasks_updated_at ON public.tasks;
CREATE TRIGGER set_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 4. Create Performance Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks (status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks (priority);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON public.tasks (category);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks (due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks (created_at DESC);

-- 5. Row Level Security (RLS) Configuration
-- Enable RLS on the tasks table
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Allow read access for both anonymous and authenticated users
DROP POLICY IF EXISTS "Allow public read access on tasks" ON public.tasks;
CREATE POLICY "Allow public read access on tasks"
    ON public.tasks
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Allow insert access for both anonymous and authenticated users
DROP POLICY IF EXISTS "Allow public insert access on tasks" ON public.tasks;
CREATE POLICY "Allow public insert access on tasks"
    ON public.tasks
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Allow update access for both anonymous and authenticated users
DROP POLICY IF EXISTS "Allow public update access on tasks" ON public.tasks;
CREATE POLICY "Allow public update access on tasks"
    ON public.tasks
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Allow delete access for both anonymous and authenticated users
DROP POLICY IF EXISTS "Allow public delete access on tasks" ON public.tasks;
CREATE POLICY "Allow public delete access on tasks"
    ON public.tasks
    FOR DELETE
    TO anon, authenticated
    USING (true);

-- 6. Sample Initial Seed Data (Optional - useful for instant testing)
INSERT INTO public.tasks (title, description, category, priority, status, due_date)
VALUES 
    (
        'Complete Supabase Migration',
        'Verify database connection, test REST API endpoints, and ensure smooth UI updates.',
        'Coding',
        'High',
        'In Progress',
        NOW() + INTERVAL '1 day'
    ),
    (
        'Review System Architecture',
        'Document schema structure, PostgreSQL indexes, and query optimizations.',
        'Work',
        'Medium',
        'Pending',
        NOW() + INTERVAL '3 days'
    ),
    (
        'Setup Environment Configuration',
        'Configure SUPABASE_URL and SUPABASE_ANON_KEY in production and local environments.',
        'Personal',
        'Low',
        'Completed',
        NOW() - INTERVAL '1 day'
    )
ON CONFLICT DO NOTHING;
