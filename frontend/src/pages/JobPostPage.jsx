import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import JobPost from '../components/JobPost';
import { Briefcase, ArrowLeft, Loader, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const JobPostPage = () => {
  const { jobId } = useParams();
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData(['authUser']);

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

  if (isLoading) {
    return (
      <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
        <div className='hidden lg:block lg:col-span-1'>
          <div className='space-y-6'>
            <Sidebar user={authUser} />
          </div>
        </div>
        
        <div className='col-span-1 lg:col-span-3 order-first lg:order-none'>
          <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow">
            <Loader className="animate-spin h-10 w-10 text-primary mb-4" />
            <span className="text-lg text-info font-medium">Loading job post...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !jobPost) {
    return (
      <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
        <div className='hidden lg:block lg:col-span-1'>
          <div className='space-y-6'>
            <Sidebar user={authUser} />
          </div>
        </div>
        
        <div className='col-span-1 lg:col-span-3 order-first lg:order-none'>
          <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow">
            <XCircle className="h-12 w-12 text-gray-400 mb-3" />
            <span className="text-xl font-semibold text-gray-500">Job post not found</span>
            <span className="text-info mt-1">The job post you are looking for does not exist or was removed.</span>
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
      {/* Sidebar */}
      <div className='hidden lg:block lg:col-span-1'>
        <div className='space-y-6'>
          <Sidebar user={authUser} />
          
          {/* Navigation */}
          <div className='bg-white rounded-lg shadow p-6'>
            <Link
              to='/jobs'
              className='flex items-center gap-2 text-red-500 hover:text-red-600 transition-colors'
            >
              <ArrowLeft size={16} />
              Back to Job Board
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='col-span-1 lg:col-span-3 order-first lg:order-none'>
        {/* Job Post */}
        <JobPost jobPost={jobPost} isDetailPage={true} />
      </div>
    </div>
  );
};

export default JobPostPage;