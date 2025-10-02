import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { axiosInstance } from '../lib/axios'
import toast from 'react-hot-toast'
import { ExternalLink, Eye, Heart, MessageSquare, Trash2, UserPlus, CheckCircle2, Briefcase } from 'lucide-react'
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
      // Jobs tab: notifications with relatedJobPost (job posts) 
      filtered = notifications.filter(notification => notification.relatedJobPost)
    }
    // 'all' tab shows everything, so no filtering needed
    
    // Apply type filter
    if (filter !== 'all') {
      if (filter === 'application') {
        filtered = filtered.filter(n => n.type === 'jobApplication')
      } else if (filter === 'link') {
        filtered = filtered.filter(n => n.type === 'linkAccepted')
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
      case "linkAccepted":
        return <UserPlus className='text-purple-500' />
      case "jobApplication":
        return <Briefcase className='text-blue-500' />
      default:
        return null
    }
  }

  const renderNotificationContent = (notification) => {
		const isJobNotification = !!notification.relatedJobPost;
		
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
			default:
				return null;
		}
	};

  const renderRelatedPost = (relatedPost) => {
		if (!relatedPost) return null;

		return (
			<Link
				to={`/post/${relatedPost._id}`}
				className='mt-2 p-2 bg-gray-50 rounded-md flex items-center space-x-2 hover:bg-gray-100 transition-colors'
			>
				{relatedPost.image && (
					<img src={relatedPost.image} alt='Post preview' className='w-10 h-10 object-cover rounded' />
				)}
				<div className='flex-1 overflow-hidden'>
					<p className='text-sm text-gray-600 truncate'>{relatedPost.content}</p>
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
				className='mt-2 p-2 bg-blue-50 rounded-md flex items-center space-x-2 hover:bg-blue-100 transition-colors'
			>
				<div className='flex-1 overflow-hidden'>
					<p className='text-sm font-medium text-gray-900 truncate'>{relatedJobPost.title}</p>
					<p className='text-xs text-gray-600 truncate'>{relatedJobPost.company} • {relatedJobPost.location}</p>
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
											setJobFilter('all')
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
											setJobFilter('all')
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
											setJobFilter('all')
										}}
										className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
											activeTab === 'jobs'
												? 'bg-white text-gray-900 shadow-sm'
												: 'text-gray-600 hover:text-gray-900'
										}`}
									>
										Jobs
									</button>
								</div>

								{/* Notification Type Filters */}
								<div className='flex space-x-2 mb-4 flex-wrap'>
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
									{(activeTab === 'all' || activeTab === 'jobs') && (
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
									{(activeTab === 'all') && (
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
											<Link to={`/profile/${notification.relatedUser.username}`}>
												<img
													src={notification.relatedUser.profilePicture || "/avatar.png"}
													alt={notification.relatedUser.name}
													className='w-12 h-12 rounded-full object-cover'
												/>
											</Link>

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
												{renderRelatedPost(notification.relatedPost)}
												{renderRelatedJobPost(notification.relatedJobPost)}
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
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
  )
}

export default NotificationsPage