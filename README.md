# EdTech Assignment Tracker

A modern web application for teachers and students to manage assignments, submissions, and grading. Built with React, TypeScript, Tailwind CSS, and Supabase.

## Features

- **Role-based authentication** (teacher/student)
- **Assignment creation and management** (teachers)
- **Student submission system** with file upload
- **Grading and feedback** for teachers
- **Responsive UI** with Tailwind CSS
- **Supabase Auth, Database, and Storage** integration
- **Secure** with Row Level Security (RLS) policies

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [Supabase account](https://supabase.com/)

### Setup

1. **Clone the repository:**
   ```sh
   git clone <your-repo-url>
   cd project
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Configure Supabase:**
   - Create a Supabase project.
   - Run the SQL schema in [`supabase/migrations/`](supabase/migrations/) or follow [`SETUP_INSTRUCTIONS.md`](SETUP_INSTRUCTIONS.md).
   - Create a public storage bucket named `assignments`.
   - Copy your Supabase URL and Anon Key to a `.env` file:
     ```
     VITE_SUPABASE_URL=your_supabase_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

4. **Start the development server:**
   ```sh
   npm run dev
   ```

5. **Open the app:**  
   Visit [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure

- [`src/`](src/) — Main application source code
  - [`components/`](src/components/) — Layout and route protection
  - [`contexts/`](src/contexts/) — Auth context
  - [`lib/`](src/lib/) — Supabase client
  - [`pages/`](src/pages/) — App pages (Login, Signup, Dashboard, etc.)
  - [`types/`](src/types/) — TypeScript types
- [`supabase/migrations/`](supabase/migrations/) — Database schema
- [`SETUP_INSTRUCTIONS.md`](SETUP_INSTRUCTIONS.md) — Full setup guide

## Scripts

- `npm run dev` — Start development server
- `npm run build` — Build for production
- `npm run preview` — Preview production build
- `npm run lint` — Lint code

## Demo Accounts

Create these via the signup page:
- **Teacher:** `teacher@demo.com` / `password123`
- **Student:** `student@demo.com` / `password123`

## License

MIT

---

See
