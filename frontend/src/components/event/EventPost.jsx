import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  XCircle,
  Share2,
  Loader,
  CheckCircle
} from "lucide-react";
import { Flag } from 'lucide-react';
import { formatDistanceToNow, format } from "date-fns";
import ConfirmModal from "../common/ConfirmModal";
import ReportModal from '../common/ReportModal'
import { MoreVertical } from 'lucide-react';
import ShareModal from '../common/ShareModal';

const EventPost = ({ event, onEventChanged }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const authUser = queryClient.getQueryData(["authUser"]);
  
  // Handle missing organizer
  if (!event.organizer) {
    return null;
  }
  
  const isOrganizer = authUser?._id === event.organizer._id;
  const isAdmin = authUser?.permission === 'admin' || authUser?.permission === 'superAdmin';
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  
  const userRsvp = event.attendees?.find(a => a.user._id === authUser?._id);
  const userStatus = userRsvp?.rsvpStatus;
  
  const goingCount = event.attendees?.filter(a => a.rsvpStatus === 'going').length || 0;
  const interestedCount = event.attendees?.filter(a => a.rsvpStatus === 'interested').length || 0;

  // Hide banned events from regular users
  if (event?.banned && !isAdmin && !isOrganizer) {
    return null;
  }

  const { mutate: rsvpEvent, isPending: isRsvping } = useMutation({
    mutationFn: async (status) => {
      const response = await axiosInstance.post(`/events/${event._id}/rsvp`, { rsvpStatus: status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["event", event._id] });
      queryClient.invalidateQueries({ queryKey: ["myEvents"] });
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
      setShowDeleteConfirm(false);
      toast.success("Event deleted successfully");
      if (onEventChanged) onEventChanged();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete event");
    },
  });

  // Ban / Unban mutations for admins
  const [showBanConfirm, setShowBanConfirm] = useState(false);
  const [showUnbanConfirm, setShowUnbanConfirm] = useState(false);
  const [banReason, setBanReason] = useState('');

  const { mutate: banEvent, isPending: isBanning } = useMutation({
    mutationFn: async ({ reason } = {}) => {
      await axiosInstance.put(`/events/${event._id}/ban`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event', event._id] });
      setShowBanConfirm(false);
      setBanReason('');
      toast.success('Event banned');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to ban event');
    }
  });

  const { mutate: unbanEvent, isPending: isUnbanning } = useMutation({
    mutationFn: async () => {
      await axiosInstance.put(`/events/${event._id}/unban`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event', event._id] });
      setShowUnbanConfirm(false);
      toast.success('Event unbanned');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to unban event');
    }
  });

  // Report handled by ReportModal

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
    if (!time24) return 'TBD';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatEventDate = (dateString) => {
    try {
      if (!dateString) return 'TBD';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return format(date, 'MMM dd, yyyy');
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatCreatedAt = (dateString) => {
    try {
      if (!dateString) return '';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return formatDistanceToNow(date) + ' ago';
    } catch (error) {
      return '';
    }
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
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={(e) => {
          // only navigate when user clicks on the card area (not on buttons)
          if (e.target.closest('button') || e.target.closest('a') || e.target.closest('.dropdown-menu')) return;
          navigate(`/event/${event._id}`);
        }}
      >
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
              <h2 className="text-lg font-bold hover:text-primary line-clamp-2">
                {event.title}
              </h2>
            </div>
            <div className='relative ml-2 flex-shrink-0 flex items-center'>
              {/* Banned badge for admins/owner */}
              {event?.banned && (isAdmin || isOrganizer) && (
                <span className="mr-1 inline-block text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">BANNED</span>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); setShowActions(!showActions); }}
                className='p-1 hover:bg-gray-100 rounded-full transition-colors'
              >
                <MoreVertical size={18} className='text-gray-700' />
              </button>
              {showActions && (
                <>
                  <div className='fixed inset-0 z-10' onClick={() => setShowActions(false)} />
                  <div className='absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20'>
                    {/* Share - available to everyone */}
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowActions(false); setShowShareModal(true); }}
                      className='w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2'
                    >
                      <Share2 size={14} />
                      Share
                    </button>
                    {!isOrganizer && !isAdmin && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowReportModal(true); setShowActions(false); }}
                        className='w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2'
                      >
                        <Flag size={14} className='text-red-500' />
                        Report
                      </button>
                    )}

                    {/* Admin ban/unban */}
                    {isAdmin && (
                      event?.banned ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowUnbanConfirm(true); setShowActions(false); }}
                          className='w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2'
                        >
                          <CheckCircle size={16} className='text-red-600' />
                          Unban
                        </button>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowBanConfirm(true); setShowActions(false); }}
                          className='w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2'
                        >
                          <XCircle size={16} className='text-red-500' />
                          Ban
                        </button>
                      )
                    )}

                    {isOrganizer && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); setShowActions(false); }}
                        className='w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2'
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    )}
                                      
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Organizer */}
          <div 
            className="flex items-center gap-2 mb-3 cursor-pointer hover:opacity-80" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate(`/profile/${event.organizer.username}`);
            }}
          >
            <img
              src={event.organizer.profilePicture || "/avatar.png"}
              alt={event.organizer.name}
              className="w-7 h-7 rounded-full object-cover"
            />
            <div>
              <p className="text-xs font-medium">{event.organizer.name}</p>
              <p className="text-xs text-gray-500">
                {formatCreatedAt(event.createdAt)}
              </p>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-700 mb-3 line-clamp-1">{event.description}</p>

          {/* Event Details - Compact Grid */}
          <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
            <div className="flex items-center gap-1.5 text-gray-600">
              <Calendar size={14} />
              <span>{formatEventDate(event.eventDate)}</span>
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
        </div>

      {/* RSVP Buttons - Outside the Link */}
      <div className="px-4 pb-4">
        {!isOrganizer && (event.status === 'upcoming' || event.status === 'ongoing') && (
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
          </div>
        )}

        {/* Completed Event Badge */}
        {!isOrganizer && event.status === 'completed' && (
          <div className="w-full py-1.5 px-3 rounded-lg bg-gray-200 text-gray-600 text-sm font-medium flex items-center justify-center gap-1.5 cursor-not-allowed h-[34px]">
            <Check size={14} />
            Event Completed
          </div>
        )}



        {/* If cancelled, only show delete button for organizer, no badge or reason for anyone */}
        {isOrganizer && event.status === 'cancelled' && (
          <div className="flex gap-2 h-[34px]">
            <button
              onClick={() => setShowDeleteConfirm(true)}
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

        {/* Organizer: Edit, Cancel, Delete buttons (cancel in the middle) */}
        {isOrganizer && event.status !== 'cancelled' && (
          <div className="flex gap-2 h-[34px]">
            <Link to={`/event/${event._id}/edit`} className="flex-1">
              <button className="w-full py-1.5 px-3 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 text-sm font-medium">
                <Edit size={14} />
                Edit
              </button>
            </Link>
            <button
              onClick={() => setShowCancelModal(true)}
              className="flex-1 py-1.5 px-3 bg-yellow-500 text-white hover:bg-yellow-600 rounded-lg transition-colors flex items-center justify-center gap-1.5 text-sm font-medium"
              disabled={isCancelling}
            >
              {isCancelling ? <Loader className="animate-spin" size={14} /> : <><XCircle size={14} /> Cancel Event</>}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
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
      {/* Cancel Event Modal */}
      <ConfirmModal
        isOpen={showCancelModal}
        onClose={() => { setShowCancelModal(false); setCancelReason(""); }}
        onConfirm={async () => {
          setIsCancelling(true);
          try {
            await axiosInstance.put(`/events/${event._id}/cancel`, { reason: cancelReason });
            toast.success('Event cancelled');
            setShowCancelModal(false);
            setCancelReason("");
            if (onEventChanged) onEventChanged();
          } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to cancel event');
          }
          setIsCancelling(false);
        }}
        title="Cancel Event"
        message="Please provide a reason for cancelling this event. This will be shown to all attendees."
        confirmText="Yes, Cancel Event"
        cancelText="Back"
        isLoading={isCancelling}
        loadingText="Cancelling..."
        confirmButtonClass="bg-yellow-500 hover:bg-yellow-600"
        showTextArea={true}
        textAreaValue={cancelReason}
        onTextAreaChange={setCancelReason}
        textAreaPlaceholder="Reason for cancellation (required)"
        disableConfirm={!cancelReason.trim() || cancelReason.trim().length < 3}
      />

        {/* Removed duplicate Edit/Delete buttons for organizer to prevent double row */}
      </div>

      {/* Delete Event Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => deleteEvent()}
        title="Delete Event"
        message="Are you sure you want to delete this event? This action cannot be undone and all attendee data will be removed."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
        loadingText="Deleting..."
        confirmButtonClass="bg-red-500 hover:bg-red-600"
      />
      {/* Ban/Unban Confirm Modals for Admins */}
      <ConfirmModal
        isOpen={showBanConfirm}
        onClose={() => { setShowBanConfirm(false); setBanReason(''); }}
        onConfirm={() => { banEvent({ reason: banReason }); }}
        title="Ban Event"
        message="Are you sure you want to ban this event? Banned events are hidden from regular users."
        confirmText="Yes, Ban"
        cancelText="Cancel"
        isLoading={isBanning}
        loadingText="Banning..."
        confirmButtonClass="bg-red-500 hover:bg-red-600"
        showTextArea={true}
        textAreaValue={banReason}
        onTextAreaChange={(v) => setBanReason(v)}
      />
      <ConfirmModal
        isOpen={showUnbanConfirm}
        onClose={() => setShowUnbanConfirm(false)}
        onConfirm={() => { unbanEvent(); }}
        title="Unban Event"
        message="Unban this event and restore it for regular users?"
        confirmText="Yes, Unban"
        cancelText="Cancel"
        isLoading={isUnbanning}
        loadingText="Unbanning..."
        confirmButtonClass="bg-red-500 hover:bg-red-600"
      />
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        defaultType='event'
        targetId={event._id}
      />
      {/* ShareModal for event */}
      {showShareModal && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          itemType="event"
          itemId={event._id}
          itemTitle={event.title}
        />
      )}
    </div>
  );
};

export default EventPost;
