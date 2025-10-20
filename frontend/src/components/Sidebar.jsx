import { Bell, Home, UserPlus, Briefcase, Calendar, Trophy, MessageSquare } from "lucide-react"
import { Link } from "react-router-dom"
import { useState } from 'react'
import FeedbackModal from './common/FeedbackModal'

const Sidebar = ({ user }) => {
    const [showFeedback, setShowFeedback] = useState(false)
    if (!user) return null; // Handle loading state
  
    return (
        <>
            <div className='bg-secondary rounded-lg shadow'>
        <div className='p-4 text-center'>
            <div
                className='h-16 rounded-t-lg bg-cover bg-center'
                style={{
                    backgroundImage: `url("${user.bannerImg || "/banner.png"}")`,
                }}
            />
            <Link to={`/profile/${user.username}`}>
                <img
                    src={user.profilePicture || "/avatar.png"}
                    alt={user.name}
                    className='w-20 h-20 rounded-full mx-auto mt-[-40px]'
                />
                <h2 className='text-xl font-semibold mt-2'>{user.name}</h2>
            </Link>
            <p className='text-info'>{user.headline}</p>
            <p className='text-info text-xs'>{ user.links?.length || 0} links</p>
        </div>
        <div className='border-t border-base-100 p-4'>
            <nav>
                <ul className='space-y-2'>
                    <li>
                        <Link
                            to='/'
                            className='flex items-center py-2 px-4 rounded-md hover:bg-primary hover:text-white transition-colors'
                        >
                            <Home className='mr-2' size={20} /> Home
                        </Link>
                    </li>
                    <li>
                        <Link
                            to='/jobs'
                            className='flex items-center py-2 px-4 rounded-md hover:bg-primary hover:text-white transition-colors'
                        >
                            <Briefcase className='mr-2' size={20} /> Job Board
                        </Link>
                    </li>
                    <li>
                        <Link
                            to='/network'
                            className='flex items-center py-2 px-4 rounded-md hover:bg-primary hover:text-white transition-colors'
                        >
                            <UserPlus className='mr-2' size={20} /> My Network
                        </Link>
                    </li>
                    <li>
                        <Link
                            to='/my-events'
                            className='flex items-center py-2 px-4 rounded-md hover:bg-primary hover:text-white transition-colors'
                        >
                            <Calendar className='mr-2' size={20} /> My Events
                        </Link>
                    </li>
                    <li>
                        <Link
                            to='/notifications'
                            className='flex items-center py-2 px-4 rounded-md hover:bg-primary hover:text-white transition-colors'
                        >
                            <Bell className='mr-2' size={20} /> Notifications
                        </Link>
                    </li>
                    <li>
                        <Link
                            to='/achievements'
                            className='flex items-center py-2 px-4 rounded-md hover:bg-primary hover:text-white transition-colors'
                        >
                            <Trophy className='mr-2' size={20} /> Achievements
                        </Link>
                    </li>
                </ul>
            </nav>
        </div>
        <div className='border-t border-base-100 p-4'>
            <Link to={`/profile/${user.username}`} className='text-sm font-semibold'>
                Visit your profile
            </Link>
        </div>
            </div>
            {/* Feedback island separate from sidebar (visual island) */}
            <div className='mt-4'>
                <div className='bg-white rounded-lg shadow p-4 text-sm border border-red-100'>
                    <div className='flex items-start gap-3'>
                        <MessageSquare size={20} className='text-red-600' />
                        <div className='flex-1'>
                            <div className='font-semibold text-red-700'>Help improve AlumLink</div>
                            <div className='text-xs text-red-500'>Send general feedback or report issues</div>
                        </div>
                    </div>
                    <div className='mt-3 text-right'>
                        <button
                            onClick={() => setShowFeedback(true)}
                            className='px-3 py-1 text-sm rounded bg-red-50 text-red-700 hover:bg-red-100'
                        >
                            Send Feedback
                        </button>
                    </div>
                </div>
                <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
            </div>
        </>
    )
}

export default Sidebar