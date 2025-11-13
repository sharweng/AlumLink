import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../lib/axios';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import JobPost from '../components/job/JobPost';
import { Briefcase, Loader } from 'lucide-react';

const MyPostedJobsPage = () => {
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData(['authUser']);
  const [activeTab, setActiveTab] = useState('posted'); // 'posted' or 'applied'

  // Fetch posted jobs
  const { data: postedJobsData, isLoading: isLoadingPosted } = useQuery({
    queryKey: ['myPostedJobs'],
    queryFn: async () => {
      const res = await axiosInstance.get('/jobs/my-posts');
      return res.data;
    }
  });

  // Fetch applied jobs
  const { data: appliedJobsData, isLoading: isLoadingApplied } = useQuery({
    queryKey: ['myAppliedJobs'],
    queryFn: async () => {
      const res = await axiosInstance.get('/jobs/my-applications');
      return res.data;
    }
  });

  const postedJobs = postedJobsData?.jobPosts || [];
  const appliedJobs = appliedJobsData?.jobPosts || [];
  const isLoading = activeTab === 'posted' ? isLoadingPosted : isLoadingApplied;
  const jobPosts = activeTab === 'posted' ? postedJobs : appliedJobs;

  return (
    <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
      <div className='lg:col-span-1'>
        <Sidebar user={authUser} />
      </div>

      <div className='lg:col-span-3'>
        <div className='mb-6'>
          <h1 className='text-3xl font-bold flex items-center gap-2'>
            <Briefcase className='text-primary' />
            My Jobs
          </h1>
          <p className='text-gray-600 mt-2'>Manage your job postings and applications</p>
        </div>

        {/* Tabs */}
        <div className='mb-6 border-b border-gray-200'>
          <div className='flex gap-4'>
            <button
              onClick={() => {
                setActiveTab('posted');
              }}
              className={`pb-3 px-2 font-semibold transition-colors relative ${
                activeTab === 'posted'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Posted Jobs ({postedJobs.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('applied');
              }}
              className={`pb-3 px-2 font-semibold transition-colors relative ${
                activeTab === 'applied'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Applied Jobs ({appliedJobs.length})
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className='flex justify-center items-center py-12'>
            <Loader className='animate-spin h-12 w-12 text-primary' />
          </div>
        ) : jobPosts.length === 0 ? (
          <div className='bg-white rounded-lg shadow p-8 text-center'>
            <Briefcase size={64} className='mx-auto text-gray-400 mb-4' />
            <h2 className='text-2xl font-bold mb-2'>
              {activeTab === 'posted' ? 'No Posted Jobs' : 'No Applied Jobs'}
            </h2>
            <p className='text-gray-600 mb-6'>
              {activeTab === 'posted' 
                ? "You haven't posted any jobs yet" 
                : "You haven't applied to any jobs yet"}
            </p>
            <Link to='/jobs' className='btn btn-primary'>
              Go to Job Board
            </Link>
          </div>
        ) : activeTab === 'posted' ? (
          // Posted Jobs List - using JobPost component
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
            {jobPosts.map((job) => (
              <JobPost key={job._id} jobPost={job} />
            ))}
          </div>
        ) : (
          // Applied Jobs List - using JobPost component
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
            {jobPosts.map((job) => (
              <JobPost key={job._id} jobPost={job} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPostedJobsPage;
