import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { axiosInstance } from "../../lib/axios";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { 
  Calendar, 
  MapPin, 
  Users, 
  Ticket,
  Video,
  Clock,
  Trash2,
  Edit,
  Check,
  X as XIcon,
  Loader
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

const EventPost = ({ event }) => {
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData(["authUser"]);
  const isOrganizer = authUser?._id === event.organizer._id;
  
  const userRsvp = event.attendees?.find(a => a.user._id === authUser?._id);
  const userStatus = userRsvp?.rsvpStatus;
  
  const goingCount = event.attendees?.filter(a => a.rsvpStatus === 'going').length || 0;
  const interestedCount = event.attendees?.filter(a => a.rsvpStatus === 'interested').length || 0;

  const { mutate: rsvpEvent, isPending: isRsvping } = useMutation({
    mutationFn: async (status) => {
      const response = await axiosInstance.post(`/events/${event._id}/rsvp`, { rsvpStatus: status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["event", event._id] });
      toast.success("RSVP updated successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update RSVP");
    },
  });

  const { mutate: deleteEvent, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      await axiosInstance.delete(`/events/${event._id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event deleted successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete event");
    },
  });

  const getStatusBadge = () => {
    const badges = {
      upcoming: 'bg-green-100 text-green-800',
      ongoing: 'bg-blue-100 text-blue-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return badges[event.status] || badges.upcoming;
  };

  const getStatusLabel = () => {
    return event.status.charAt(0).toUpperCase() + event.status.slice(1);
  };

  const formatTime12Hour = (time24) => {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getTypeBadge = () => {
    const badges = {
      Reunion: 'bg-purple-100 text-purple-800',
      Webinar: 'bg-blue-100 text-blue-800',
      Workshop: 'bg-orange-100 text-orange-800'
    };
    return badges[event.type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Event Content */}
      <div className="p-4">
        {/* Header with Type and Status Badges */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeBadge()}`}>
                {event.type}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge()}`}>
                {getStatusLabel()}
              </span>
            </div>
            <Link to={`/event/${event._id}`}>
              <h2 className="text-lg font-bold hover:text-primary cursor-pointer line-clamp-2">
                {event.title}
              </h2>
            </Link>
          </div>
        </div>

        {/* Organizer */}
        <Link to={`/profile/${event.organizer.username}`} className="flex items-center gap-2 mb-3">
          <img
            src={event.organizer.profilePicture || "/avatar.png"}
            alt={event.organizer.name}
            className="w-7 h-7 rounded-full object-cover"
          />
          <div>
            <p className="text-xs font-medium">{event.organizer.name}</p>
            <p className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(event.createdAt))} ago
            </p>
          </div>
        </Link>

        {/* Description */}
        <p className="text-sm text-gray-700 mb-3 line-clamp-1">{event.description}</p>

        {/* Event Details - Compact Grid */}
        <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
          <div className="flex items-center gap-1.5 text-gray-600">
            <Calendar size={14} />
            <span>{format(new Date(event.eventDate), 'MMM dd, yyyy')}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600">
            <Clock size={14} />
            <span>{formatTime12Hour(event.eventTime)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600">
            {event.isVirtual ? <Video size={14} /> : <MapPin size={14} />}
            <span className="truncate">{event.isVirtual ? 'Virtual Event' : event.location}</span>
          </div>
          {event.requiresTicket && (
            <div className="flex items-center gap-1.5 text-gray-600">
              <Ticket size={14} />
              <span>{event.ticketPrice > 0 ? `₱${event.ticketPrice}` : 'Free'}</span>
            </div>
          )}
        </div>

        {/* RSVP Stats */}
        <div className="flex items-center gap-3 mb-3 text-xs flex-wrap">
          <div className="flex items-center gap-1">
            <Users size={14} className="text-primary" />
            <span className="font-medium min-w-[60px]">{goingCount} going</span>
          </div>
          <span className="text-gray-400">•</span>
          <span className="text-gray-600 min-w-[80px]">{interestedCount} interested</span>
          {event.capacity > 0 && (
            <>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600 min-w-[70px]">
                {event.capacity - goingCount} spots left
              </span>
            </>
          )}
        </div>

        {/* RSVP Buttons */}
        {!isOrganizer && event.status === 'upcoming' && (
          <div className="flex gap-2 h-[34px]">
            <button
              onClick={() => rsvpEvent(userStatus === 'going' ? 'not_going' : 'going')}
              disabled={isRsvping}
              className={`flex-1 py-1.5 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5 min-w-[70px] ${
                userStatus === 'going'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {userStatus === 'going' && <Check size={14} />}
              Going
            </button>
            <button
              onClick={() => rsvpEvent(userStatus === 'interested' ? 'not_going' : 'interested')}
              disabled={isRsvping}
              className={`flex-1 py-1.5 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5 min-w-[90px] ${
                userStatus === 'interested'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {userStatus === 'interested' && <Check size={14} />}
              Interested
            </button>
            {userStatus === 'going' && event.requiresTicket && (
              <Link 
                to={`/event/${event._id}/ticket`}
                className="p-1.5 bg-green-500 text-white hover:bg-green-600 rounded-lg transition-colors flex items-center justify-center"
                title="View Ticket"
              >
                <Ticket size={14} />
              </Link>
            )}
          </div>
        )}

        {/* Edit/Delete buttons for organizer */}
        {isOrganizer && (
          <div className="flex gap-2 h-[34px]">
            <Link to={`/event/${event._id}/edit`} className="flex-1">
              <button className="w-full py-1.5 px-3 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 text-sm font-medium">
                <Edit size={14} />
                Edit
              </button>
            </Link>
            <button
              onClick={() => deleteEvent()}
              disabled={isDeleting}
              className="flex-1 py-1.5 px-3 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 text-sm font-medium"
            >
              {isDeleting ? (
                <Loader className="animate-spin" size={14} />
              ) : (
                <>
                  <Trash2 size={14} />
                  Delete
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventPost;
