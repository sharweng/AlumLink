import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';
import { Calendar, Bell, BellOff, Loader } from 'lucide-react';
import EventPost from '../components/event/EventPost';
import Sidebar from '../components/Sidebar';

const MyEventsPage = () => {
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData(['authUser']);
  const [activeTab, setActiveTab] = useState('going'); // 'going', 'interested', or 'all'

  const { data: myEvents, isLoading } = useQuery({
    queryKey: ['myEvents'],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get('/events/my-events');
        return res.data;
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to fetch your events');
        throw error;
      }
    },
  });

  // Filter events based on active tab
  const filteredEvents = myEvents?.filter(event => {
    const userAttendee = event.attendees.find(
      attendee => attendee.user._id === authUser._id
    );
    
    if (activeTab === 'all') {
      return true; // Show all events
    }
    
    // For going and interested tabs, only show upcoming/ongoing events
    const isActiveEvent = event.status === 'upcoming' || event.status === 'ongoing';
    return userAttendee?.rsvpStatus === activeTab && isActiveEvent;
  }) || [];

  const goingEvents = myEvents?.filter(event => {
    const userAttendee = event.attendees.find(
      attendee => attendee.user._id === authUser._id
    );
    const isActiveEvent = event.status === 'upcoming' || event.status === 'ongoing';
    return userAttendee?.rsvpStatus === 'going' && isActiveEvent;
  }) || [];

  const interestedEvents = myEvents?.filter(event => {
    const userAttendee = event.attendees.find(
      attendee => attendee.user._id === authUser._id
    );
    const isActiveEvent = event.status === 'upcoming' || event.status === 'ongoing';
    return userAttendee?.rsvpStatus === 'interested' && isActiveEvent;
  }) || [];

  const allEventsCount = myEvents?.length || 0;

  // Check if user has reminder enabled for an event
  const hasReminder = (event, userId) => {
    const userAttendee = event.attendees.find(
      attendee => attendee.user._id === userId
    );
    return userAttendee?.reminderEnabled || false;
  };

  const toggleReminder = useMutation({
    mutationFn: async ({ eventId, enable }) => {
      const res = await axiosInstance.post(`/events/${eventId}/reminder`, { enable });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['myEvents'] });
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update reminder');
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
          <h1 className="text-3xl font-bold flex items-center gap-2 mb-4">
            <Calendar className="text-primary" />
            My Events
          </h1>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow mb-4">
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('going')}
                className={`flex-1 px-6 py-3 font-semibold transition-colors ${
                  activeTab === 'going'
                    ? 'text-primary border-b-2 border-primary bg-primary/5'
                    : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                }`}
              >
                Going ({goingEvents.length})
              </button>
              <button
                onClick={() => setActiveTab('interested')}
                className={`flex-1 px-6 py-3 font-semibold transition-colors ${
                  activeTab === 'interested'
                    ? 'text-primary border-b-2 border-primary bg-primary/5'
                    : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                }`}
              >
                Interested ({interestedEvents.length})
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 px-6 py-3 font-semibold transition-colors ${
                  activeTab === 'all'
                    ? 'text-primary border-b-2 border-primary bg-primary/5'
                    : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                }`}
              >
                All ({allEventsCount})
              </button>
            </div>
          </div>

          {/* Info about reminders */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2">
              <Bell className="text-blue-600 mt-0.5" size={20} />
              <div className="flex-1">
                <p className="text-sm text-blue-800">
                  <strong>Reminders:</strong> Events you're going to have reminders automatically enabled. 
                  You'll be notified one day before the event. You can enable or disable reminders for any event.
                  {activeTab === 'all' && ' Note: Reminders are not available for completed or cancelled events.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Events List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          {isLoading ? (
            <div className="col-span-full text-center py-8">
              <Loader className="animate-spin h-12 w-12 text-primary mx-auto" />
            </div>
          ) : filteredEvents.length > 0 ? (
            filteredEvents.map((event) => {
              const userAttendee = event.attendees.find(
                attendee => attendee.user._id === authUser._id
              );
              const isGoing = userAttendee?.rsvpStatus === 'going';
              const reminderEnabled = hasReminder(event, authUser._id);
              const canHaveReminder = event.status === 'upcoming' || event.status === 'ongoing';

              return (
                <div key={event._id} className="relative">
                  <EventPost event={event} />
                  
                  {/* Reminder Button Overlay - Only show for upcoming/ongoing events */}
                  {canHaveReminder && (
                    <div className="absolute top-4 right-4 z-10">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleReminder.mutate({ 
                            eventId: event._id, 
                            enable: !reminderEnabled 
                          });
                        }}
                        disabled={toggleReminder.isPending}
                        className={`p-2 rounded-full shadow-lg transition-colors ${
                          reminderEnabled
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                        } ${
                          toggleReminder.isPending ? 'opacity-50' : ''
                        }`}
                        title={
                          reminderEnabled
                            ? 'Reminder enabled (1 day before) - Click to disable'
                            : 'Reminder disabled - Click to enable (1 day before)'
                        }
                      >
                        {toggleReminder.isPending ? (
                          <Loader className="animate-spin" size={20} />
                        ) : reminderEnabled ? (
                          <Bell size={20} />
                        ) : (
                          <BellOff size={20} />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-12">
              <Calendar className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                No {activeTab === 'all' ? '' : activeTab} events
              </h3>
              <p className="text-gray-500">
                {activeTab === 'going'
                  ? "You haven't RSVP'd to any upcoming events yet."
                  : activeTab === 'interested'
                  ? "You haven't marked any upcoming events as interested yet."
                  : "You don't have any events."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyEventsPage;
