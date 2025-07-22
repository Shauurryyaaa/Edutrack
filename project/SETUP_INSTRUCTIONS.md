# Setup Instructions for EdTech Assignment Tracker

## Prerequisites
Before running this application, you need to set up a Supabase project.

## Step 1: Create Supabase Project
1. Go to [https://supabase.com](https://supabase.com)
2. Create a new account or sign in
3. Create a new project
4. Wait for the project to be ready

## Step 2: Database Setup
Execute the following SQL in your Supabase SQL editor:

```sql
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

-- RLS Policies for assignments table
CREATE POLICY "Teachers can create assignments" ON assignments
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'teacher')
  );

CREATE POLICY "Teachers can read own assignments" ON assignments
  FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Students can read all assignments" ON assignments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'student')
  );

CREATE POLICY "Teachers can update own assignments" ON assignments
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Teachers can delete own assignments" ON assignments
  FOR DELETE USING (created_by = auth.uid());

-- RLS Policies for submissions table
CREATE POLICY "Students can create own submissions" ON submissions
  FOR INSERT WITH CHECK (
    student_id = auth.uid() AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'student')
  );

CREATE POLICY "Students can read own submissions" ON submissions
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students can update own submissions" ON submissions
  FOR UPDATE USING (student_id = auth.uid());

CREATE POLICY "Teachers can read submissions for their assignments" ON submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM assignments 
      WHERE assignments.id = assignment_id 
      AND assignments.created_by = auth.uid()
    )
  );

CREATE POLICY "Teachers can update grades for their assignments" ON submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM assignments 
      WHERE assignments.id = assignment_id 
      AND assignments.created_by = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_assignments_created_by ON assignments(created_by);
CREATE INDEX idx_assignments_due_date ON assignments(due_date);
CREATE INDEX idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX idx_submissions_student_id ON submissions(student_id);
CREATE INDEX idx_submissions_status ON submissions(status);
```

## Step 3: Storage Setup
1. Go to Storage in your Supabase dashboard
2. Create a new bucket named `assignments`
3. Set the bucket as public or configure appropriate policies

## Step 4: Configure Environment Variables
1. Get your Supabase URL and Anon Key from Settings > API
2. Update `src/lib/supabase.ts` with your actual values:
   ```typescript
   const supabaseUrl = 'YOUR_SUPABASE_URL';
   const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
   ```

## Step 5: Authentication Settings
1. Go to Authentication > Settings in Supabase
2. Disable email confirmations for easier testing
3. Configure any additional auth providers if needed

## Step 6: Test Data (Optional)
You can create test accounts:

```sql
-- Insert test users (after they sign up through the app)
-- These will be created automatically when users sign up through the application
```

## Step 7: Run the Application
```bash
npm run dev
```

## Demo Accounts
Create these accounts through the signup page:
- Teacher: teacher@demo.com / password123
- Student: student@demo.com / password123

## Features Included
- ✅ Role-based authentication (teacher/student)
- ✅ Assignment creation and management
- ✅ Student submission system
- ✅ File upload support
- ✅ Grading and feedback system
- ✅ Responsive design
- ✅ Real-time updates
- ✅ Security with Row Level Security
- ✅ Input validation
- ✅ Error handling

## Scaling Considerations
- Database is already optimized with proper indexes
- RLS policies ensure data security
- File storage is handled by Supabase
- Application is stateless and can be horizontally scaled
- Consider adding caching layer (Redis) for high traffic
- Monitor database performance and add read replicas as needed