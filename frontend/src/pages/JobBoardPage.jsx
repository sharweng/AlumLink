import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import JobPost from '../components/job/JobPost';
import JobPostCreation from '../components/job/JobPostCreation';
import { Briefcase, Search, Filter, Plus, Loader } from 'lucide-react';

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
  
  // Filter out job posts by banned authors or missing authors
  const jobPosts = jobPostsData?.jobPosts?.filter(j => j.author && !j.author?.banned) || [];

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
      <div className='lg:col-span-1'>
        <Sidebar user={authUser} />
      </div>
      
      <div className='lg:col-span-3'>
        {/* Header */}
        <div className='mb-6'>
          <div className='flex justify-between items-center mb-4'>
            <h1 className='text-3xl font-bold flex items-center gap-2'>
              <Briefcase className='text-primary' />
              Job & Internship Board
            </h1>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className='btn btn-primary flex items-center gap-2'
            >
              <Plus size={20} />
              Post Job
            </button>
          </div>

          {/* Create Job Form */}
          {showCreateForm && (
            <div className='mb-6'>
              <JobPostCreation onClose={() => setShowCreateForm(false)} />
            </div>
          )}

          {/* Search and Filters */}
          <div className='bg-white rounded-lg shadow p-4 mb-4'>
            <div className='grid grid-cols-1 gap-4'>
              {/* Search */}
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' size={20} />
                <input
                  type='text'
                  placeholder='Search jobs, companies, skills...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
                />
              </div>

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
                    Clear All
                  </button>
                )}
              </div>

              {/* Filters */}
              {showFilters && (
                <div className='pt-2 grid grid-cols-1 md:grid-cols-3 gap-4'>
                  <select
                    value={filters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
                  >
                    <option value='all'>All Types</option>
                    <option value='job'>Full-time Job</option>
                    <option value='part-time'>Part-time</option>
                    <option value='internship'>Internship</option>
                    <option value='freelance'>Freelance</option>
                  </select>
                  <select
                    value={filters.workType}
                    onChange={(e) => handleFilterChange('workType', e.target.value)}
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
                  >
                    <option value='all'>All Work Types</option>
                    <option value='remote'>Remote</option>
                    <option value='onsite'>On-site</option>
                    <option value='hybrid'>Hybrid</option>
                  </select>
                  <input
                    type='text'
                    placeholder='Location'
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Job Posts List */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 items-start'>
          {isLoading ? (
            <div className='col-span-full text-center py-8'>
              <Loader className='animate-spin h-12 w-12 text-primary mx-auto' />
            </div>
          ) : jobPosts.length > 0 ? (
            jobPosts.map(jobPost => (
              <JobPost key={jobPost._id} jobPost={jobPost} />
            ))
          ) : (
            <div className='col-span-full bg-white rounded-lg shadow p-8 text-center'>
              <Briefcase size={64} className='mx-auto text-gray-400 mb-4' />
              <h2 className='text-2xl font-bold mb-2'>No Jobs Found</h2>
              <p className='text-gray-600 mb-6'>
                {searchQuery || Object.values(filters).some(v => v && v !== 'all')
                  ? 'Try adjusting your filters or search terms'
                  : 'Be the first to post a job opportunity!'}
              </p>
              {!showCreateForm && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className='btn btn-primary'
                >
                  Post Job
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobBoardPage;