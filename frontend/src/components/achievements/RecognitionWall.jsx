import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '../../lib/axios';
import { Link } from 'react-router-dom';
import { Trophy, TrendingUp, MessageSquare, Heart, Users, Briefcase, Calendar, UserCheck, ChevronRight } from 'lucide-react';

const RecognitionWall = ({ context }) => {
  const { data: recognitionData, isLoading } = useQuery({
    queryKey: [`recognition-${context}`],
    queryFn: async () => {
      const res = await axiosInstance.get(`/achievements/${context}`);
      return res.data;
    },
    enabled: !!context,
  });

  if (isLoading) {
    return (
      <div className='bg-secondary rounded-lg shadow p-4'>
        <div className='animate-pulse'>
          <div className='h-6 bg-gray-300 rounded mb-4'></div>
          <div className='space-y-3'>
            {[1, 2, 3].map(i => (
              <div key={i} className='flex items-center space-x-3'>
                <div className='w-8 h-8 bg-gray-300 rounded-full'></div>
                <div className='flex-1'>
                  <div className='h-4 bg-gray-300 rounded w-3/4'></div>
                  <div className='h-3 bg-gray-300 rounded w-1/2 mt-1'></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!recognitionData) return null;

  const renderUserList = (users, title, icon, color = 'text-yellow-500') => {
    if (!users || users.length === 0) return null;

    return (
      <div className='mb-6'>
        <div className='flex items-center mb-3'>
          <div className={`p-1 rounded-full mr-2 ${color.replace('text-', 'bg-').replace('-500', '-100')}`}>
            {icon}
          </div>
          <h3 className='font-semibold text-sm'>{title}</h3>
        </div>
        <div className='space-y-1'>
          {users.map((item, index) => (
            <Link
              key={item.user._id}
              to={`/profile/${item.user.username}`}
              className='flex items-center space-x-2 p-1.5 rounded-md hover:bg-base-100 transition-colors'
            >
              <div className='flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-xs font-bold'>
                {index + 1}
              </div>
              <img
                src={item.user.profilePicture || "/avatar.png"}
                alt={item.user.name}
                className='w-6 h-6 rounded-full'
              />
              <div className='flex-1 min-w-0'>
                <p className='text-xs font-medium truncate'>{item.user.name}</p>
                <p className='text-xs text-info'>{item.count} {getCountLabel(title)}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  };

  const getCountLabel = (title) => {
    if (title.includes('Poster') || title.includes('Organizer')) return 'posts';
    if (title.includes('Commenter')) return 'comments';
    if (title.includes('Reactor')) return 'likes';
    if (title.includes('Applicant')) return 'applications';
    if (title.includes('Attendee')) return 'events';
    if (title.includes('Disliked')) return 'dislikes';
    return 'items';
  };

  const getContextTitle = () => {
    switch (context) {
      case 'posts': return 'Post Achievements';
      case 'discussions': return 'Forum Achievements';
      case 'jobs': return 'Job Achievements';
      case 'events': return 'Event Achievements';
      default: return 'Achievements';
    }
  };

  return (
    <div className='bg-secondary rounded-lg shadow'>
      <div className='p-4 border-b border-base-100'>
        <div className='flex items-center'>
          <Trophy className='w-5 h-5 text-yellow-500 mr-2' />
          <h2 className='font-semibold'>{getContextTitle()}</h2>
        </div>
        <p className='text-xs text-info mt-1'>This month's top contributors</p>
      </div>
      <div className='p-4'>
        {context === 'posts' && (
          <>
            {renderUserList(recognitionData.topPosters, 'Top Posters', <TrendingUp className='w-4 h-4 text-blue-500' />, 'text-blue-500')}
            {renderUserList(recognitionData.topCommenters, 'Top Commenters', <MessageSquare className='w-4 h-4 text-green-500' />, 'text-green-500')}
            {renderUserList(recognitionData.topReactors, 'Top Reactors', <Heart className='w-4 h-4 text-red-500' />, 'text-red-500')}
          </>
        )}

        {context === 'discussions' && (
          <>
            {renderUserList(recognitionData.topPosters, 'Top Discussion Starters', <TrendingUp className='w-4 h-4 text-blue-500' />, 'text-blue-500')}
            {renderUserList(recognitionData.topCommenters, 'Top Commenters', <MessageSquare className='w-4 h-4 text-green-500' />, 'text-green-500')}
            {renderUserList(recognitionData.topReactors, 'Top Reactors', <Heart className='w-4 h-4 text-red-500' />, 'text-red-500')}
            {renderUserList(recognitionData.mostDisliked, 'Most Disliked', <Heart className='w-4 h-4 text-gray-500' />, 'text-gray-500')}
          </>
        )}

        {context === 'jobs' && (
          <>
            {renderUserList(recognitionData.topJobPosters, 'Top Job Posters', <Briefcase className='w-4 h-4 text-purple-500' />, 'text-purple-500')}
            {renderUserList(recognitionData.topApplicants, 'Top Applicants', <Users className='w-4 h-4 text-orange-500' />, 'text-orange-500')}
          </>
        )}

        {context === 'events' && (
          <>
            {renderUserList(recognitionData.topOrganizers, 'Top Organizers', <Calendar className='w-4 h-4 text-indigo-500' />, 'text-indigo-500')}
            {renderUserList(recognitionData.topAttendees, 'Top Attendees', <Users className='w-4 h-4 text-teal-500' />, 'text-teal-500')}
          </>
        )}

        {(!recognitionData || Object.values(recognitionData).every(arr => !arr || arr.length === 0)) && (
          <div className='text-center py-8'>
            <Trophy className='w-12 h-12 text-gray-400 mx-auto mb-2' />
            <p className='text-info text-sm'>No achievements yet this month</p>
          </div>
        )}
        
        <div className='mt-3 pt-3 border-t border-base-100'>
          <Link
            to={`/achievements?context=${context}`}
            className='flex items-center justify-center text-sm text-primary hover:text-primary-focus transition-colors'
          >
            View All Achievements
            <ChevronRight className='w-4 h-4 ml-1' />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RecognitionWall;