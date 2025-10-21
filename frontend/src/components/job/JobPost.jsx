import { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { axiosInstance } from '../../lib/axios';
import toast from 'react-hot-toast';
import { 
  Share2, 
  Trash2, 
  Edit, 
  MapPin, 
  Building, 
  Users, 
  Calendar,
  PhilippinePeso,
  MoreVertical,
  Flag,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import JobPostEdit from './JobPostEdit';
import { Link, useNavigate } from 'react-router-dom';
import ConfirmModal from '../common/ConfirmModal';
import FeedbackModal from '../common/FeedbackModal';
import ReportModal from '../common/ReportModal';

const JobPost = ({ jobPost, isDetailPage = false }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const authUser = queryClient.getQueryData(['authUser']);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  
  const isOwner = authUser._id === jobPost.author._id;
  const hasApplied = jobPost.applicants?.some(applicant => {
    const applicantUserId = typeof applicant.user === 'object' ? applicant.user._id : applicant.user;
    return applicantUserId === authUser._id;
  });

  const handleCardClick = (e) => {
    // Don't navigate if clicking on buttons, links, dropdown menu, or if modal is open
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('.dropdown-menu') || showEditModal || isDetailPage) {
      return;
    }
    navigate(`/job/${jobPost._id}`);
  };

  const handleShare = () => {
    // Share functionality to be implemented later
    toast.success('Share functionality coming soon!');
    setShowDropdown(false);
  };

  // Delete mutation
  const { mutate: deleteJobPost, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      await axiosInstance.delete(`/jobs/${jobPost._id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobPosts'] });
      queryClient.invalidateQueries({ queryKey: ['jobPost', jobPost._id] });
      setShowDeleteConfirm(false);
      toast.success('Job post deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete job post');
    }
  });

  // We'll use ReportModal to submit reports
  const [showReportModal, setShowReportModal] = useState(false);

  const getJobTypeStyle = (type) => {
    const styles = {
      job: 'bg-green-100 text-green-800',
      'part-time': 'bg-yellow-100 text-yellow-800',
      internship: 'bg-blue-100 text-blue-800',
      freelance: 'bg-purple-100 text-purple-800'
    };
    return styles[type] || 'bg-gray-100 text-gray-800';
  };

  const getWorkTypeStyle = (workType) => {
    const styles = {
      remote: 'bg-indigo-100 text-indigo-800',
      onsite: 'bg-orange-100 text-orange-800',
      hybrid: 'bg-teal-100 text-teal-800'
    };
    return styles[workType] || 'bg-gray-100 text-gray-800';
  };

  const formatJobType = (type) => {
    const labels = {
      job: 'Full-time',
      'part-time': 'Part-time',
      internship: 'Internship',
      freelance: 'Freelance'
    };
    return labels[type] || type.charAt(0).toUpperCase() + type.slice(1);
  };

  const formatSalary = (salary) => {
    if (!salary || (!salary.min && !salary.max)) return null;
    const currency = salary.currency || 'PHP';
    if (salary.min && salary.max) {
      return `${currency} ${salary.min.toLocaleString()} - ${salary.max.toLocaleString()}`;
    }
    if (salary.min) return `${currency} ${salary.min.toLocaleString()}+`;
    if (salary.max) return `Up to ${currency} ${salary.max.toLocaleString()}`;
  };

  return (
    <div 
      className='bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200 p-4 cursor-pointer'
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className='flex items-start justify-between mb-3'>
        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-2 mb-1'>
            <h3 className='text-lg font-bold text-gray-900 hover:text-primary transition-colors truncate'>
              {jobPost.title}
            </h3>
            {hasApplied && (
              <span className='px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-medium flex-shrink-0'>
                Applied
              </span>
            )}
          </div>
          <div className='flex items-center gap-2 text-sm text-gray-600 mb-2'>
            <Building size={14} className='flex-shrink-0' />
            <span className='font-medium truncate'>{jobPost.company}</span>
            <span className='flex-shrink-0'>•</span>
            <MapPin size={14} className='flex-shrink-0' />
            <span className='truncate'>{jobPost.location}</span>
          </div>
          <div className='flex flex-wrap gap-2'>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getJobTypeStyle(jobPost.type)}`}>
              {formatJobType(jobPost.type)}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getWorkTypeStyle(jobPost.workType)}`}>
              {jobPost.workType.charAt(0).toUpperCase() + jobPost.workType.slice(1)}
            </span>
            {jobPost.salary && formatSalary(jobPost.salary) && (
              <span className='px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 flex items-center gap-1'>
                <PhilippinePeso size={12} />
                {formatSalary(jobPost.salary)}
              </span>
            )}
          </div>

          {/* Skills Preview */}
          {jobPost.skills && jobPost.skills.length > 0 && (
            <div className='flex flex-wrap gap-1 mt-2'>
              {jobPost.skills.slice(0, 3).map((skill, index) => (
                <span
                  key={index}
                  className='px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs'
                >
                  {skill}
                </span>
              ))}
              {jobPost.skills.length > 3 && (
                <span className='px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs'>
                  +{jobPost.skills.length - 3} others
                </span>
              )}
            </div>
          )}
        </div>

        {/* Actions Menu */}
        <div className='relative ml-2 flex-shrink-0'>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDropdown(!showDropdown);
            }}
            className='p-1 hover:bg-gray-50 rounded-full transition-colors'
          >
            <MoreVertical size={18} className='text-gray-700' />
          </button>

          {showDropdown && (
            <>
              <div 
                className='fixed inset-0 z-10' 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDropdown(false);
                }}
              />
              <div className='dropdown-menu absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20'>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShare();
                  }}
                  className='w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2'
                >
                  <Share2 size={16} />
                  Share
                </button>
                {!isOwner && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowReportModal(true);
                      setShowDropdown(false);
                    }}
                    className='w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2'
                  >
                    <Flag size={16} className='text-red-500' />
                    Report
                  </button>
                )}
                {isOwner && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowEditModal(true);
                        setShowDropdown(false);
                      }}
                      className='w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2'
                    >
                      <Edit size={16} />
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteConfirm(true);
                        setShowDropdown(false);
                      }}
                      disabled={isDeleting}
                      className='w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50'
                    >
                      {isDeleting ? (
                        <div className='w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin' />
                      ) : (
                        <Trash2 size={16} />
                      )}
                      Delete
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className='flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100'>
        <div className='flex items-center gap-3'>
          <div className='flex items-center gap-1'>
            <Users size={14} />
            <span>{jobPost.applicants?.length || 0} applicants</span>
          </div>
          {jobPost.applicationDeadline && (
            <div className='flex items-center gap-1'>
              <Calendar size={14} />
              <span>Deadline: {new Date(jobPost.applicationDeadline).toLocaleDateString()}</span>
            </div>
          )}
        </div>
        <span className='text-gray-400'>{formatDistanceToNow(new Date(jobPost.createdAt), { addSuffix: true })}</span>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <JobPostEdit 
          jobPost={jobPost} 
          onClose={() => setShowEditModal(false)} 
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => deleteJobPost()}
        title="Delete Job Post"
        message="Are you sure you want to delete this job post? This action cannot be undone and all applicant data will be removed."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
        loadingText="Deleting..."
        confirmButtonClass="bg-red-500 hover:bg-red-600"
      />

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        defaultType='job'
        targetId={jobPost._id}
      />

      {/* Feedback modal (optional quick access from card) */}
      {showFeedbackModal && (
        <FeedbackModal isOpen={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} />
      )}
    </div>
  );
};

export default JobPost;