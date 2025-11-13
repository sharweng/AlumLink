import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { axiosInstance } from '../lib/axios'
import toast from 'react-hot-toast'
import { ExternalLink, Eye, Heart, MessageSquare, Trash2, UserPlus, CheckCircle2, Briefcase, X, AtSign, Reply, HeartOff, Calendar, Bell, XCircle, Star, BookOpen, Video, UserX, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import Sidebar from '../components/Sidebar'
import { useState, useEffect } from 'react'

const NotificationsPage = () => {
  const queryClient = useQueryClient()
  const authUser = queryClient.getQueryData(["authUser"])
  const [activeTab, setActiveTab] = useState('all')
  const [filter, setFilter] = useState('all') // all, like, comment, application

  // Reset filter when changing tabs
  useEffect(() => {
    setFilter('all')
  }, [activeTab])

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => axiosInstance.get("/notifications")
  })

  const { mutate: markAsReadMutation } = useMutation({
    mutationFn: (id) => axiosInstance.put(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries(["notifications"])
    }
  })

	const handleMarkAllAsRead = () => {
		if (!notifications || !notifications.data) return;
		const unread = notifications.data.filter(n => !n.read);
		if (unread.length === 0) return;
		unread.forEach(n => markAsReadMutation(n._id));
		toast.success("All notifications marked as read");
	};

  const { mutate: deleteNotificationMutation } = useMutation({
    mutationFn: (id) => axiosInstance.delete(`/notifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["notifications"])
      toast.success("Notification deleted")
    }
  })

  // Filter notifications based on active tab
  const filterNotifications = (notifications) => {
    if (!notifications) return []
    
    let filtered = notifications
    
    // Filter by tab first
    if (activeTab === 'posts') {
      // Posts tab: notifications with relatedPost (regular posts)
      filtered = notifications.filter(notification => notification.relatedPost)
    } else if (activeTab === 'jobs') {
      // Jobs tab: notifications with relatedJobPost (job posts) - exclude likes and comments
      filtered = notifications.filter(notification => 
        notification.relatedJobPost && 
        notification.type !== 'like' && 
        notification.type !== 'comment'
      )
    } else if (activeTab === 'forums') {
      // Forums tab: notifications with relatedDiscussion
      filtered = notifications.filter(notification => notification.relatedDiscussion)
    } else if (activeTab === 'events') {
      // Events tab: notifications with relatedEvent
      filtered = notifications.filter(notification => notification.relatedEvent)
    } else if (activeTab === 'mentorship') {
      // Mentorship tab: notifications with relatedMentorship or relatedSession
      filtered = notifications.filter(notification => notification.relatedMentorship || notification.relatedSession)
    } else if (activeTab === 'all') {
      // All tab: exclude job post likes and comments
      filtered = notifications.filter(notification => 
        !(notification.relatedJobPost && (notification.type === 'like' || notification.type === 'comment'))
      )
    }
    // 'all' tab shows everything except job likes/comments
    
    // Apply type filter
    if (filter !== 'all') {
      if (filter === 'application') {
        filtered = filtered.filter(n => n.type === 'jobApplication' || n.type === 'jobApplicationCancelled' || n.type === 'jobUpdate')
      } else if (filter === 'link') {
        filtered = filtered.filter(n => n.type === 'linkAccepted')
      } else if (filter === 'like') {
        // Likes filter includes both likes and dislikes from posts and discussions
        filtered = filtered.filter(n => 
          n.type === 'like' || 
          n.type === 'discussionLike' || 
          n.type === 'postCommentLike' || 
          n.type === 'postCommentDislike' ||
          n.type === 'discussionCommentLike' ||
          n.type === 'discussionCommentDislike'
        )
      } else if (filter === 'comment') {
        // Comments filter includes comments, replies, and mentions from posts and discussions
        filtered = filtered.filter(n => 
          n.type === 'comment' || 
          n.type === 'discussionComment' ||
          n.type === 'postReply' ||
          n.type === 'discussionReply' ||
          n.type === 'postMention' ||
          n.type === 'discussionMention'
        )
      } else if (filter === 'reply') {
        // Combined filter for "All" tab - includes both post and discussion replies
        filtered = filtered.filter(n => n.type === 'postReply' || n.type === 'discussionReply')
      } else if (filter === 'mention') {
        // Combined filter for "All" tab - includes both post and discussion mentions
        filtered = filtered.filter(n => n.type === 'postMention' || n.type === 'discussionMention')
      } else if (filter === 'discussionLike') {
        filtered = filtered.filter(n => n.type === 'discussionLike')
      } else if (filter === 'discussionComment') {
        filtered = filtered.filter(n => n.type === 'discussionComment')
      } else if (filter === 'discussionReply') {
        filtered = filtered.filter(n => n.type === 'discussionReply')
      } else if (filter === 'discussionMention') {
        filtered = filtered.filter(n => n.type === 'discussionMention')
      } else if (filter === 'eventRSVP') {
        filtered = filtered.filter(n => n.type === 'eventRSVP')
      } else if (filter === 'eventInterested') {
        filtered = filtered.filter(n => n.type === 'eventInterested')
      } else if (filter === 'eventReminder') {
        filtered = filtered.filter(n => n.type === 'eventReminder')
      } else if (filter === 'eventUpdate') {
        filtered = filtered.filter(n => n.type === 'eventUpdate')
      } else if (filter === 'eventCancelled') {
        filtered = filtered.filter(n => n.type === 'eventCancelled')
      } else if (filter === 'mentorshipRequest') {
        filtered = filtered.filter(n => n.type === 'mentorshipRequest' || n.type === 'mentorshipAccepted' || n.type === 'mentorshipDeclined' || n.type === 'mentorshipEnded')
      } else if (filter === 'sessionScheduled') {
        filtered = filtered.filter(n => n.type === 'sessionScheduled' || n.type === 'sessionConfirmed' || n.type === 'sessionCancelled' || n.type === 'sessionCancelRequest')
      } else if (filter === 'sessionCompleted') {
        filtered = filtered.filter(n => n.type === 'sessionCompleted')
      } else if (filter === 'sessionFeedback') {
        filtered = filtered.filter(n => n.type === 'sessionFeedback')
      } else {
        filtered = filtered.filter(n => n.type === filter)
      }
    }
    
    return filtered
  }

  const renderNotificationIcon = (type) => {
    switch(type) {
      case "like":
        return <Heart className='text-red-500' />
      case "comment":
        return <MessageSquare className='text-green-500' />
      case "postReply":
        return <Reply className='text-blue-500' />
      case "postMention":
        return <AtSign className='text-purple-500' />
      case "postCommentLike":
        return <Heart className='text-red-500' />
      case "postCommentDislike":
        return <HeartOff className='text-gray-500' />
      case "linkAccepted":
        return <UserPlus className='text-purple-500' />
      case "jobApplication":
        return <Briefcase className='text-blue-500' />
      case "jobApplicationCancelled":
        return <X className='text-red-500' />
      case "jobUpdate":
        return <Briefcase className='text-orange-500' />
      case "jobAccepted":
        return <CheckCircle2 className='text-green-500' />
      case "jobRejected":
        return <XCircle className='text-red-500' />
      case "discussionLike":
        return <Heart className='text-red-500' />
      case "discussionComment":
        return <MessageSquare className='text-green-500' />
      case "discussionReply":
        return <Reply className='text-blue-500' />
      case "discussionMention":
        return <AtSign className='text-purple-500' />
      case "discussionCommentLike":
        return <Heart className='text-red-500' />
      case "discussionCommentDislike":
        return <HeartOff className='text-gray-500' />
      case "eventRSVP":
        return <CheckCircle2 className='text-green-500' />
      case "eventInterested":
        return <Star className='text-yellow-500' />
      case "eventReminder":
        return <Bell className='text-blue-500' />
      case "eventUpdate":
        return <Calendar className='text-orange-500' />
      case "eventCancelled":
        return <XCircle className='text-red-500' />
      case "mentorshipRequest":
        return <BookOpen className='text-blue-500' />
      case "mentorshipAccepted":
        return <CheckCircle2 className='text-green-500' />
      case "mentorshipDeclined":
        return <X className='text-red-500' />
      case "mentorshipEnded":
        return <UserX className='text-gray-500' />
      case "sessionScheduled":
        return <Calendar className='text-blue-500' />
      case "sessionConfirmed":
        return <CheckCircle2 className='text-green-500' />
      case "sessionCancelled":
        return <XCircle className='text-red-500' />
      case "sessionCancelRequest":
        return <Bell className='text-yellow-500' />
      case "sessionCompleted":
        return <Video className='text-purple-500' />
      case "sessionFeedback":
        return <MessageCircle className='text-blue-500' />
      default:
        return null
    }
  }

  const renderNotificationContent = (notification) => {
		const isJobNotification = !!notification.relatedJobPost;
		const isDiscussionNotification = !!notification.relatedDiscussion;
		const isPostNotification = !!notification.relatedPost;
		
		switch (notification.type) {
			case "like":
				return (
					<span>
						<Link to={`/profile/${notification.relatedUser.username}`} className='font-bold'>
							{notification.relatedUser.name}
						</Link>{" "}
						liked your {isJobNotification ? 'job post' : 'post'}
					</span>
				);
			case "comment":
				return (
					<span>
						<Link to={`/profile/${notification.relatedUser.username}`} className='font-bold'>
							{notification.relatedUser.name}
						</Link>{" "}
						commented on your {isJobNotification ? 'job post' : 'post'}
					</span>
				);
			case "postReply":
				return (
					<span>
						<Link to={`/profile/${notification.relatedUser.username}`} className='font-bold'>
							{notification.relatedUser.name}
						</Link>{" "}
						replied to your comment
					</span>
				);
			case "postCommentLike":
				return (
					<span>
						<Link to={`/profile/${notification.relatedUser.username}`} className='font-bold'>
							{notification.relatedUser.name}
						</Link>{" "}
						liked your comment
					</span>
				);
			case "postCommentDislike":
				return (
					<span>
						<Link to={`/profile/${notification.relatedUser.username}`} className='font-bold'>
							{notification.relatedUser.name}
						</Link>{" "}
						disliked your comment
					</span>
				);
			case "postMention":
				return (
					<span>
						<Link to={`/profile/${notification.relatedUser.username}`} className='font-bold'>
							{notification.relatedUser.name}
						</Link>{" "}
						mentioned you in a post
					</span>
				);
			case "linkAccepted":
				return (
					<span>
						<Link to={`/profile/${notification.relatedUser.username}`} className='font-bold'>
							{notification.relatedUser.name}
						</Link>{" "}
						accepted your link request
					</span>
				);
			case "jobApplication":
				return (
					<span>
						<Link to={`/profile/${notification.relatedUser.username}`} className='font-bold'>
							{notification.relatedUser.name}
						</Link>{" "}
						applied to your job post
					</span>
				);
			case "jobApplicationCancelled":
				return (
					<span>
						<Link to={`/profile/${notification.relatedUser.username}`} className='font-bold'>
							{notification.relatedUser.name}
						</Link>{" "}
						cancelled their application to your job post
					</span>
				);
			case "jobUpdate":
				return (
					<span>
						The job post{" "}
						<Link to={`/job/${notification.relatedJobPost._id}`} className='font-bold'>
							{notification.relatedJobPost.title}
						</Link>{" "}
						you applied to has been updated
					</span>
				);
			case "jobAccepted":
				return (
					<span>
						Your application for{" "}
						<Link to={`/job/${notification.relatedJobPost._id}`} className='font-bold'>
							{notification.relatedJobPost.title}
						</Link>{" "}
						has been accepted!
					</span>
				);
			case "jobRejected":
				return (
					<span>
						Your application for{" "}
						<Link to={`/job/${notification.relatedJobPost._id}`} className='font-bold'>
							{notification.relatedJobPost.title}
						</Link>{" "}
						has been rejected
					</span>
				);
			case "discussionLike":
				return (
					<span>
						<Link to={`/profile/${notification.relatedUser.username}`} className='font-bold'>
							{notification.relatedUser.name}
						</Link>{" "}
						liked your discussion
					</span>
				);
			case "discussionComment":
				return (
					<span>
						<Link to={`/profile/${notification.relatedUser.username}`} className='font-bold'>
							{notification.relatedUser.name}
						</Link>{" "}
						commented on your discussion
					</span>
				);
			case "discussionReply":
				return (
					<span>
						<Link to={`/profile/${notification.relatedUser.username}`} className='font-bold'>
							{notification.relatedUser.name}
						</Link>{" "}
						replied to your comment
					</span>
				);
			case "discussionMention":
				return (
					<span>
						<Link to={`/profile/${notification.relatedUser.username}`} className='font-bold'>
							{notification.relatedUser.name}
						</Link>{" "}
						mentioned you in a {isDiscussionNotification ? 'discussion' : 'post'}
					</span>
				);
			case "discussionCommentLike":
				return (
					<span>
						<Link to={`/profile/${notification.relatedUser.username}`} className='font-bold'>
							{notification.relatedUser.name}
						</Link>{" "}
						liked your comment
					</span>
				);
			case "discussionCommentDislike":
				return (
					<span>
						<Link to={`/profile/${notification.relatedUser.username}`} className='font-bold'>
							{notification.relatedUser.name}
						</Link>{" "}
						disliked your comment
					</span>
				);
			case "eventRSVP":
				const rsvpAction = notification.metadata?.action || 'added';
				return (
					<span>
						<Link to={`/profile/${notification.relatedUser.username}`} className='font-bold'>
							{notification.relatedUser.name}
						</Link>{" "}
						{rsvpAction === 'removed' ? 'is no longer going to your event' : 
						 rsvpAction === 'changed' ? 'updated their RSVP for your event' : 
						 'is going to your event'}
					</span>
				);
			case "eventInterested":
				const interestedAction = notification.metadata?.action || 'added';
				return (
					<span>
						<Link to={`/profile/${notification.relatedUser.username}`} className='font-bold'>
							{notification.relatedUser.name}
						</Link>{" "}
						{interestedAction === 'removed' ? 'is no longer interested in your event' : 
						 interestedAction === 'changed' ? 'updated their interest in your event' : 
						 'is interested in your event'}
					</span>
				);
			case "eventReminder":
				const rsvpStatus = notification.metadata?.rsvpStatus || 'going';
				return (
					<span>
						{rsvpStatus === 'going' 
							? "Reminder: An event you're attending is happening soon (within 24 hours)"
							: "Reminder: An event you're interested in is happening soon (within 24 hours)"}
					</span>
				);
			case "eventUpdate":
				const updateRsvpStatus = notification.metadata?.rsvpStatus || 'going';
				return (
					<span>
						{updateRsvpStatus === 'going' 
							? "An event you're attending has been updated"
							: "An event you're interested in has been updated"}
					</span>
				);
					case "eventCancelled":
						return (
							<span>
								An event you're attending has been cancelled
								{notification.metadata?.reason && (
									<span className="w-full block text-xs text-gray-600 mt-1 truncate" style={{maxWidth: '600px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
										Reason: {notification.metadata.reason}
									</span>
								)}
							</span>
						);
			case "mentorshipRequest":
				return (
					<span>
						<Link to={`/profile/${notification.relatedUser.username}`} className='font-bold'>
							{notification.relatedUser.name}
						</Link>{" "}
						requested you as a mentor
					</span>
				);
			case "mentorshipAccepted":
				return (
					<span>
						<Link to={`/profile/${notification.relatedUser.username}`} className='font-bold'>
							{notification.relatedUser.name}
						</Link>{" "}
						accepted your mentorship request
					</span>
				);
			case "mentorshipDeclined":
				return (
					<span>
						<Link to={`/profile/${notification.relatedUser.username}`} className='font-bold'>
							{notification.relatedUser.name}
						</Link>{" "}
						declined your mentorship request
					</span>
				);
			case "mentorshipEnded":
				return (
					<span>
						<Link to={`/profile/${notification.relatedUser.username}`} className='font-bold'>
							{notification.relatedUser.name}
						</Link>{" "}
						ended your mentorship relationship
					</span>
				);
			case "sessionScheduled":
				return (
					<span>
						<Link to={`/profile/${notification.relatedUser.username}`} className='font-bold'>
							{notification.relatedUser.name}
						</Link>{" "}
						proposed a new mentorship session
					</span>
				);
			case "sessionConfirmed":
				return (
					<span>
						<Link to={`/profile/${notification.relatedUser.username}`} className='font-bold'>
							{notification.relatedUser.name}
						</Link>{" "}
						confirmed the mentorship session
					</span>
				);
			case "sessionCancelled":
				const cancelledBy = notification.metadata?.cancelledBy;
				const cancelStatus = notification.metadata?.status;
				return (
					<span>
						{cancelStatus === 'approved' ? (
							<>
								<Link to={`/profile/${notification.relatedUser.username}`} className='font-bold'>
									{notification.relatedUser.name}
								</Link>{" "}
								approved your session cancellation request
							</>
						) : cancelledBy === 'mentor' ? (
							<>
								<Link to={`/profile/${notification.relatedUser.username}`} className='font-bold'>
									{notification.relatedUser.name}
								</Link>{" "}
								cancelled the mentorship session
							</>
						) : (
							<>
								<Link to={`/profile/${notification.relatedUser.username}`} className='font-bold'>
									{notification.relatedUser.name}
								</Link>{" "}
								cancelled the mentorship session
							</>
						)}
						{notification.metadata?.reason && (
							<span className="block text-xs text-gray-600 mt-1">
								Reason: {notification.metadata.reason}
							</span>
						)}
					</span>
				);
			case "sessionCancelRequest":
				return (
					<span>
						<Link to={`/profile/${notification.relatedUser.username}`} className='font-bold'>
							{notification.relatedUser.name}
						</Link>{" "}
						requested to cancel the mentorship session
						{notification.metadata?.reason && (
							<span className="block text-xs text-gray-600 mt-1">
								Reason: {notification.metadata.reason}
							</span>
						)}
					</span>
				);
			case "sessionCompleted":
				const markedBy = notification.metadata?.markedBy;
				return (
					<span>
						<Link to={`/profile/${notification.relatedUser.username}`} className='font-bold'>
							{notification.relatedUser.name}
						</Link>{" "}
						marked your mentorship session as completed
					</span>
				);
			case "sessionFeedback":
				const feedbackRole = notification.metadata?.role;
				const hasRating = notification.metadata?.hasRating;
				const rating = notification.metadata?.rating;
				return (
					<span>
						<Link to={`/profile/${notification.relatedUser.username}`} className='font-bold'>
							{notification.relatedUser.name}
						</Link>{" "}
						{feedbackRole === "mentor" ? "left feedback" : `rated the session${hasRating && rating ? ` (${rating}★)` : ''} and left feedback`}
					</span>
				);
			default:
				return null;
		}
	};

  const renderRelatedPost = (relatedPost, notification) => {
		if (!relatedPost) return null;

		// Build URL with query params for comment/reply navigation
		let url = `/post/${relatedPost._id}`;
		
		// Add parameters based on notification type
		if (notification.relatedReply) {
			// For replies - scroll directly to the reply
			url += `?comment=${notification.relatedComment}&reply=${notification.relatedReply}`;
		} else if (notification.relatedComment) {
			// For comments, likes, dislikes - scroll to the comment itself
			url += `?comment=${notification.relatedComment}`;
		}

		// Determine what content to show
		const isCommentNotification = ['postCommentLike', 'postCommentDislike', 'postReply', 'comment'].includes(notification.type);
		const showCommentContent = isCommentNotification && notification.commentContent;

		return (
			<Link
				to={url}
				className='mt-2 p-2 bg-gray-50 rounded-md flex items-center space-x-2 hover:bg-gray-100 transition-colors'
			>
				{relatedPost.image && !showCommentContent && (
					<img src={relatedPost.image} alt='Post preview' className='w-10 h-10 object-cover rounded' />
				)}
				<div className='flex-1 overflow-hidden'>
					{showCommentContent ? (
						<>
							<p className='text-sm text-gray-700 truncate italic'>"{notification.commentContent}"</p>
							<p className='text-xs text-gray-500 mt-0.5 truncate'>in {relatedPost.content || 'post'}</p>
						</>
					) : (
						<p className='text-sm text-gray-600 truncate'>{relatedPost.content}</p>
					)}
				</div>
				<ExternalLink size={14} className='text-gray-400' />
			</Link>
		);
	};



	const renderRelatedJobPost = (relatedJobPost) => {
		if (!relatedJobPost) return null;

		return (
			<Link
				to={`/job/${relatedJobPost._id}`}
				className='mt-2 p-2 bg-gray-50 rounded-md flex items-center space-x-2 hover:bg-gray-100 transition-colors'
			>
				<div className='flex-1 overflow-hidden'>
					<p className='text-sm font-medium text-gray-900 truncate'>{relatedJobPost.title}</p>
					<p className='text-xs text-gray-600 truncate'>{relatedJobPost.company} • {relatedJobPost.location}</p>
				</div>
				<ExternalLink size={14} className='text-gray-400' />
			</Link>
		);
	};

	const renderRelatedDiscussion = (relatedDiscussion, notification) => {
		if (!relatedDiscussion) return null;

		// Build URL with query params for comment/reply navigation
		let url = `/discussion/${relatedDiscussion._id}`;
		
		// Add parameters based on notification type
		if (notification.relatedReply) {
			// For replies and mentions in replies - scroll directly to the reply
			url += `?comment=${notification.relatedComment}&reply=${notification.relatedReply}`;
		} else if (notification.relatedComment) {
			// For comments, likes, dislikes, mentions in comments - scroll to the comment itself
			url += `?comment=${notification.relatedComment}`;
		}

		// Determine what content to show
		const isCommentNotification = ['discussionCommentLike', 'discussionCommentDislike', 'discussionReply', 'discussionMention'].includes(notification.type);
		const showCommentContent = isCommentNotification && notification.commentContent;

		return (
			<Link
				to={url}
				className='mt-2 p-2 bg-gray-50 rounded-md flex items-center space-x-2 hover:bg-gray-100 transition-colors'
			>
				<div className='flex-1 overflow-hidden'>
					{showCommentContent ? (
						<>
							<p className='text-sm text-gray-700 truncate italic'>"{notification.commentContent}"</p>
							<p className='text-xs text-gray-500 mt-0.5'>in {relatedDiscussion.title}</p>
						</>
					) : (
						<>
							<p className='text-sm font-medium text-gray-900 truncate'>{relatedDiscussion.title}</p>
							{relatedDiscussion.category && (
								<p className='text-xs text-gray-600'>{relatedDiscussion.category}</p>
							)}
						</>
					)}
				</div>
				<ExternalLink size={14} className='text-gray-400' />
			</Link>
		);
	};

	const renderRelatedEvent = (relatedEvent) => {
		if (!relatedEvent) return null;

		return (
			<Link
				to={`/event/${relatedEvent._id}`}
				className='mt-2 p-2 bg-gray-50 rounded-md flex items-center space-x-2 hover:bg-gray-100 transition-colors'
			>
				<div className='flex-1 overflow-hidden'>
					<p className='text-sm font-medium text-gray-900 truncate'>{relatedEvent.title}</p>
					<p className='text-xs text-gray-600 truncate'>
						{relatedEvent.eventDate && new Date(relatedEvent.eventDate).toLocaleDateString('en-US', { 
							month: 'short', 
							day: 'numeric', 
							year: 'numeric' 
						})}
						{relatedEvent.location && ` • ${relatedEvent.location}`}
					</p>
				</div>
				<ExternalLink size={14} className='text-gray-400' />
			</Link>
		);
	};



  return (
    <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
			<div className='col-span-1 lg:col-span-1'>
				<Sidebar user={ authUser } />
			</div>
			<div className='col-span-1 lg:col-span-3'>
				<div className='bg-white rounded-lg shadow p-6'>

								<div className='flex items-center justify-between mb-6'>
									<h1 className='text-2xl font-bold'>Notifications</h1>
									{notifications && notifications.data.some(n => !n.read) && (
										<button
											onClick={handleMarkAllAsRead}
											className='flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition duration-300 text-sm'
										>
											<CheckCircle2 size={16} />
											Mark all as read
										</button>
									)}
								</div>

								{/* Notification Tabs */}
								<div className='flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg'>
									<button
										onClick={() => {
											setActiveTab('all')
											setFilter('all')
										}}
										className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
											activeTab === 'all'
												? 'bg-white text-gray-900 shadow-sm'
												: 'text-gray-600 hover:text-gray-900'
										}`}
									>
										All
									</button>
									<button
										onClick={() => {
											setActiveTab('posts')
											setFilter('all')
										}}
										className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
											activeTab === 'posts'
												? 'bg-white text-gray-900 shadow-sm'
												: 'text-gray-600 hover:text-gray-900'
										}`}
									>
										Posts
									</button>
									<button
										onClick={() => {
											setActiveTab('jobs')
											setFilter('all')
										}}
										className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
											activeTab === 'jobs'
												? 'bg-white text-gray-900 shadow-sm'
												: 'text-gray-600 hover:text-gray-900'
										}`}
									>
										Jobs
									</button>
									<button
										onClick={() => {
											setActiveTab('forums')
											setFilter('all')
										}}
										className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
											activeTab === 'forums'
												? 'bg-white text-gray-900 shadow-sm'
												: 'text-gray-600 hover:text-gray-900'
										}`}
									>
										Forums
									</button>
									<button
										onClick={() => {
											setActiveTab('events')
											setFilter('all')
										}}
										className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
											activeTab === 'events'
												? 'bg-white text-gray-900 shadow-sm'
												: 'text-gray-600 hover:text-gray-900'
										}`}
									>
										Events
									</button>
									<button
										onClick={() => {
											setActiveTab('mentorship')
											setFilter('all')
										}}
										className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
											activeTab === 'mentorship'
												? 'bg-white text-gray-900 shadow-sm'
												: 'text-gray-600 hover:text-gray-900'
										}`}
									>
										Mentorship
									</button>
								</div>

					{isLoading ? (
						<p>Loading notifications...</p>
					) : notifications && notifications.data.length > 0 ? (
						<ul>
							{filterNotifications(notifications.data).map((notification) => (
								<li
									key={notification._id}
									className={`w-full bg-white border rounded-lg p-4 my-4 transition-all hover:shadow-md ${
										!notification.read ? "border-red-500" : "border-gray-200"
									}`}
								>
									<div className='flex items-start justify-between'>
										<div className='flex items-center space-x-4 w-full'>
											{notification.relatedUser ? (
												<Link to={`/profile/${notification.relatedUser.username}`}>
													<img
														src={notification.relatedUser.profilePicture || "/avatar.png"}
														alt={notification.relatedUser.name}
														className='w-12 h-12 rounded-full object-cover'
													/>
												</Link>
											) : (
												<div className='w-12 h-12 flex items-center justify-center rounded-full bg-gray-200 min-w-12'>
													<Calendar className='text-gray-500' size={24} />
												</div>
											)}

											<div className='w-full'>
												<div className='flex items-center gap-2'>
													<div className='w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full'>
														{renderNotificationIcon(notification.type)}
													</div>
													<p className='text-sm w-full'>{renderNotificationContent(notification)}</p>
												</div>
												<p className='text-xs text-gray-500 mt-1'>
													{formatDistanceToNow(new Date(notification.createdAt), {
														addSuffix: true,
													})}
												</p>
												{renderRelatedPost(notification.relatedPost, notification)}
												{renderRelatedJobPost(notification.relatedJobPost)}
												{renderRelatedDiscussion(notification.relatedDiscussion, notification)}
												{renderRelatedEvent(notification.relatedEvent)}
											</div>
										</div>

										<div className='flex gap-2'>
											{!notification.read && (
												<button
													onClick={() => markAsReadMutation(notification._id)}
													className='p-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors'
													aria-label='Mark as read'
												>
													<Eye size={16} />
												</button>
											)}

											<button
												onClick={() => deleteNotificationMutation(notification._id)}
												className='p-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors'
												aria-label='Delete notification'
											>
												<Trash2 size={16} />
											</button>
										</div>
									</div>
								</li>
							))}
						</ul>
					) : (
						<div className='text-center py-8'>
							<p className='text-gray-500'>
								{activeTab === 'all' && 'No notifications at the moment.'}
								{activeTab === 'posts' && 'No post notifications yet.'}
								{activeTab === 'jobs' && 'No job notifications yet.'}
								{activeTab === 'forums' && 'No forum notifications yet.'}
								{activeTab === 'events' && 'No event notifications yet.'}
								{activeTab === 'mentorship' && 'No mentorship notifications yet.'}
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
  )
}

export default NotificationsPage