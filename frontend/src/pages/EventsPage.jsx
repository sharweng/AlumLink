import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';
import { Calendar, Plus, Search, Filter } from 'lucide-react';
import EventPost from '../components/event/EventPost';
import EventCreation from '../components/event/EventCreation';
import Sidebar from '../components/Sidebar';

const EventsPage = () => {
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData(['authUser']);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('upcoming');
  const [sortBy, setSortBy] = useState('upcoming');

  const types = ['All', 'Reunion', 'Webinar', 'Workshop'];
  const statuses = [
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'ongoing', label: 'Ongoing' },
    { value: 'completed', label: 'Completed' },
    { value: 'all', label: 'All Events' }
  ];

  const { data: events, isLoading } = useQuery({
    queryKey: ['events', selectedType, selectedStatus, searchTerm, sortBy],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (selectedType !== 'All') params.append('type', selectedType);
        if (selectedStatus) params.append('status', selectedStatus);
        if (searchTerm) params.append('search', searchTerm);
        if (sortBy) params.append('sort', sortBy);

        const res = await axiosInstance.get(`/events?${params.toString()}`);
        return res.data;
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to fetch events');
        throw error;
      }
    },
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-1">
        <Sidebar user={authUser} />
      </div>
      
      <div className="lg:col-span-3">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Calendar className="text-primary" />
              Events
            </h1>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus size={20} />
              Create Event
            </button>
          </div>

          {/* Create Event Form */}
          {showCreateForm && (
            <div className="mb-6">
              <EventCreation onClose={() => setShowCreateForm(false)} />
            </div>
          )}

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Type Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                >
                  {types.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {statuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="upcoming">Soonest First</option>
                <option value="latest">Recently Added</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>
        </div>

        {/* Events List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          {isLoading ? (
            <div className="col-span-full text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : events && events.length > 0 ? (
            events.map((event) => (
              <EventPost key={event._id} event={event} />
            ))
          ) : (
            <div className="col-span-full bg-white rounded-lg shadow p-8 text-center">
              <Calendar size={64} className="mx-auto text-gray-400 mb-4" />
              <h2 className="text-2xl font-bold mb-2">No Events Found</h2>
              <p className="text-gray-600 mb-6">
                {searchTerm || selectedType !== 'All'
                  ? 'Try adjusting your filters or search terms'
                  : 'Be the first to create an event!'}
              </p>
              {!showCreateForm && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="btn btn-primary"
                >
                  Create Event
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventsPage;
