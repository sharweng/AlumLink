import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import { 
  Briefcase, 
  ArrowLeft, 
  Loader, 
  XCircle, 
  MapPin, 
  Building, 
  Clock, 
  Users, 
  Calendar,
  PhilippinePeso,
  ExternalLink,
  Share2,
  Edit,
  Trash2,
  MoreVertical,
  X,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import JobPostEdit from '../components/job/JobPostEdit';

const JobPostPage = () => {
  const { jobId } = useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const authUser = queryClient.getQueryData(['authUser']);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showApplyConfirm, setShowApplyConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const { data: jobPost, isLoading, error } = useQuery({
    queryKey: ['jobPost', jobId],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get(`/jobs/${jobId}`);
        return res.data;
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load job post');
        throw error;
      }
    },
    enabled: !!jobId,
  });

  const isOwner = jobPost && authUser._id === jobPost.author._id;
  const hasApplied = jobPost?.applicants?.some(applicant => {
    const applicantUserId = typeof applicant.user === 'object' ? applicant.user._id : applicant.user;
    return applicantUserId === authUser._id;
  });

  // Apply mutation
  const { mutate: applyToJob, isPending: isApplying } = useMutation({
    mutationFn: async () => {
      await axiosInstance.post(`/jobs/${jobPost._id}/apply`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobPost', jobPost._id] });
      toast.success('Successfully applied to the job!');
      setShowApplyConfirm(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to apply');
      setShowApplyConfirm(false);
    }
  });

  // Cancel application mutation
  const { mutate: cancelApplication, isPending: isCancelling } = useMutation({
    mutationFn: async () => {
      await axiosInstance.post(`/jobs/${jobPost._id}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobPost', jobPost._id] });
      toast.success('Application cancelled');
      setShowCancelConfirm(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to cancel application');
      setShowCancelConfirm(false);
    }
  });

  // Delete mutation
  const { mutate: deleteJobPost, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      await axiosInstance.delete(`/jobs/${jobPost._id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobPosts'] });
      toast.success('Job post deleted successfully');
      navigate('/jobs');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete job post');
    }
  });

  const handleShare = () => {
    toast.success('Share functionality coming soon!');
    setShowDropdown(false);
  };

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

  if (isLoading) {
    return (
      <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
        <div className='lg:col-span-1'>
          <Sidebar user={authUser} />
        </div>
        
        <div className='lg:col-span-3'>
          <div className='flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow'>
            <Loader className='animate-spin h-10 w-10 text-primary mb-4' />
            <span className='text-lg text-info font-medium'>Loading job post...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !jobPost) {
    return (
      <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
        <div className='lg:col-span-1'>
          <Sidebar user={authUser} />
        </div>
        
        <div className='lg:col-span-3'>
          <div className='flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow'>
            <XCircle className='h-12 w-12 text-gray-400 mb-3' />
            <span className='text-xl font-semibold text-gray-500'>Job post not found</span>
            <span className='text-info mt-1'>The job post you are looking for does not exist or was removed.</span>
            <Link
              to='/jobs'
              className='inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors mt-4'
            >
              <ArrowLeft size={16} />
              Back to Job Board
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
      <div className='lg:col-span-1'>
        <Sidebar user={authUser} />
      </div>

      <div className='lg:col-span-3'>
        {/* Back Button */}
        <Link
          to='/jobs'
          className='inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors'
        >
          <ArrowLeft size={16} />
          Back to Job Board
        </Link>

        {/* Job Post Detail */}
        <div className='bg-white rounded-lg shadow border border-gray-200 p-6'>
          {/* Header */}
          <div className='flex items-start justify-between mb-6'>
            <div className='flex items-start gap-3 flex-1'>
              <img
                src={jobPost.author.profilePicture || '/avatar.png'}
                alt={jobPost.author.name}
                className='w-12 h-12 rounded-full object-cover'
              />
              <div>
                <h3 className='font-semibold text-gray-900'>{jobPost.author.name}</h3>
                <p className='text-sm text-gray-600'>{jobPost.author.headline}</p>
                <p className='text-xs text-gray-500'>
                  {formatDistanceToNow(new Date(jobPost.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>

            {/* Actions Menu */}
            <div className='relative ml-2 flex-shrink-0'>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className='p-1 hover:bg-green-50 rounded-full transition-colors'
              >
                <MoreVertical size={18} className='text-green-600' />
              </button>

              {showDropdown && (
                <>
                  <div 
                    className='fixed inset-0 z-10' 
                    onClick={() => setShowDropdown(false)}
                  />
                  <div className='dropdown-menu absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20'>
                    <button
                      onClick={handleShare}
                      className='w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2'
                    >
                      <Share2 size={16} />
                      Share
                    </button>
                    {isOwner && (
                      <>
                        <button
                          onClick={() => {
                            setShowEditModal(true);
                            setShowDropdown(false);
                          }}
                          className='w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2'
                        >
                          <Edit size={16} />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this job post?')) {
                              deleteJobPost();
                            }
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

          {/* Job Title and Badges */}
          <div className='mb-4'>
            <div className='flex items-center gap-2 mb-3'>
              <h1 className='text-2xl font-bold text-gray-900'>{jobPost.title}</h1>
              {hasApplied && (
                <span className='px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium'>
                  ✓ Applied
                </span>
              )}
            </div>
            <div className='flex flex-wrap gap-2'>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getJobTypeStyle(jobPost.type)}`}>
                {formatJobType(jobPost.type)}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getWorkTypeStyle(jobPost.workType)}`}>
                {jobPost.workType.charAt(0).toUpperCase() + jobPost.workType.slice(1)}
              </span>
              {jobPost.salary && formatSalary(jobPost.salary) && (
                <span className='px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 flex items-center gap-1'>
                  <PhilippinePeso size={14} />
                  {formatSalary(jobPost.salary)}
                </span>
              )}
            </div>
          </div>

          {/* Company and Location */}
          <div className='flex flex-wrap items-center gap-4 text-gray-600 mb-6 pb-6 border-b border-gray-200'>
            <div className='flex items-center gap-2'>
              <Building size={18} />
              <span className='font-medium'>{jobPost.company}</span>
            </div>
            <div className='flex items-center gap-2'>
              <MapPin size={18} />
              <span>{jobPost.location}</span>
            </div>
            {jobPost.duration && (
              <div className='flex items-center gap-2'>
                <Clock size={18} />
                <span>{jobPost.duration}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className='mb-6'>
            <h2 className='text-lg font-semibold mb-3'>Job Description</h2>
            <p className='text-gray-700 whitespace-pre-wrap'>{jobPost.description}</p>
          </div>

          {/* Skills */}
          {jobPost.skills && jobPost.skills.length > 0 && (
            <div className='mb-6'>
              <h2 className='text-lg font-semibold mb-3'>Required Skills</h2>
              <div className='flex flex-wrap gap-2'>
                {jobPost.skills.map((skill, index) => (
                  <span
                    key={index}
                    className='px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm'
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Requirements */}
          {jobPost.requirements && (
            <div className='mb-6'>
              <h2 className='text-lg font-semibold mb-3'>Requirements</h2>
              <p className='text-gray-700 whitespace-pre-wrap'>{jobPost.requirements}</p>
            </div>
          )}

          {/* Application Info */}
          <div className='flex items-center justify-between p-4 bg-gray-50 rounded-lg border-t border-gray-200'>
            <div className='flex items-center gap-4 text-sm text-gray-600'>
              <div className='flex items-center gap-2'>
                <Users size={18} />
                <span>{jobPost.applicants?.length || 0} applicants</span>
              </div>
              {jobPost.applicationDeadline && (
                <div className='flex items-center gap-2'>
                  <Calendar size={18} />
                  <span>Deadline: {new Date(jobPost.applicationDeadline).toLocaleDateString()}</span>
                </div>
              )}
            </div>
            
            {!isOwner && (
              <div className='flex gap-2'>
                {jobPost.applicationUrl && (
                  <a
                    href={jobPost.applicationUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                  >
                    <ExternalLink size={16} />
                    Visit Website
                  </a>
                )}
                {!hasApplied ? (
                  <button
                    onClick={() => setShowApplyConfirm(true)}
                    className='flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors'
                  >
                    <Briefcase size={16} />
                    Apply Now
                  </button>
                ) : (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className='flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors'
                  >
                    <X size={16} />
                    Cancel Application
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Edit Modal */}
        {showEditModal && (
          <JobPostEdit 
            jobPost={jobPost} 
            onClose={() => setShowEditModal(false)} 
          />
        )}

        {/* Apply Confirmation Modal */}
        {showApplyConfirm && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
            <div className='bg-white rounded-lg p-6 max-w-md w-full mx-4'>
              <h3 className='text-lg font-semibold mb-4'>Confirm Application</h3>
              <p className='text-gray-600 mb-6'>
                Are you sure you want to apply for this position? This will add you to the applicants list.
              </p>
              <div className='flex gap-3 justify-end'>
                <button
                  onClick={() => setShowApplyConfirm(false)}
                  className='px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors'
                >
                  Cancel
                </button>
                <button
                  onClick={() => applyToJob()}
                  disabled={isApplying}
                  className='px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2'
                >
                  {isApplying && (
                    <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                  )}
                  {isApplying ? 'Applying...' : 'Yes, Apply'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Application Confirmation Modal */}
        {showCancelConfirm && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
            <div className='bg-white rounded-lg p-6 max-w-md w-full mx-4'>
              <h3 className='text-lg font-semibold mb-4'>Cancel Application</h3>
              <p className='text-gray-600 mb-6'>
                Are you sure you want to cancel your application? The job poster will be notified of the cancellation.
              </p>
              <div className='flex gap-3 justify-end'>
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className='px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors'
                >
                  Keep Application
                </button>
                <button
                  onClick={() => cancelApplication()}
                  disabled={isCancelling}
                  className='px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2'
                >
                  {isCancelling && (
                    <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                  )}
                  {isCancelling ? 'Cancelling...' : 'Yes, Cancel'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobPostPage;