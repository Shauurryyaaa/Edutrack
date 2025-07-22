import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Assignment } from '../types';
import { Calendar, Clock, BookOpen, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Dashboard() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignments();
  }, [user]);

  const fetchAssignments = async () => {
    try {
      let query = supabase
        .from('assignments')
        .select('*, teacher:users!assignments_created_by_fkey(*)')
        .order('created_at', { ascending: false });

      if (user?.role === 'teacher') {
        query = query.eq('created_by', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      setAssignments(data || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {user?.role === 'teacher' ? 'My Assignments' : 'Available Assignments'}
        </h1>
        <p className="text-gray-600 mt-2">
          {user?.role === 'teacher' 
            ? 'Manage and track your assignments' 
            : 'View and submit your assignments'
          }
        </p>
      </div>

      {user?.role === 'teacher' && (
        <div className="mb-6">
          <Link
            to="/create-assignment"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create New Assignment
          </Link>
        </div>
      )}

      {assignments.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-500 mb-2">
            {user?.role === 'teacher' ? 'No assignments created yet' : 'No assignments available'}
          </h2>
          <p className="text-gray-400">
            {user?.role === 'teacher' 
              ? 'Create your first assignment to get started'
              : 'Check back later for new assignments'
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {assignment.title}
                </h3>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  isOverdue(assignment.due_date)
                    ? 'bg-red-100 text-red-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {isOverdue(assignment.due_date) ? 'Overdue' : 'Active'}
                </div>
              </div>

              <p className="text-gray-600 mb-4 line-clamp-3">{assignment.description}</p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="w-4 h-4 mr-2" />
                  Due: {formatDate(assignment.due_date)}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="w-4 h-4 mr-2" />
                  Created: {formatDate(assignment.created_at)}
                </div>
                {user?.role === 'student' && assignment.teacher && (
                  <div className="flex items-center text-sm text-gray-500">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Teacher: {assignment.teacher.full_name}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-sm font-medium text-blue-600">
                  {assignment.max_points} points
                </span>
                {user?.role === 'student' ? (
                  <Link
                    to={`/submit/${assignment.id}`}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Submit
                  </Link>
                ) : (
                  <Link
                    to={`/assignment/${assignment.id}/submissions`}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                  >
                    View Submissions
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}