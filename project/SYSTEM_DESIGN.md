# EdTech Assignment Tracker - System Design

## Part A: System Architecture

### Core Entities and Relationships

#### Entity Relationship Design

```
Users
├── id (uuid, primary key)
├── email (unique, not null)
├── password_hash (not null)
├── full_name (not null)
├── role (enum: 'teacher', 'student')
├── created_at (timestamp)
└── updated_at (timestamp)

Assignments
├── id (uuid, primary key)
├── title (not null)
├── description (text)
├── due_date (timestamp)
├── created_by (foreign key → Users.id)
├── created_at (timestamp)
├── updated_at (timestamp)
└── max_points (integer, default: 100)

Submissions
├── id (uuid, primary key)
├── assignment_id (foreign key → Assignments.id)
├── student_id (foreign key → Users.id)
├── content (text)
├── file_url (text, optional)
├── submitted_at (timestamp)
├── grade (integer, optional)
├── feedback (text, optional)
└── status (enum: 'submitted', 'graded')
```

#### Relationships
- Users (1) → (Many) Assignments (teacher creates multiple assignments)
- Users (1) → (Many) Submissions (student submits multiple assignments)
- Assignments (1) → (Many) Submissions (one assignment has many submissions)

### API Endpoints

#### Authentication
- `POST /auth/signup` - User registration with role selection
- `POST /auth/login` - User authentication
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user profile

#### Assignments
- `POST /assignments` - Create assignment (teacher only)
- `GET /assignments` - List assignments (role-filtered)
- `GET /assignments/:id` - Get assignment details
- `PUT /assignments/:id` - Update assignment (teacher only, own assignments)
- `DELETE /assignments/:id` - Delete assignment (teacher only, own assignments)

#### Submissions
- `POST /assignments/:id/submit` - Submit assignment (student only)
- `GET /assignments/:id/submissions` - View submissions (teacher only, own assignments)
- `GET /submissions/:id` - Get submission details
- `PUT /submissions/:id/grade` - Grade submission (teacher only)

### Authentication Strategy

#### Role-Based Access Control (RBAC)
1. **JWT-based Authentication**: Secure token-based auth with role information
2. **Role Verification**: Middleware to check user roles for protected routes
3. **Route Protection**: 
   - Teacher routes: Assignment creation, viewing submissions, grading
   - Student routes: Assignment submission, viewing own submissions
   - Public routes: Login, signup

#### Security Features
- Password hashing using bcrypt
- JWT token expiration and refresh
- Input validation and sanitization
- SQL injection prevention through ORM
- Rate limiting on sensitive endpoints

### Scaling Suggestions

#### Database Scaling
- **Read Replicas**: Separate read/write operations for better performance
- **Sharding**: Partition data by school/institution for horizontal scaling
- **Indexing**: Add indexes on frequently queried fields (user_id, assignment_id, due_date)
- **Caching**: Redis/Memcached for frequently accessed data

#### Application Scaling
- **Microservices Architecture**: Separate services for auth, assignments, submissions, notifications
- **Load Balancing**: Distribute traffic across multiple server instances
- **CDN Integration**: Static file serving for assignment files and submissions
- **Background Jobs**: Queue system for email notifications, file processing

#### Future Enhancements
- **Real-time Features**: WebSocket integration for live notifications
- **File Storage**: Cloud storage (AWS S3, Google Cloud) for assignment files
- **Analytics**: Student performance tracking and teacher analytics dashboard
- **Integration**: LMS integration (Canvas, Moodle), Google Classroom sync
- **Mobile App**: React Native mobile application
- **Advanced Features**: Plagiarism detection, automated grading, video submissions

## Part B: Implementation Notes

### Technology Stack
- **Frontend**: React 18 with TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Authentication**: Supabase Auth with RLS (Row Level Security)
- **File Storage**: Supabase Storage for file uploads
- **Deployment**: Netlify (frontend), Supabase (backend)

### Security Implementation
- Row Level Security (RLS) policies for data access control
- Input validation on both client and server side
- Secure file upload with type and size restrictions
- XSS protection through React's built-in sanitization

### Performance Considerations
- Lazy loading for large assignment lists
- Pagination for submissions
- Optimistic UI updates for better UX
- Image optimization and compression for file uploads