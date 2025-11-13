import { Bell, Home, UserPlus, Briefcase, Calendar, Trophy, MessageSquare } from "lucide-react"
import { Link } from "react-router-dom"

const Sidebar = ({ user }) => {
    if (!user) return null; // Handle loading state
  
    return (
        <div className="sticky top-[80px] max-h-[calc(100vh-104px)] overflow-y-auto z-20 pr-1 hidden lg:flex lg:flex-col lg:gap-4">
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
                                    to='/my-posted-jobs'
                                    className='flex items-center py-2 px-4 rounded-md hover:bg-primary hover:text-white transition-colors'
                                >
                                    <Briefcase className='mr-2' size={20} /> My Jobs
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to='/messages'
                                    className='flex items-center py-2 px-4 rounded-md hover:bg-primary hover:text-white transition-colors'
                                >
                                    <MessageSquare className='mr-2' size={20} /> Messages
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
        </div>
    )
}

export default Sidebar