import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Assignment, Submission } from '../types';
import { Users, Calendar, FileText, Award, Download, ExternalLink } from 'lucide-react';

export function ViewSubmissions() {
  const { assignmentId } = useParams();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradingSubmission, setGradingSubmission] = useState<string | null>(null);

  useEffect(() => {
    fetchAssignmentAndSubmissions();
  }, [assignmentId]);

  const fetchAssignmentAndSubmissions = async () => {
    try {
      // Fetch assignment
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('assignments')
        .select('*')
        .eq('id', assignmentId)
        .eq('created_by', user!.id)
        .single();

      if (assignmentError) throw assignmentError;
      setAssignment(assignmentData);

      // Fetch submissions
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('submissions')
        .select('*, student:users!submissions_student_id_fkey(*)')
        .eq('assignment_id', assignmentId)
        .order('submitted_at', { ascending: false });

      if (submissionsError) throw submissionsError;
      setSubmissions(submissionsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmission = async (submissionId: string, grade: number, feedback: string) => {
    setGradingSubmission(submissionId);
    try {
      const { error } = await supabase
        .from('submissions')
        .update({
          grade,
          feedback,
          status: 'graded',
        })
        .eq('id', submissionId);

      if (error) throw error;

      // Refresh submissions
      await fetchAssignmentAndSubmissions();
    } catch (error) {
      console.error('Error grading submission:', error);
    } finally {
      setGradingSubmission(null);
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

  const getStatusColor = (status: string, grade?: number, maxPoints?: number) => {
    if (status === 'graded') {
      if (grade && maxPoints) {
        const percentage = (grade / maxPoints) * 100;
        if (percentage >= 90) return 'bg-green-100 text-green-800';
        if (percentage >= 80) return 'bg-blue-100 text-blue-800';
        if (percentage >= 70) return 'bg-yellow-100 text-yellow-800';
        return 'bg-red-100 text-red-800';
      }
      return 'bg-purple-100 text-purple-800';
    }
    return 'bg-orange-100 text-orange-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-500">Assignment not found</h2>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Assignment Submissions</h1>
        <p className="text-gray-600 mt-2">Review and grade student submissions</p>
      </div>

      {/* Assignment Details */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">{assignment.title}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="flex items-center text-gray-600">
            <Calendar className="w-5 h-5 mr-2" />
            <div>
              <div className="text-sm">Due Date</div>
              <div className="font-medium text-gray-900">{formatDate(assignment.due_date)}</div>
            </div>
          </div>
          
          <div className="flex items-center text-gray-600">
            <Award className="w-5 h-5 mr-2" />
            <div>
              <div className="text-sm">Max Points</div>
              <div className="font-medium text-gray-900">{assignment.max_points}</div>
            </div>
          </div>
          
          <div className="flex items-center text-gray-600">
            <Users className="w-5 h-5 mr-2" />
            <div>
              <div className="text-sm">Submissions</div>
              <div className="font-medium text-gray-900">{submissions.length}</div>
            </div>
          </div>
          
          <div className="flex items-center text-gray-600">
            <FileText className="w-5 h-5 mr-2" />
            <div>
              <div className="text-sm">Graded</div>
              <div className="font-medium text-gray-900">
                {submissions.filter(s => s.status === 'graded').length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submissions List */}
      {submissions.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-500 mb-2">No submissions yet</h2>
          <p className="text-gray-400">Students haven't submitted their work yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {submissions.map((submission) => (
            <SubmissionCard
              key={submission.id}
              submission={submission}
              assignment={assignment}
              onGrade={handleGradeSubmission}
              isGrading={gradingSubmission === submission.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface SubmissionCardProps {
  submission: Submission;
  assignment: Assignment;
  onGrade: (submissionId: string, grade: number, feedback: string) => Promise<void>;
  isGrading: boolean;
}

function SubmissionCard({ submission, assignment, onGrade, isGrading }: SubmissionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [grade, setGrade] = useState(submission.grade?.toString() || '');
  const [feedback, setFeedback] = useState(submission.feedback || '');

  const handleSubmitGrade = async () => {
    const numericGrade = parseInt(grade);
    if (isNaN(numericGrade) || numericGrade < 0 || numericGrade > assignment.max_points) {
      alert(`Grade must be between 0 and ${assignment.max_points}`);
      return;
    }
    await onGrade(submission.id, numericGrade, feedback);
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

  const getStatusColor = (status: string, grade?: number, maxPoints?: number) => {
    if (status === 'graded') {
      if (grade && maxPoints) {
        const percentage = (grade / maxPoints) * 100;
        if (percentage >= 90) return 'bg-green-100 text-green-800';
        if (percentage >= 80) return 'bg-blue-100 text-blue-800';
        if (percentage >= 70) return 'bg-yellow-100 text-yellow-800';
        return 'bg-red-100 text-red-800';
      }
      return 'bg-purple-100 text-purple-800';
    }
    return 'bg-orange-100 text-orange-800';
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {submission.student?.full_name}
          </h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            getStatusColor(submission.status, submission.grade, assignment.max_points)
          }`}>
            {submission.status === 'graded' ? (
              `Graded: ${submission.grade}/${assignment.max_points}`
            ) : (
              'Submitted'
            )}
          </span>
        </div>
        
        <div className="text-sm text-gray-500">
          Submitted: {formatDate(submission.submitted_at)}
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Student Response</h4>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-900 whitespace-pre-wrap">
            {isExpanded ? submission.content : `${submission.content.slice(0, 200)}${submission.content.length > 200 ? '...' : ''}`}
          </p>
          {submission.content.length > 200 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-blue-600 text-sm mt-2 hover:text-blue-500"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      </div>

      {submission.file_url && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Attached File</h4>
          <a
            href={submission.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Attachment
          </a>
        </div>
      )}

      {/* Grading Section */}
      <div className="pt-4 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor={`grade-${submission.id}`} className="block text-sm font-medium text-gray-700 mb-2">
              Grade (out of {assignment.max_points})
            </label>
            <input
              type="number"
              id={`grade-${submission.id}`}
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              min="0"
              max={assignment.max_points}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter grade"
            />
          </div>
          
          <div>
            <label htmlFor={`feedback-${submission.id}`} className="block text-sm font-medium text-gray-700 mb-2">
              Feedback (optional)
            </label>
            <textarea
              id={`feedback-${submission.id}`}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Provide feedback to the student"
            />
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSubmitGrade}
            disabled={isGrading || !grade.trim()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGrading ? 'Saving...' : (submission.status === 'graded' ? 'Update Grade' : 'Submit Grade')}
          </button>
        </div>
      </div>
    </div>
  );
}