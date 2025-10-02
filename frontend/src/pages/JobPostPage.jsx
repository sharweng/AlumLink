import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import JobPost from '../components/JobPost';
import { Briefcase, ArrowLeft } from 'lucide-react';
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
          <div className='bg-white rounded-lg shadow p-8 text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto'></div>
            <p className='mt-4 text-gray-600'>Loading job post...</p>
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
          <div className='bg-white rounded-lg shadow p-8 text-center'>
            <div className='mb-6'>
              <Briefcase size={64} className="mx-auto text-red-500" />
            </div>
            <h2 className='text-2xl font-bold mb-4 text-green-800'>Job Post Not Found</h2>
            <p className='text-gray-600 mb-6'>
              The job post you're looking for doesn't exist or has been removed.
            </p>
            <Link
              to='/jobs'
              className='inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors'
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