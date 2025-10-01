import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import JobPost from '../components/JobPost';
import JobPostCreation from '../components/JobPostCreation';
import { Briefcase, Search, Filter, Plus } from 'lucide-react';

const JobBoardPage = () => {
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData(["authUser"]);
  
  const [filters, setFilters] = useState({
    type: 'all',
    workType: 'all',
    location: '',
    company: '',
    skills: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const { data: jobPostsData, isLoading } = useQuery({
    queryKey: ["jobPosts", filters, searchQuery],
    queryFn: async () => {
      try {
        let url = "/jobs";
        const params = new URLSearchParams();
        
        if (searchQuery) {
          url = "/jobs/search";
          params.append('query', searchQuery);
        } else {
          if (filters.type !== 'all') params.append('type', filters.type);
          if (filters.workType !== 'all') params.append('workType', filters.workType);
          if (filters.location) params.append('location', filters.location);
          if (filters.company) params.append('company', filters.company);
          if (filters.skills) params.append('skills', filters.skills);
        }
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
        
        const res = await axiosInstance.get(url);
        return res.data;
      } catch (error) {
        toast.error(error.response?.data?.message || "Something went wrong");
        return { jobPosts: [], total: 0 };
      }
    }
  });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // The search will automatically trigger due to the query dependency
  };

  const clearFilters = () => {
    setFilters({
      type: 'all',
      workType: 'all',
      location: '',
      company: '',
      skills: ''
    });
    setSearchQuery('');
  };

  return (
    <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
      {/* Sidebar with Stats */}
      <div className='hidden lg:block lg:col-span-1'>
        <div className='space-y-6'>
          <Sidebar user={authUser} />
          
          {/* Quick Stats moved under sidebar */}
          <div className='bg-white rounded-lg shadow p-6'>
            <h3 className='text-lg font-semibold mb-4'>Quick Stats</h3>
            <div className='space-y-3'>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Total Jobs</span>
                <span className='font-medium'>{jobPostsData?.total || 0}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>New This Week</span>
                <span className='font-medium'>-</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Companies</span>
                <span className='font-medium'>-</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Now takes full remaining width */}
      <div className='col-span-1 lg:col-span-3 order-first lg:order-none'>
        {/* Header */}
        <div className='bg-white rounded-lg shadow p-6 mb-6'>
          <div className='flex items-center justify-between mb-4'>
            <div className='flex items-center gap-3'>
              <h1 className='text-2xl font-bold'>Job & Internship Board</h1>
            </div>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className='bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2'
            >
              <Plus size={20} />
              Post Job
            </button>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className='mb-4'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' size={20} />
              <input
                type='text'
                placeholder='Search jobs, companies, skills...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent'
              />
            </div>
          </form>

          {/* Filter Toggle */}
          <div className='flex items-center justify-between'>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className='flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors'
            >
              <Filter size={20} />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            {(filters.type !== 'all' || filters.workType !== 'all' || filters.location || filters.company || filters.skills || searchQuery) && (
              <button
                onClick={clearFilters}
                className='text-red-500 hover:text-red-600 text-sm'
              >
                Clear All Filters
              </button>
            )}
          </div>

          {/* Filters */}
          {showFilters && (
            <div className='mt-4 p-4 bg-gray-50 rounded-lg grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Job Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className='w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent'
                >
                  <option value='all'>All Types</option>
                  <option value='job'>Full-time Job</option>
                  <option value='part-time'>Part-time Job</option>
                  <option value='internship'>Internship</option>
                  <option value='freelance'>Freelance</option>
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Work Type</label>
                <select
                  value={filters.workType}
                  onChange={(e) => handleFilterChange('workType', e.target.value)}
                  className='w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent'
                >
                  <option value='all'>All Work Types</option>
                  <option value='remote'>Remote</option>
                  <option value='onsite'>On-site</option>
                  <option value='hybrid'>Hybrid</option>
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Location</label>
                <input
                  type='text'
                  placeholder='Enter location'
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className='w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Company</label>
                <input
                  type='text'
                  placeholder='Enter company name'
                  value={filters.company}
                  onChange={(e) => handleFilterChange('company', e.target.value)}
                  className='w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent'
                />
              </div>
              <div className='md:col-span-2'>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Skills</label>
                <input
                  type='text'
                  placeholder='Enter skills (comma separated)'
                  value={filters.skills}
                  onChange={(e) => handleFilterChange('skills', e.target.value)}
                  className='w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent'
                />
              </div>
            </div>
          )}
        </div>

        {/* Job Post Creation Form */}
        {showCreateForm && (
          <div className='mb-6'>
            <JobPostCreation onClose={() => setShowCreateForm(false)} />
          </div>
        )}

        {/* Job Posts */}
        <div className='space-y-6'>
          {isLoading ? (
            <div className='bg-white rounded-lg shadow p-8 text-center'>
              <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto'></div>
              <p className='mt-4 text-gray-600'>Loading job posts...</p>
            </div>
          ) : jobPostsData?.jobPosts?.length > 0 ? (
            jobPostsData.jobPosts.map(jobPost => (
              <JobPost key={jobPost._id} jobPost={jobPost} />
            ))
          ) : (
            <div className='bg-white rounded-lg shadow p-8 text-center'>
              <div className='mb-6'>
                <Briefcase size={64} className="mx-auto text-red-500" />
              </div>
              <h2 className='text-2xl font-bold mb-4 '>No Job Posts Found</h2>
              <p className='text-gray-600 mb-6'>
                {searchQuery || Object.values(filters).some(v => v && v !== 'all')
                  ? 'Try adjusting your search criteria or filters.'
                  : 'Be the first to post a job opportunity!'}
              </p>
            </div>
          )}
        </div>

        {/* Results Summary */}
        {jobPostsData?.total && (
          <div className='mt-6 text-center text-gray-600'>
            Showing {jobPostsData.jobPosts.length} of {jobPostsData.total} job posts
          </div>
        )}
      </div>
    </div>
  );
};

export default JobBoardPage;