export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'teacher' | 'student';
  created_at: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  created_by: string;
  created_at: string;
  max_points: number;
  teacher?: User;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  content: string;
  file_url?: string;
  submitted_at: string;
  grade?: number;
  feedback?: string;
  status: 'submitted' | 'graded';
  student?: User;
  assignment?: Assignment;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, role: 'teacher' | 'student') => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}