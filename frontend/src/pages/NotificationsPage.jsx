import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { axiosInstance } from '../lib/axios'
import toast from 'react-hot-toast'
import { ExternalLink, Eye, Heart, MessageSquare, Trash2, UserPlus, CheckCircle2, Briefcase, X, AtSign, Reply, HeartOff, Calendar, Bell, XCircle, Star } from 'lucide-react'
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
								</div>

								{/* Notification Type Filters */}
								<div className='flex space-x-2 mb-4 flex-wrap gap-y-2'>
									<button
										onClick={() => setFilter('all')}
										className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
											filter === 'all'
												? 'bg-blue-500 text-white'
												: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
										}`}
									>
										All
									</button>
									
					{/* Combined filters for "All" tab */}
					{activeTab === 'all' && (
						<>
							<button
								onClick={() => setFilter('like')}
								className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
									filter === 'like'
										? 'bg-red-500 text-white'
										: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
								}`}
							>
								Likes
							</button>
							<button
								onClick={() => setFilter('comment')}
								className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
									filter === 'comment'
										? 'bg-green-500 text-white'
										: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
								}`}
							>
								Comments
							</button>
							<button
								onClick={() => setFilter('application')}
								className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
									filter === 'application'
										? 'bg-blue-500 text-white'
										: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
								}`}
							>
								Applications
							</button>
							<button
								onClick={() => setFilter('link')}
								className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
									filter === 'link'
										? 'bg-purple-500 text-white'
										: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
								}`}
							>
								Links
							</button>
							<button
								onClick={() => setFilter('eventRSVP')}
								className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
									filter === 'eventRSVP'
										? 'bg-green-500 text-white'
										: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
								}`}
							>
								Going
							</button>
							<button
								onClick={() => setFilter('eventInterested')}
								className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
									filter === 'eventInterested'
										? 'bg-yellow-500 text-white'
										: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
								}`}
							>
								Interested
							</button>
							<button
								onClick={() => setFilter('eventReminder')}
								className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
									filter === 'eventReminder'
										? 'bg-blue-500 text-white'
										: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
								}`}
							>
								Reminders
							</button>
							<button
								onClick={() => setFilter('eventUpdate')}
								className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
									filter === 'eventUpdate'
										? 'bg-orange-500 text-white'
										: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
								}`}
							>
								Updates
							</button>
							<button
								onClick={() => setFilter('eventCancelled')}
								className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
									filter === 'eventCancelled'
										? 'bg-red-500 text-white'
										: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
								}`}
							>
								Cancelled
							</button>
						</>
					)}									{/* Posts tab filters */}
									{activeTab === 'posts' && (
										<>
											<button
												onClick={() => setFilter('like')}
												className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
													filter === 'like'
														? 'bg-red-500 text-white'
														: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
												}`}
											>
												Likes
											</button>
											<button
												onClick={() => setFilter('comment')}
												className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
													filter === 'comment'
														? 'bg-green-500 text-white'
														: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
												}`}
											>
												Comments
											</button>
											<button
												onClick={() => setFilter('postReply')}
												className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
													filter === 'postReply'
														? 'bg-blue-500 text-white'
														: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
												}`}
											>
												Replies
											</button>
											<button
												onClick={() => setFilter('postMention')}
												className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
													filter === 'postMention'
														? 'bg-purple-500 text-white'
														: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
												}`}
											>
												Mentions
											</button>
										</>
									)}

									{/* Jobs tab filters */}
									{activeTab === 'jobs' && (
										<button
											onClick={() => setFilter('application')}
											className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
												filter === 'application'
													? 'bg-blue-500 text-white'
													: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
											}`}
										>
											Applications
										</button>
									)}

									{/* Forums tab filters */}
									{activeTab === 'forums' && (
										<>
											<button
												onClick={() => setFilter('discussionLike')}
												className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
													filter === 'discussionLike'
														? 'bg-red-500 text-white'
														: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
												}`}
											>
												Likes
											</button>
											<button
												onClick={() => setFilter('discussionComment')}
												className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
													filter === 'discussionComment'
														? 'bg-green-500 text-white'
														: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
												}`}
											>
												Comments
											</button>
											<button
												onClick={() => setFilter('discussionReply')}
												className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
													filter === 'discussionReply'
														? 'bg-blue-500 text-white'
														: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
												}`}
											>
												Replies
											</button>
											<button
												onClick={() => setFilter('discussionMention')}
												className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
													filter === 'discussionMention'
														? 'bg-purple-500 text-white'
														: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
												}`}
											>
												Mentions
											</button>
										</>
									)}

									{/* Events tab filters */}
									{activeTab === 'events' && (
										<>
											<button
												onClick={() => setFilter('eventRSVP')}
												className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
													filter === 'eventRSVP'
														? 'bg-green-500 text-white'
														: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
												}`}
											>
												Going
											</button>
											<button
												onClick={() => setFilter('eventInterested')}
												className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
													filter === 'eventInterested'
														? 'bg-yellow-500 text-white'
														: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
												}`}
											>
												Interested
											</button>
											<button
												onClick={() => setFilter('eventReminder')}
												className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
													filter === 'eventReminder'
														? 'bg-blue-500 text-white'
														: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
												}`}
											>
												Reminders
											</button>
											<button
												onClick={() => setFilter('eventUpdate')}
												className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
													filter === 'eventUpdate'
														? 'bg-orange-500 text-white'
														: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
												}`}
											>
												Updates
											</button>
											<button
												onClick={() => setFilter('eventCancelled')}
												className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
													filter === 'eventCancelled'
														? 'bg-red-500 text-white'
														: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
												}`}
											>
												Cancelled
											</button>
										</>
									)}
								</div>

					{isLoading ? (
						<p>Loading notifications...</p>
					) : notifications && notifications.data.length > 0 ? (
						<ul>
							{filterNotifications(notifications.data).map((notification) => (
								<li
									key={notification._id}
									className={`bg-white border rounded-lg p-4 my-4 transition-all hover:shadow-md ${
										!notification.read ? "border-red-500" : "border-gray-200"
									}`}
								>
									<div className='flex items-start justify-between'>
										<div className='flex items-center space-x-4'>
											{notification.relatedUser ? (
												<Link to={`/profile/${notification.relatedUser.username}`}>
													<img
														src={notification.relatedUser.profilePicture || "/avatar.png"}
														alt={notification.relatedUser.name}
														className='w-12 h-12 rounded-full object-cover'
													/>
												</Link>
											) : (
												<div className='w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center'>
													<Calendar className='text-gray-500' size={24} />
												</div>
											)}

											<div>
												<div className='flex items-center gap-2'>
													<div className='p-1 bg-gray-100 rounded-full'>
														{renderNotificationIcon(notification.type)}
													</div>
													<p className='text-sm'>{renderNotificationContent(notification)}</p>
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
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
  )
}

export default NotificationsPage