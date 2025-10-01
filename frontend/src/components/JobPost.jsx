import { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Trash2, 
  Edit, 
  MapPin, 
  Building, 
  Clock, 
  DollarSign, 
  Users, 
  Eye,
  ExternalLink,
  Briefcase,
  Calendar,
  Send,
  X
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import JobPostEdit from './JobPostEdit';

const JobPost = ({ jobPost }) => {
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData(['authUser']);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const isOwner = authUser._id === jobPost.author._id;
  const isLiked = jobPost.likes?.includes(authUser._id);
  const hasApplied = jobPost.applicants?.some(applicant => applicant.user === authUser._id);

  // Like mutation
  const { mutate: likeJobPost, isPending: isLiking } = useMutation({
    mutationFn: async () => {
      await axiosInstance.post(`/jobs/${jobPost._id}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobPosts'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to like job post');
    }
  });

  // Comment mutation
  const { mutate: commentOnJobPost, isPending: isCommenting } = useMutation({
    mutationFn: async (comment) => {
      await axiosInstance.post(`/jobs/${jobPost._id}/comment`, { content: comment });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobPosts'] });
      setNewComment('');
      toast.success('Comment added successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add comment');
    }
  });

  // Apply mutation
  const { mutate: applyToJob, isPending: isApplying } = useMutation({
    mutationFn: async () => {
      await axiosInstance.post(`/jobs/${jobPost._id}/apply`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobPosts'] });
      toast.success('Application submitted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to submit application');
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
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete job post');
    }
  });

  const handleComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    commentOnJobPost(newComment);
  };

  const getJobTypeStyle = (type) => {
    const styles = {
      job: 'bg-green-100 text-green-800',
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

  const formatSalary = (salary) => {
    if (!salary || (!salary.min && !salary.max)) return null;
    const currency = salary.currency || 'USD';
    if (salary.min && salary.max) {
      return `${currency} ${salary.min.toLocaleString()} - ${salary.max.toLocaleString()}`;
    }
    if (salary.min) return `${currency} ${salary.min.toLocaleString()}+`;
    if (salary.max) return `Up to ${currency} ${salary.max.toLocaleString()}`;
  };

  return (
    <div className='bg-white rounded-lg shadow border border-gray-200 p-6'>
      {/* Header */}
      <div className='flex items-start justify-between mb-4'>
        <div className='flex items-start gap-3'>
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
        
        <div className='flex items-center gap-2'>
          {isOwner && (
            <>
              <button 
                onClick={() => setShowEditModal(true)}
                className='p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors'
              >
                <Edit size={18} />
              </button>
              <button
                onClick={() => deleteJobPost()}
                disabled={isDeleting}
                className='p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50'
              >
                {isDeleting ? <div className='w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin' /> : <Trash2 size={18} />}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Job Details */}
      <div className='mb-4'>
        <div className='flex items-center gap-2 mb-2'>
          <h2 className='text-xl font-bold text-gray-900'>{jobPost.title}</h2>
          <div className='flex gap-2'>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getJobTypeStyle(jobPost.type)}`}>
              {jobPost.type.charAt(0).toUpperCase() + jobPost.type.slice(1)}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getWorkTypeStyle(jobPost.workType)}`}>
              {jobPost.workType.charAt(0).toUpperCase() + jobPost.workType.slice(1)}
            </span>
          </div>
        </div>

        <div className='flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3'>
          <div className='flex items-center gap-1'>
            <Building size={16} />
            <span>{jobPost.company}</span>
          </div>
          <div className='flex items-center gap-1'>
            <MapPin size={16} />
            <span>{jobPost.location}</span>
          </div>
          {jobPost.duration && (
            <div className='flex items-center gap-1'>
              <Clock size={16} />
              <span>{jobPost.duration}</span>
            </div>
          )}
          {formatSalary(jobPost.salary) && (
            <div className='flex items-center gap-1'>
              <DollarSign size={16} />
              <span>{formatSalary(jobPost.salary)}</span>
            </div>
          )}
        </div>

        {/* Skills */}
        {jobPost.skills && jobPost.skills.length > 0 && (
          <div className='mb-3'>
            <div className='flex flex-wrap gap-2'>
              {jobPost.skills.map((skill, index) => (
                <span
                  key={index}
                  className='px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs'
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        <div className='mb-3'>
          <p className='text-gray-700 whitespace-pre-wrap'>
            {showFullDescription || jobPost.description.length <= 200
              ? jobPost.description
              : `${jobPost.description.substring(0, 200)}...`}
          </p>
          {jobPost.description.length > 200 && (
            <button
              onClick={() => setShowFullDescription(!showFullDescription)}
              className='text-red-500 hover:text-red-600 text-sm mt-1'
            >
              {showFullDescription ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>

        {/* Application Info */}
        <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
          <div className='flex items-center gap-4 text-sm text-gray-600'>
            <div className='flex items-center gap-1'>
              <Users size={16} />
              <span>{jobPost.applicants?.length || 0} applicants</span>
            </div>
            <div className='flex items-center gap-1'>
              <Eye size={16} />
              <span>{jobPost.views || 0} views</span>
            </div>
            {jobPost.applicationDeadline && (
              <div className='flex items-center gap-1'>
                <Calendar size={16} />
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
                  className='flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors'
                >
                  <ExternalLink size={14} />
                  Apply
                </a>
              )}
              {!hasApplied ? (
                <button
                  onClick={() => applyToJob()}
                  disabled={isApplying}
                  className='flex items-center gap-1 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors disabled:opacity-50'
                >
                  {isApplying ? (
                    <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                  ) : (
                    <Briefcase size={14} />
                  )}
                  {isApplying ? 'Applying...' : 'Quick Apply'}
                </button>
              ) : (
                <span className='px-3 py-1 bg-green-100 text-green-800 rounded text-sm'>
                  ✓ Applied
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className='flex items-center justify-between pt-4 border-t border-gray-200'>
        <div className='flex items-center gap-4'>
          <button
            onClick={() => likeJobPost()}
            disabled={isLiking}
            className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-colors ${
              isLiked 
                ? 'text-red-500 bg-red-50 hover:bg-red-100' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Heart size={18} className={isLiked ? 'fill-current' : ''} />
            <span>{jobPost.likes?.length || 0}</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className='flex items-center gap-2 px-3 py-1 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors'
          >
            <MessageCircle size={18} />
            <span>{jobPost.comments?.length || 0}</span>
          </button>

          <button className='flex items-center gap-2 px-3 py-1 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors'>
            <Share2 size={18} />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className='mt-4 pt-4 border-t border-gray-200'>
          {/* Add Comment */}
          <form onSubmit={handleComment} className='mb-4'>
            <div className='flex gap-3'>
              <img
                src={authUser.profilePicture || '/avatar.png'}
                alt='Your avatar'
                className='w-8 h-8 rounded-full object-cover'
              />
              <div className='flex-1'>
                <div className='flex gap-2'>
                  <input
                    type='text'
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder='Add a comment...'
                    className='flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent'
                  />
                  <button
                    type='submit'
                    disabled={isCommenting || !newComment.trim()}
                    className='px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50'
                  >
                    {isCommenting ? (
                      <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                    ) : (
                      <Send size={16} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Comments List */}
          <div className='space-y-3'>
            {jobPost.comments?.map((comment, index) => (
              <div key={index} className='flex gap-3'>
                <img
                  src={comment.user.profilePicture || '/avatar.png'}
                  alt={comment.user.name}
                  className='w-8 h-8 rounded-full object-cover'
                />
                <div className='flex-1 bg-gray-50 rounded-lg p-3'>
                  <div className='flex items-center justify-between mb-1'>
                    <h4 className='font-medium text-gray-900'>{comment.user.name}</h4>
                    <span className='text-xs text-gray-500'>
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className='text-gray-700'>{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <JobPostEdit 
          jobPost={jobPost} 
          onClose={() => setShowEditModal(false)} 
        />
      )}
    </div>
  );
};

export default JobPost;