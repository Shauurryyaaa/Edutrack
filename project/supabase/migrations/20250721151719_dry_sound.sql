/*
  # EdTech Assignment Tracker Database Schema

  1. New Tables
    - `users` - Extends Supabase auth.users with role and profile information
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, unique, not null)
      - `full_name` (text, not null)
      - `role` (enum: 'teacher', 'student')
      - `created_at` (timestamp)

    - `assignments` - Stores assignment information created by teachers
      - `id` (uuid, primary key)
      - `title` (text, not null)
      - `description` (text, not null)
      - `due_date` (timestamp, not null)
      - `created_by` (uuid, foreign key to users)
      - `created_at` (timestamp)
      - `max_points` (integer, default 100)

    - `submissions` - Stores student submissions for assignments
      - `id` (uuid, primary key)
      - `assignment_id` (uuid, foreign key to assignments)
      - `student_id` (uuid, foreign key to users)
      - `content` (text, not null)
      - `file_url` (text, optional)
      - `submitted_at` (timestamp)
      - `grade` (integer, optional)
      - `feedback` (text, optional)
      - `status` (enum: 'submitted', 'graded')

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
    - Teachers can only access their own assignments and related submissions
    - Students can only access assignments and their own submissions

  3. Performance
    - Add indexes on frequently queried columns
    - Foreign key constraints for data integrity
*/

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text CHECK (role IN ('teacher', 'student')) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  due_date timestamptz NOT NULL,
  created_by uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  max_points integer DEFAULT 100 CHECK (max_points > 0)
);

-- Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid REFERENCES assignments(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  file_url text,
  submitted_at timestamptz DEFAULT now(),
  grade integer CHECK (grade >= 0),
  feedback text,
  status text CHECK (status IN ('submitted', 'graded')) DEFAULT 'submitted',
  UNIQUE(assignment_id, student_id)
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for assignments table
CREATE POLICY "Teachers can create assignments" ON assignments
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'teacher')
  );

CREATE POLICY "Teachers can read own assignments" ON assignments
  FOR SELECT USING (
    created_by = auth.uid() AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'teacher')
  );

CREATE POLICY "Students can read all assignments" ON assignments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'student')
  );

CREATE POLICY "Teachers can update own assignments" ON assignments
  FOR UPDATE USING (
    created_by = auth.uid() AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'teacher')
  );

CREATE POLICY "Teachers can delete own assignments" ON assignments
  FOR DELETE USING (
    created_by = auth.uid() AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'teacher')
  );

-- RLS Policies for submissions table
CREATE POLICY "Students can create own submissions" ON submissions
  FOR INSERT WITH CHECK (
    student_id = auth.uid() AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'student')
  );

CREATE POLICY "Students can read own submissions" ON submissions
  FOR SELECT USING (
    student_id = auth.uid() AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'student')
  );

CREATE POLICY "Students can update own submissions" ON submissions
  FOR UPDATE USING (
    student_id = auth.uid() AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'student')
  );

CREATE POLICY "Teachers can read submissions for their assignments" ON submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM assignments 
      WHERE assignments.id = assignment_id 
      AND assignments.created_by = auth.uid()
      AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'teacher')
    )
  );

CREATE POLICY "Teachers can update grades for their assignments" ON submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM assignments 
      WHERE assignments.id = assignment_id 
      AND assignments.created_by = auth.uid()
      AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'teacher')
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_assignments_created_by ON assignments(created_by);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_assignments_created_at ON assignments(created_at);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON submissions(submitted_at);

-- Create a function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- This function will be called when a new user signs up
  -- The actual user insertion will be handled by the application
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;