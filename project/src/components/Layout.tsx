import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, LogOut, Plus, FileText, Users } from 'lucide-react';
import clsx from 'clsx';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!user) {
    return <div>{children}</div>;
  }

  const teacherNavItems = [
    { to: '/dashboard', icon: BookOpen, label: 'Dashboard' },
    { to: '/create-assignment', icon: Plus, label: 'Create Assignment' },
    { to: '/submissions', icon: Users, label: 'View Submissions' },
  ];

  const studentNavItems = [
    { to: '/dashboard', icon: BookOpen, label: 'My Assignments' },
    { to: '/my-submissions', icon: FileText, label: 'My Submissions' },
  ];

  const navItems = user.role === 'teacher' ? teacherNavItems : studentNavItems;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">EduTracker</h1>
          <p className="text-sm text-gray-600 mt-1">
            {user.full_name} • {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </p>
        </div>
        
        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={clsx(
                'flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                location.pathname === item.to
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={handleSignOut}
            className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-700 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}