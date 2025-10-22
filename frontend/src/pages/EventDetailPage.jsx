import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import ConfirmModal from '../components/common/ConfirmModal';
import { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Ticket, 
  Video, 
  ArrowLeft,
  Edit,
  Trash2,
  Check,
  CheckCircle2,
  XCircle,
  X as XIcon,
  Loader,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { MoreVertical } from 'lucide-react';
import { Flag } from 'lucide-react';
import { Share2 } from 'lucide-react';
import { CheckCircle } from 'lucide-react';
import ReportModal from '../components/common/ReportModal';
import { format, formatDistanceToNow } from 'date-fns';

const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData(['authUser']);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [showCancelEventConfirm, setShowCancelEventConfirm] = useState(false);
  const [showDeleteEventConfirm, setShowDeleteEventConfirm] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBanConfirm, setShowBanConfirm] = useState(false);
  const [showUnbanConfirm, setShowUnbanConfirm] = useState(false);
  const [banReason, setBanReason] = useState('');

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      const res = await axiosInstance.get(`/events/${id}`);
      return res.data;
    },
  });

  const { mutate: rsvpEvent, isPending: isRsvping } = useMutation({
    mutationFn: async (status) => {
      const response = await axiosInstance.post(`/events/${id}/rsvp`, { rsvpStatus: status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', id] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['myEvents'] });
      toast.success('RSVP updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update RSVP');
    },
  });

  const { mutate: deleteEvent, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      await axiosInstance.delete(`/events/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setShowDeleteEventConfirm(false);
      toast.success('Event deleted successfully');
      navigate('/events');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete event');
    },
  });

  const { mutate: banEvent, isPending: isBanning } = useMutation({
    mutationFn: async ({ reason } = {}) => {
      const res = await axiosInstance.put(`/events/${id}/ban`, { reason });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', id] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setShowBanConfirm(false);
      setBanReason('');
      toast.success('Event banned');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to ban event');
    }
  });

  const { mutate: unbanEvent, isPending: isUnbanning } = useMutation({
    mutationFn: async () => {
      const res = await axiosInstance.put(`/events/${id}/unban`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', id] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setShowUnbanConfirm(false);
      toast.success('Event unbanned');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to unban event');
    }
  });

  const { mutate: cancelEvent, isPending: isCancelling } = useMutation({
    mutationFn: async () => {
      const response = await axiosInstance.put(`/events/${id}/cancel`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', id] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setShowCancelEventConfirm(false);
      toast.success('Event cancelled successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to cancel event');
    },
  });

  const getStatusBadge = (status) => {
    const badges = {
      upcoming: 'bg-green-100 text-green-800',
      ongoing: 'bg-blue-100 text-blue-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return badges[status] || badges.upcoming;
  };

  const getTypeBadge = (type) => {
    const badges = {
      Reunion: 'bg-purple-100 text-purple-800',
      Webinar: 'bg-blue-100 text-blue-800',
      Workshop: 'bg-orange-100 text-orange-800'
    };
    return badges[type] || 'bg-gray-100 text-gray-800';
  };

  const formatTime12Hour = (time24) => {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Sidebar user={authUser} />
        </div>
        <div className="lg:col-span-3">
          <Link to="/events" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors">
            <ArrowLeft size={16} />
            Back to Events
          </Link>
          <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow">
            <Loader className="animate-spin h-10 w-10 text-primary mb-4" />
            <span className="text-lg text-info font-medium">Loading event...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Sidebar user={authUser} />
        </div>
        <div className="lg:col-span-3">
          <Link to="/events" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors">
            <ArrowLeft size={16} />
            Back to Events
          </Link>
          <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow">
            <XCircle className="h-12 w-12 text-gray-400 mb-3" />
            <span className="text-xl font-semibold text-gray-500">Event not found</span>
            <span className="text-info mt-1">The event you are looking for does not exist or was removed.</span>
          </div>
        </div>
      </div>
    );
  }

  // If event or organizer has been banned, show a banned notice for non-admin/non-organizer
  if (
    (event.banned || event.organizer?.banned) &&
    !(authUser?.role === 'admin' || authUser?._id === event.organizer._id)
  ) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Sidebar user={authUser} />
        </div>
        <div className="lg:col-span-3">
          <Link to="/events" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors">
            <ArrowLeft size={16} />
            Back to Events
          </Link>
          <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow p-6">
            <XCircle className="h-12 w-12 text-red-400 mb-3" />
            <h2 className="text-2xl font-semibold mb-2">
              {event.banned
                ? 'This event has been banned'
                : 'The user who created this event is banned'}
            </h2>
            <p className="text-gray-600">
              {event.banned
                ? "The content you're trying to view has been removed by the admins."
                : "The user who created this event has been banned by the admins."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isOrganizer = authUser?._id === event.organizer._id;
  const userRsvp = event.attendees?.find(a => a.user._id === authUser?._id);
  const userStatus = userRsvp?.rsvpStatus;
  const goingCount = event.attendees?.filter(a => a.rsvpStatus === 'going').length || 0;
  const interestedCount = event.attendees?.filter(a => a.rsvpStatus === 'interested').length || 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-1">
        <Sidebar user={authUser} />
      </div>

      <div className="lg:col-span-3">
        {/* Back Button */}
        <Link to="/events" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors">
          <ArrowLeft size={16} />
          Back to Events
        </Link>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Event Content */}
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeBadge(event.type)}`}>
                  {event.type}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(event.status)}`}>
                  {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                </span>
              </div>
              <h1 className="text-3xl font-bold mb-4">{event.title}</h1>
            </div>
            <div className='relative ml-2 flex items-center'>
              {/* Banned badge for admins/organizer */}
              {event?.banned && (authUser?.role === 'admin' || isOrganizer) && (
                <span className="mr-1 inline-block text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">BANNED</span>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); setShowDropdown(prev => !prev); }}
                className='p-2 hover:bg-gray-100 rounded-full'
                title='More actions'
              >
                <MoreVertical size={18} className='text-gray-700' />
              </button>
              {showDropdown && (
                <>
                  <div className='fixed inset-0 z-10' onClick={() => setShowDropdown(false)} />
                  <div className='absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20'>
                      {/* For regular users show report; admins see ban/unban */}
                      {!isOrganizer && !(authUser?.role === 'admin') && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowDropdown(false); setShowReportModal(true); }}
                          className='w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2'
                        >
                          <Flag size={14} className='text-red-500' />
                          Report
                        </button>
                      )}

                          {/* Share - everyone */}
                          <button
                            onClick={(e) => { e.stopPropagation(); setShowDropdown(false);
                              const url = `${window.location.origin}/event/${event._id}`;
                              if (navigator.share) {
                                navigator.share({ title: event.title, url }).catch(() => {});
                              } else if (navigator.clipboard) {
                                navigator.clipboard.writeText(url).then(() => {
                                  toast.success('Event link copied to clipboard');
                                });
                              } else {
                                const tmp = document.createElement('input');
                                document.body.appendChild(tmp);
                                tmp.value = url;
                                tmp.select();
                                document.execCommand('copy');
                                document.body.removeChild(tmp);
                                toast.success('Event link copied to clipboard');
                              }
                            }}
                            className='w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2'
                          >
                            <Share2 size={14} />
                            Share
                          </button>

                      {/* Admin Ban / Unban */}
                      {authUser?.role === 'admin' && (
                        event.banned ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); setShowDropdown(false); setShowUnbanConfirm(true); }}
                            className='w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2'
                          >
                            <CheckCircle size={16} className='text-red-600' />
                            Unban
                          </button>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); setShowDropdown(false); setShowBanConfirm(true); }}
                            className='w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2'
                          >
                            <XCircle size={16} className='text-red-500' />
                            Ban
                          </button>
                        )
                      )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Organizer */}
          <Link to={`/profile/${event.organizer.username}`} className="flex items-center gap-3 mb-6">
            <img
              src={event.organizer.profilePicture || '/avatar.png'}
              alt={event.organizer.name}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <p className="font-semibold">{event.organizer.name}</p>
              <p className="text-sm text-gray-500">
                Posted {formatDistanceToNow(new Date(event.createdAt))} ago
              </p>
            </div>
          </Link>

          {/* Event Images */}
          {event.images && event.images.length > 0 && (
            <div className="mb-6">
              <div className="grid grid-cols-2 gap-2">
                {event.images.map((image, index) => (
                  <img 
                    key={index}
                    src={image} 
                    alt={`${event.title} - Image ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setSelectedImageIndex(index)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">About this event</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
          </div>

          {/* Event Details */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Calendar className="text-primary" size={24} />
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium">{format(new Date(event.eventDate), 'PPP')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Clock className="text-primary" size={24} />
              <div>
                <p className="text-sm text-gray-500">Start Time</p>
                <p className="font-medium">{formatTime12Hour(event.eventTime)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Clock className="text-primary" size={24} />
              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="font-medium">{event.eventDuration || 2} {(event.eventDuration || 2) === 1 ? 'hour' : 'hours'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              {event.isVirtual ? <Video className="text-primary" size={24} /> : <MapPin className="text-primary" size={24} />}
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-medium">{event.isVirtual ? 'Virtual Event' : event.location}</p>
              </div>
            </div>
            {event.requiresTicket && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Ticket className="text-primary" size={24} />
                <div>
                  <p className="text-sm text-gray-500">Ticket Price</p>
                  <p className="font-medium">{event.ticketPrice > 0 ? `₱${event.ticketPrice}` : 'Free'}</p>
                </div>
              </div>
            )}
          </div>

          {/* Virtual Link */}
          {event.isVirtual && event.virtualLink && userStatus === 'going' && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Join the event:</p>
              <a 
                href={event.virtualLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline break-all"
              >
                {event.virtualLink}
              </a>
            </div>
          )}

          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {event.tags.map((tag, index) => (
                  <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* RSVP Stats */}
          <div className="flex items-center gap-6 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="text-primary" size={20} />
              <span className="font-semibold">{goingCount} going</span>
            </div>
            <span className="text-gray-400">•</span>
            <span className="text-gray-600">{interestedCount} interested</span>
            {event.capacity > 0 && (
              <>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600">{event.capacity - goingCount} spots left</span>
              </>
            )}
          </div>

          {/* Action Buttons */}
          {!isOrganizer && (event.status === 'upcoming' || event.status === 'ongoing') && (
            <div className="flex gap-3">
              <button
                onClick={() => rsvpEvent(userStatus === 'going' ? 'not_going' : 'going')}
                disabled={isRsvping}
                className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                  userStatus === 'going'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {userStatus === 'going' && <Check size={20} />}
                Going
              </button>
              <button
                onClick={() => rsvpEvent(userStatus === 'interested' ? 'not_going' : 'interested')}
                disabled={isRsvping}
                className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                  userStatus === 'interested'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {userStatus === 'interested' && <Check size={20} />}
                Interested
              </button>
            </div>
          )}

          {/* Completed Event Badge */}
          {!isOrganizer && event.status === 'completed' && (
            <div className="w-full py-3 px-6 rounded-lg bg-gray-200 text-gray-600 font-semibold flex items-center justify-center gap-2 cursor-not-allowed">
              <CheckCircle2 size={20} />
              Event Completed
            </div>
          )}

          {/* Cancelled Event Badge */}
          {!isOrganizer && event.status === 'cancelled' && (
            <div className="w-full py-3 px-6 rounded-lg bg-red-100 text-red-600 font-semibold flex items-center justify-center gap-2 cursor-not-allowed">
              <XCircle size={20} />
              Event Cancelled
            </div>
          )}

          {/* Organizer Actions */}
          {isOrganizer && (
            <div className="flex gap-3">
              <Link to={`/event/${event._id}/edit`} className="flex-1">
                <button className="w-full py-3 px-6 bg-green-600 text-white hover:bg-green-700 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2">
                  <Edit size={20} />
                  Edit Event
                </button>
              </Link>
              {event.status !== 'cancelled' && event.status !== 'completed' && (
                <button
                  onClick={() => setShowCancelEventConfirm(true)}
                  disabled={isCancelling}
                  className="flex-1 py-3 px-6 bg-orange-600 text-white hover:bg-orange-700 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isCancelling ? (
                    <Loader className="animate-spin" size={20} />
                  ) : (
                    <>
                      <XCircle size={20} />
                      Cancel Event
                    </>
                  )}
                </button>
              )}
              <button
                onClick={() => setShowDeleteEventConfirm(true)}
                disabled={isDeleting}
                className="flex-1 py-3 px-6 bg-red-600 text-white hover:bg-red-700 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <Loader className="animate-spin" size={20} />
                ) : (
                  <>
                    <Trash2 size={20} />
                    Delete Event
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Attendees Section */}
      {goingCount > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Attendees ({goingCount})</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {event.attendees
              .filter(a => a.rsvpStatus === 'going')
              .map((attendee) => (
                <Link 
                  key={attendee.user._id} 
                  to={`/profile/${attendee.user.username}`}
                  className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <img
                    src={attendee.user.profilePicture || '/avatar.png'}
                    alt={attendee.user.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{attendee.user.name}</p>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      )}
      </div>

      {/* Image Lightbox Modal */}
      {selectedImageIndex !== null && event?.images && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4"
          onClick={() => setSelectedImageIndex(null)}
        >
          <button
            onClick={() => setSelectedImageIndex(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            aria-label="Close"
          >
            <XIcon size={32} />
          </button>
          
          {/* Previous Button */}
          {event.images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImageIndex((selectedImageIndex - 1 + event.images.length) % event.images.length);
              }}
              className="absolute left-4 text-white hover:text-gray-300 transition-colors p-2 bg-black bg-opacity-50 rounded-full"
              aria-label="Previous image"
            >
              <ChevronLeft size={32} />
            </button>
          )}

          <img
            src={event.images[selectedImageIndex]}
            alt={`Full size - Image ${selectedImageIndex + 1}`}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next Button */}
          {event.images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImageIndex((selectedImageIndex + 1) % event.images.length);
              }}
              className="absolute right-4 text-white hover:text-gray-300 transition-colors p-2 bg-black bg-opacity-50 rounded-full"
              aria-label="Next image"
            >
              <ChevronRight size={32} />
            </button>
          )}

          {/* Image Counter */}
          {event.images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-50 px-4 py-2 rounded-full">
              {selectedImageIndex + 1} / {event.images.length}
            </div>
          )}
        </div>
      )}

      {/* Cancel Event Confirmation Modal */}
      <ConfirmModal
        isOpen={showCancelEventConfirm}
        onClose={() => setShowCancelEventConfirm(false)}
        onConfirm={() => cancelEvent()}
        title="Cancel Event"
        message="Are you sure you want to cancel this event? All attendees will be notified about the cancellation."
        confirmText="Yes, Cancel Event"
        cancelText="Keep Event"
        isLoading={isCancelling}
        loadingText="Cancelling..."
        confirmButtonClass="bg-orange-600 hover:bg-orange-700"
      />

      {/* Delete Event Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteEventConfirm}
        onClose={() => setShowDeleteEventConfirm(false)}
        onConfirm={() => deleteEvent()}
        title="Delete Event"
        message="Are you sure you want to delete this event? This action cannot be undone and all attendee data will be permanently removed."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
        loadingText="Deleting..."
        confirmButtonClass="bg-red-500 hover:bg-red-600"
      />
      {/* Ban Confirm Modal (admins) */}
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
        targetId={event?._id}
      />
    </div>
  );
};

export default EventDetailPage;
