import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Assignment, Submission } from '../types';
import { FileText, Upload, Calendar, Award } from 'lucide-react';

export function SubmitAssignment() {
  const { assignmentId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [existingSubmission, setExistingSubmission] = useState<Submission | null>(null);
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAssignment();
    checkExistingSubmission();
  }, [assignmentId, user]);

  const fetchAssignment = async () => {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*, teacher:users!assignments_created_by_fkey(*)')
        .eq('id', assignmentId)
        .single();

      if (error) throw error;
      setAssignment(data);
    } catch (error) {
      console.error('Error fetching assignment:', error);
      navigate('/dashboard');
    }
  };

  const checkExistingSubmission = async () => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('assignment_id', assignmentId)
        .eq('student_id', user!.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setExistingSubmission(data);
        setContent(data.content);
      }
    } catch (error) {
      console.error('Error checking existing submission:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user!.id}_${assignmentId}_${Date.now()}.${fileExt}`;
      const filePath = `submissions/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('assignments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('assignments')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let fileUrl = existingSubmission?.file_url;

      // Upload new file if selected
      if (file) {
        const uploadedUrl = await uploadFile(file);
        if (!uploadedUrl) {
          throw new Error('Failed to upload file');
        }
        fileUrl = uploadedUrl;
      }

      const submissionData = {
        assignment_id: assignmentId,
        student_id: user!.id,
        content,
        file_url: fileUrl,
        status: 'submitted' as const,
      };

      let result;
      if (existingSubmission) {
        // Update existing submission
        result = await supabase
          .from('submissions')
          .update({
            content,
            file_url: fileUrl,
            submitted_at: new Date().toISOString(),
          })
          .eq('id', existingSubmission.id);
      } else {
        // Create new submission
        result = await supabase
          .from('submissions')
          .insert([submissionData]);
      }

      if (result.error) throw result.error;

      navigate('/dashboard');
    } catch (error: any) {
      setError(error.message || 'Failed to submit assignment');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  if (!assignment) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Submit Assignment</h1>
        <p className="text-gray-600 mt-2">
          {existingSubmission ? 'Update your submission' : 'Submit your work for this assignment'}
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Assignment Details */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">{assignment.title}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center text-gray-600">
              <Calendar className="w-5 h-5 mr-2" />
              <div>
                <div className="text-sm">Due Date</div>
                <div className={`font-medium ${isOverdue(assignment.due_date) ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatDate(assignment.due_date)}
                  {isOverdue(assignment.due_date) && (
                    <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                      Overdue
                    </span>
                  )}
                </div>
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
              <FileText className="w-5 h-5 mr-2" />
              <div>
                <div className="text-sm">Teacher</div>
                <div className="font-medium text-gray-900">{assignment.teacher?.full_name}</div>
              </div>
            </div>
          </div>

          <div className="prose max-w-none">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Instructions</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{assignment.description}</p>
          </div>

          {existingSubmission && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center text-blue-700 mb-2">
                <FileText className="w-5 h-5 mr-2" />
                <span className="font-medium">Previous Submission</span>
              </div>
              <p className="text-blue-600 text-sm">
                Last submitted: {formatDate(existingSubmission.submitted_at)}
              </p>
              {existingSubmission.status === 'graded' && existingSubmission.grade && (
                <p className="text-blue-600 text-sm">
                  Grade: {existingSubmission.grade}/{assignment.max_points}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Submission Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md border border-gray-200 p-6 space-y-6">
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              Your Response
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your assignment response here..."
              required
            />
          </div>

          <div>
            <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
              Attach File (Optional)
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <Upload className="w-5 h-5 mr-2 text-gray-400" />
                <span className="text-sm text-gray-700">Choose File</span>
                <input
                  type="file"
                  id="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                />
              </label>
              {file && (
                <span className="text-sm text-gray-600">{file.name}</span>
              )}
              {existingSubmission?.file_url && !file && (
                <span className="text-sm text-blue-600">File previously uploaded</span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Accepted formats: PDF, Word, TXT, Images (max 10MB)
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || isOverdue(assignment.due_date)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading 
                ? (existingSubmission ? 'Updating...' : 'Submitting...') 
                : (existingSubmission ? 'Update Submission' : 'Submit Assignment')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}