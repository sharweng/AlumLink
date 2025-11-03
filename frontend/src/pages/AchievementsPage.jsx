import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { axiosInstance } from '../lib/axios';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Trophy, TrendingUp, MessageSquare, Heart, Users, Briefcase, Calendar, ArrowLeft, Loader } from 'lucide-react';

const AchievementsPage = () => {
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData(["authUser"]);

  // Fetch all achievement data
  const { data: postsData, isLoading: loadingPosts } = useQuery({
    queryKey: ['recognition-posts-full'],
    queryFn: async () => {
      const res = await axiosInstance.get('/achievements/posts?limit=10');
      return res.data;
    },
  });

  const { data: discussionsData, isLoading: loadingDiscussions } = useQuery({
    queryKey: ['recognition-discussions-full'],
    queryFn: async () => {
      const res = await axiosInstance.get('/achievements/discussions?limit=10');
      return res.data;
    },
  });

  const { data: jobsData, isLoading: loadingJobs } = useQuery({
    queryKey: ['recognition-jobs-full'],
    queryFn: async () => {
      const res = await axiosInstance.get('/achievements/jobs?limit=10');
      return res.data;
    },
  });

  const { data: eventsData, isLoading: loadingEvents } = useQuery({
    queryKey: ['recognition-events-full'],
    queryFn: async () => {
      const res = await axiosInstance.get('/achievements/events?limit=10');
      return res.data;
    },
  });

  const isLoading = loadingPosts || loadingDiscussions || loadingJobs || loadingEvents;

  const renderFullList = (users, title, icon, color = 'text-gray-700', scrollable = false) => {
    if (!users || users.length === 0) {
      return (
        <div className='mb-3'>
          <div className='flex items-center mb-2'>
            <div className={`p-1.5 rounded-full mr-2 bg-gray-100`}>
              {icon}
            </div>
            <h3 className='text-sm font-semibold text-gray-800'>{title}</h3>
          </div>
          <div className='bg-white rounded-md border border-gray-200 overflow-hidden shadow-sm p-4 text-center'>
            <p className='text-sm text-gray-500'>No achievements yet</p>
          </div>
        </div>
      );
    }

    return (
      <div className='mb-3'>
        <div className='flex items-center mb-2'>
          <div className={`p-1.5 rounded-full mr-2 bg-gray-100`}>
            {icon}
          </div>
          <h3 className='text-sm font-semibold text-gray-800'>{title}</h3>
        </div>
        <div className='bg-white rounded-md border border-gray-200 overflow-hidden shadow-sm'>
          <div className={`${scrollable ? 'max-h-[60vh] overflow-y-auto pr-2 divide-y divide-gray-100' : 'divide-y divide-gray-100'}`}>
            {users.map((item, index) => (
              <Link
                key={item.user._id}
                to={`/profile/${item.user.username}`}
                className='flex items-center space-x-2 p-2 hover:bg-gray-50 transition-colors'
              >
                <span className='text-gray-600 font-bold text-sm w-4 text-center flex-shrink-0'>
                  {index + 1}
                </span>
                <img
                  src={item.user.profilePicture || "/avatar.png"}
                  alt={item.user.name}
                  className='w-6 h-6 rounded-full flex-shrink-0'
                />
                <div className='flex-1 min-w-0'>
                  <p className='font-medium text-sm truncate text-gray-900'>{item.user.name}</p>
                  <p className='text-xs text-gray-500 truncate'>@{item.user.username}</p>
                </div>
                <div className='text-right flex-shrink-0'>
                  <p className='font-semibold text-sm text-gray-800'>{item.count}</p>
                  <p className='text-xs text-gray-500'>{getCountLabel(title)}</p>
                </div>
              </Link>
            ))}
          </div>
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

  const [activeTab, setActiveTab] = useState('all');

  return (
    <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
      <div className='lg:col-span-1'>
        <Sidebar user={authUser} />
      </div>

      <div className='lg:col-span-3'>
        <div className='mb-4'>
          <div className='flex items-start justify-between'>
            <div>
              <h1 className='text-3xl font-bold flex items-center gap-2 text-gray-900'>
                <Trophy className='text-primary' />
                Achievements
              </h1>
              <p className='text-gray-600 mt-1'>This month's top contributors</p>
            </div>

            {/* Tabs */}
            <div className='ml-4 flex items-center space-x-2'>
              {['all','posts','discussions','jobs','events'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition ${activeTab===tab ? 'bg-primary text-primary-content' : 'bg-white border border-gray-200 hover:bg-gray-50'}`}
                >
                  {tab === 'all' ? 'Overview' : tab.charAt(0).toUpperCase()+tab.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div>
          {isLoading ? (
            <div className='flex justify-center items-center py-12'>
              <Loader className='animate-spin text-primary' size={48} />
            </div>
          ) : (
            <>
              {activeTab === 'all' ? (
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                  {/* keep existing quadrant layout */}
                  <div className='bg-white rounded-lg shadow-md p-4 border border-gray-200'>
                    <div className='flex items-center mb-3'>
                      <MessageSquare className='w-5 h-5 text-gray-700 mr-2' />
                      <h2 className='text-lg font-bold text-gray-900'>Post Achievements</h2>
                    </div>
                    <div className='space-y-3'>
                      {!postsData?.topPosters?.length && !postsData?.topCommenters?.length && !postsData?.topReactors?.length ? (
                        <div className='text-center py-8'>
                          <MessageSquare className='w-12 h-12 text-gray-300 mx-auto mb-2' />
                          <p className='text-gray-500'>No post achievements yet</p>
                        </div>
                      ) : (
                        <>
                          {renderFullList(postsData?.topPosters?.slice(0,3), 'Top Posters', <TrendingUp className='w-3.5 h-3.5 text-gray-700' />, 'text-gray-700')}
                          {renderFullList(postsData?.topCommenters?.slice(0,3), 'Top Commenters', <MessageSquare className='w-3.5 h-3.5 text-gray-700' />, 'text-gray-700')}
                          {renderFullList(postsData?.topReactors?.slice(0,3), 'Top Reactors', <Heart className='w-3.5 h-3.5 text-gray-700' />, 'text-gray-700')}
                        </>
                      )}
                    </div>
                  </div>

                  <div className='bg-white rounded-lg shadow-md p-4 border border-gray-200'>
                    <div className='flex items-center mb-3'>
                      <MessageSquare className='w-5 h-5 text-gray-700 mr-2' />
                      <h2 className='text-lg font-bold text-gray-900'>Discussion Achievements</h2>
                    </div>
                    <div className='space-y-3'>
                      {!discussionsData?.topPosters?.length && !discussionsData?.topCommenters?.length && !discussionsData?.topReactors?.length && !discussionsData?.mostDisliked?.length ? (
                        <div className='text-center py-8'>
                          <MessageSquare className='w-12 h-12 text-gray-300 mx-auto mb-2' />
                          <p className='text-gray-500'>No discussion achievements yet</p>
                        </div>
                      ) : (
                        <>
                          {renderFullList(discussionsData?.topPosters?.slice(0,3), 'Top Discussion Starters', <TrendingUp className='w-3.5 h-3.5 text-gray-700' />, 'text-gray-700')}
                          {renderFullList(discussionsData?.topCommenters?.slice(0,3), 'Top Commenters', <MessageSquare className='w-3.5 h-3.5 text-gray-700' />, 'text-gray-700')}
                          {renderFullList(discussionsData?.topReactors?.slice(0,3), 'Top Reactors', <Heart className='w-3.5 h-3.5 text-gray-700' />, 'text-gray-700')}
                          {renderFullList(discussionsData?.mostDisliked?.slice(0,3), 'Most Disliked', <Heart className='w-3.5 h-3.5 text-gray-700' />, 'text-gray-700')}
                        </>
                      )}
                    </div>
                  </div>

                  <div className='bg-white rounded-lg shadow-md p-4 border border-gray-200'>
                    <div className='flex items-center mb-3'>
                      <Briefcase className='w-5 h-5 text-gray-700 mr-2' />
                      <h2 className='text-lg font-bold text-gray-900'>Job Achievements</h2>
                    </div>
                    <div className='space-y-3'>
                      {!jobsData?.topJobPosters?.length && !jobsData?.topApplicants?.length ? (
                        <div className='text-center py-8'>
                          <Briefcase className='w-12 h-12 text-gray-300 mx-auto mb-2' />
                          <p className='text-gray-500'>No job achievements yet</p>
                        </div>
                      ) : (
                        <>
                          {renderFullList(jobsData?.topJobPosters?.slice(0,3), 'Top Job Posters', <Briefcase className='w-3.5 h-3.5 text-gray-700' />, 'text-gray-700')}
                          {renderFullList(jobsData?.topApplicants?.slice(0,3), 'Top Applicants', <Users className='w-3.5 h-3.5 text-gray-700' />, 'text-gray-700')}
                        </>
                      )}
                    </div>
                  </div>

                  <div className='bg-white rounded-lg shadow-md p-4 border border-gray-200'>
                    <div className='flex items-center mb-3'>
                      <Calendar className='w-5 h-5 text-gray-700 mr-2' />
                      <h2 className='text-lg font-bold text-gray-900'>Event Achievements</h2>
                    </div>
                    <div className='space-y-3'>
                      {!eventsData?.topOrganizers?.length && !eventsData?.topAttendees?.length ? (
                        <div className='text-center py-8'>
                          <Calendar className='w-12 h-12 text-gray-300 mx-auto mb-2' />
                          <p className='text-gray-500'>No event achievements yet</p>
                        </div>
                      ) : (
                        <>
                          {renderFullList(eventsData?.topOrganizers?.slice(0,3), 'Top Organizers', <Calendar className='w-3.5 h-3.5 text-gray-700' />, 'text-gray-700')}
                          {renderFullList(eventsData?.topAttendees?.slice(0,3), 'Top Attendees', <Users className='w-3.5 h-3.5 text-gray-700' />, 'text-gray-700')}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                // Multi-column tab views with per-column scroll
                <>
                  {activeTab === 'posts' && (
                    <>
                      {!postsData?.topPosters?.length && !postsData?.topCommenters?.length && !postsData?.topReactors?.length ? (
                        <div className='col-span-full bg-white rounded-lg shadow-md p-12 text-center'>
                          <MessageSquare className='w-16 h-16 text-gray-300 mx-auto mb-4' />
                          <h3 className='text-xl font-semibold text-gray-700 mb-2'>No Post Achievements Yet</h3>
                          <p className='text-gray-500'>Post achievements will appear here as users create and engage with posts.</p>
                        </div>
                      ) : (
                        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                          {renderFullList(postsData?.topPosters, 'Top Posters', <TrendingUp className='w-3.5 h-3.5 text-gray-700' />, 'text-gray-700', true)}
                          {renderFullList(postsData?.topCommenters, 'Top Commenters', <MessageSquare className='w-3.5 h-3.5 text-gray-700' />, 'text-gray-700', true)}
                          {renderFullList(postsData?.topReactors, 'Top Reactors', <Heart className='w-3.5 h-3.5 text-gray-700' />, 'text-gray-700', true)}
                        </div>
                      )}
                    </>
                  )}

                  {activeTab === 'discussions' && (
                    <>
                      {!discussionsData?.topPosters?.length && !discussionsData?.topCommenters?.length && !discussionsData?.topReactors?.length && !discussionsData?.mostDisliked?.length ? (
                        <div className='col-span-full bg-white rounded-lg shadow-md p-12 text-center'>
                          <MessageSquare className='w-16 h-16 text-gray-300 mx-auto mb-4' />
                          <h3 className='text-xl font-semibold text-gray-700 mb-2'>No Discussion Achievements Yet</h3>
                          <p className='text-gray-500'>Discussion achievements will appear here as users participate in forums.</p>
                        </div>
                      ) : (
                        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                          {renderFullList(discussionsData?.topPosters, 'Top Discussion Starters', <TrendingUp className='w-3.5 h-3.5 text-gray-700' />, 'text-gray-700', true)}
                          {renderFullList(discussionsData?.topCommenters, 'Top Commenters', <MessageSquare className='w-3.5 h-3.5 text-gray-700' />, 'text-gray-700', true)}
                          {renderFullList(discussionsData?.topReactors, 'Top Reactors', <Heart className='w-3.5 h-3.5 text-gray-700' />, 'text-gray-700', true)}
                          {renderFullList(discussionsData?.mostDisliked, 'Most Disliked', <Heart className='w-3.5 h-3.5 text-gray-700' />, 'text-gray-700', true)}
                        </div>
                      )}
                    </>
                  )}

                  {activeTab === 'jobs' && (
                    <>
                      {!jobsData?.topJobPosters?.length && !jobsData?.topApplicants?.length ? (
                        <div className='col-span-full bg-white rounded-lg shadow-md p-12 text-center'>
                          <Briefcase className='w-16 h-16 text-gray-300 mx-auto mb-4' />
                          <h3 className='text-xl font-semibold text-gray-700 mb-2'>No Job Achievements Yet</h3>
                          <p className='text-gray-500'>Job achievements will appear here as users post and apply for jobs.</p>
                        </div>
                      ) : (
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                          {renderFullList(jobsData?.topJobPosters, 'Top Job Posters', <Briefcase className='w-3.5 h-3.5 text-gray-700' />, 'text-gray-700', true)}
                          {renderFullList(jobsData?.topApplicants, 'Top Applicants', <Users className='w-3.5 h-3.5 text-gray-700' />, 'text-gray-700', true)}
                        </div>
                      )}
                    </>
                  )}

                  {activeTab === 'events' && (
                    <>
                      {!eventsData?.topOrganizers?.length && !eventsData?.topAttendees?.length ? (
                        <div className='col-span-full bg-white rounded-lg shadow-md p-12 text-center'>
                          <Calendar className='w-16 h-16 text-gray-300 mx-auto mb-4' />
                          <h3 className='text-xl font-semibold text-gray-700 mb-2'>No Event Achievements Yet</h3>
                          <p className='text-gray-500'>Event achievements will appear here as users organize and attend events.</p>
                        </div>
                      ) : (
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                          {renderFullList(eventsData?.topOrganizers, 'Top Organizers', <Calendar className='w-3.5 h-3.5 text-gray-700' />, 'text-gray-700', true)}
                          {renderFullList(eventsData?.topAttendees, 'Top Attendees', <Users className='w-3.5 h-3.5 text-gray-700' />, 'text-gray-700', true)}
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AchievementsPage;