import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';
import { MessageSquare, Plus, Search, Filter, Loader } from 'lucide-react';
import DiscussionPost from '../components/discussion/DiscussionPost';
import DiscussionCreation from '../components/discussion/DiscussionCreation';
import Sidebar from '../components/Sidebar';
// RecognitionWall moved to central Achievements page

const DiscussionForumsPage = () => {
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData(['authUser']);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('recent');

  const categories = ['All', 'General', 'Technical', 'Career', 'Events', 'Help', 'Other'];

  const { data: discussions, isLoading } = useQuery({
    queryKey: ['discussions', selectedCategory, searchTerm, sortBy],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (selectedCategory !== 'All') params.append('category', selectedCategory);
        if (searchTerm) params.append('search', searchTerm);
        if (sortBy) params.append('sort', sortBy);

        const res = await axiosInstance.get(`/discussions?${params.toString()}`);
        return res.data;
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to fetch discussions');
        throw error;
      }
    },
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="col-span-1 lg:col-span-1">
        <Sidebar user={authUser} />
      </div>
      
      <div className="col-span-1 lg:col-span-3">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <MessageSquare className="text-primary" />
              Discussion Forums
            </h1>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus size={20} />
            New Discussion
          </button>
        </div>

        {/* Create Discussion Form */}
        {showCreateForm && (
          <div className="mb-6">
            <DiscussionCreation onClose={() => setShowCreateForm(false)} />
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search discussions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="recent">Most Recent</option>
              <option value="mostLiked">Most Liked</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
        </div>
      </div>

      {/* Discussions List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <Loader className="animate-spin h-12 w-12 text-primary mx-auto" />
          </div>
        ) : discussions && discussions.length > 0 ? (
          discussions.map((discussion) => (
            <DiscussionPost key={discussion._id} discussion={discussion} />
          ))
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <MessageSquare size={64} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Discussions Found</h2>
            <p className="text-gray-600 mb-6">
              {searchTerm || selectedCategory !== 'All'
                ? 'Try adjusting your filters or search terms'
                : 'Be the first to start a discussion!'}
            </p>
            {!showCreateForm && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn btn-primary"
              >
                Create Discussion
              </button>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default DiscussionForumsPage;
