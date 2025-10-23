import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { axiosInstance } from "../lib/axios";
import ProfileHeader from "../components/about/ProfileHeader";
import Sidebar from "../components/Sidebar";
import AboutSection from "../components/about/AboutSection";
import ExperienceSection from "../components/about/ExperienceSection";
import BatchCourseSection from "../components/about/BatchCourseSection";
import SkillsSection from "../components/about/SkillsSection";
import MentorSettingsSection from "../components/about/MentorSettingsSection";
import toast from "react-hot-toast";
import { useState, useEffect } from "react";
import Post from "../components/post/Post";
import { Loader, XCircle, Users, Link2 } from "lucide-react";
import ChangeAccountSettings from "../components/about/ChangeAccountSettings";

const ProfilePage = () => {
  // Fix: define handleSave for AboutSection, ExperienceSection, SkillsSection
  const handleSave = (updatedData) => {
    updateProfile(updatedData);
  };
  const { username } = useParams();
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData(["authUser"]);
  const [activeTab, setActiveTab] = useState('posts');
  const [profileSubTab, setProfileSubTab] = useState('about');
  const [settingsTab, setSettingsTab] = useState('email');

  useEffect(() => {
    if (activeTab === 'settings') {
      setSettingsTab('email');
    }
  }, [activeTab]);

  const { data: userProfile, isLoading: isUserProfileLoading } = useQuery({
    queryKey: ["userProfile", username],
    queryFn: async () => axiosInstance.get(`/users/${username}`)
  });

  const { data: userPosts, isLoading: isPostsLoading } = useQuery({
    queryKey: ["userPosts", username],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get(`/posts/user/${username}`);
        return res.data;
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load posts");
        return [];
      }
    }
  });

  const { data: userLinks, isLoading: isLinksLoading } = useQuery({
    queryKey: ["userLinks", username],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get(`/links/user/${username}`);
        return res.data;
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load links");
        return { links: [] };
      }
    }
  });

  const updateLinksVisibilityMutation = useMutation({
    mutationFn: async (visibility) => axiosInstance.put('/links/visibility', { visibility }),
    onSuccess: () => {
      queryClient.invalidateQueries(["userLinks", username]);
      toast.success("Links visibility updated");
    }
  });

  const { mutate: updateProfile, isPending: isSaving } = useMutation({
    mutationFn: async (updatedData) => {
      await axiosInstance.put(`/users/profile`, updatedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["userProfile", username]);
      toast.success("Profile updated successfully");
    }
  });

  const { data: userData, isLoading: loadingUser } = useQuery({
    queryKey: ["profile", username],
    queryFn: async () => axiosInstance.get(`/users/${username}`)
  });

  if (loadingUser) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow">
        <Loader className="animate-spin h-10 w-10 text-primary mb-4" />
        <span className="text-lg text-info font-medium">Loading profile...</span>
      </div>
    );
  }

  if (!userData?.data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow">
        <XCircle className="h-12 w-12 text-gray-400 mb-3" />
        <span className="text-xl font-semibold text-gray-500">Profile not found</span>
        <span className="text-info mt-1">The profile you are looking for does not exist or was removed.</span>
      </div>
    );
  }

  if (userData.data.banned && !(authUser?.role === 'admin' || authUser?._id === userData.data._id)) {
    // Explicit banned page for non-admin and non-owner
    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Sidebar user={authUser} />
        </div>
        <div className="lg:col-span-3">
          <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow p-6">
            <XCircle className="h-12 w-12 text-red-400 mb-3" />
            <h2 className="text-2xl font-semibold mb-2">This profile has been banned</h2>
            <p className="text-gray-600">The user you're trying to view has been banned by the admins.</p>
          </div>
        </div>
      </div>
    )
  }

  const isOwnProfile = authUser?.username === userProfile.data.username;
  const userDataFinal = isOwnProfile ? authUser : userProfile.data;

  const handleSaveHeader = (updatedData, onDone) => {
    updateProfile(updatedData, {
      onSuccess: () => {
        if (onDone) onDone();
      }
    });
  };

  const tabs = [
    { id: 'posts', label: 'Posts' },
    { id: 'profile', label: 'Profile' },
    { id: 'links', label: 'Links' }
  ];

  const profileSubTabs = [
    { id: 'about', label: 'About' },
    { id: 'experience', label: 'Experience' },
    { id: 'academic', label: 'Academic' },
    { id: 'skills', label: 'Skills' },
    ...(isOwnProfile ? [{ id: 'mentor', label: 'Mentor Settings' }] : [])
  ];

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="col-span-1 lg:col-span-1">
          <Sidebar user={authUser} />
        </div>
        {/* Main Content */}
        <div className="col-span-1 lg:col-span-3">
          <ProfileHeader 
            userData={ userDataFinal }
            isOwnProfile={ isOwnProfile }
            onSave={ handleSaveHeader }
            isSaving={isSaving }
            tabs={tabs}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />

          {/* Add gap below ProfileHeader for settings tab */}
          {activeTab === 'settings' && <div className="mb-6" />}

          <div style={{ minHeight: '18rem' }}>

            {activeTab === 'posts' && (
              <div>
                {isPostsLoading ? (
                  <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow">
                    <Loader className="animate-spin h-10 w-10 text-primary mb-4" />
                    <span className="text-lg text-info font-medium">Loading posts...</span>
                  </div>
                ) : userPosts?.length > 0 ? (
                  <div className="space-y-4">
                    {userPosts.map(post => (
                      <Post key={post._id} post={post} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow">
                    <Users size={64} className="mx-auto text-red-500 mb-3" />
                    <span className="text-xl font-semibold text-gray-500">No Posts Yet</span>
                    <span className="text-info mt-1">This user hasn't posted anything yet.</span>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'profile' && (
              <div>
                {/* Two column layout */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Left column - Sub-tabs */}
                  <div className="lg:col-span-1">
                    <div className="space-y-2">
                      {profileSubTabs.map(subTab => (
                        <button
                          key={subTab.id}
                          onClick={() => setProfileSubTab(subTab.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg font-medium text-sm ${
                            profileSubTab === subTab.id
                              ? 'bg-primary text-white shadow'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {subTab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Right column - Content */}
                  <div className="lg:col-span-3">
                    {profileSubTab === 'about' && (
                      <AboutSection userData={ userDataFinal } isOwnProfile={ isOwnProfile } onSave={ handleSave } />
                    )}
                    {profileSubTab === 'experience' && (
                      userDataFinal.experience && userDataFinal.experience.length > 0 ? (
                        <ExperienceSection userData={ userDataFinal } isOwnProfile={ isOwnProfile } onSave={ handleSave } />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow">
                          <XCircle className="h-12 w-12 text-gray-400 mb-3" />
                          <span className="text-xl font-semibold text-gray-500">No Experience Listed</span>
                        </div>
                      )
                    )}
                    {profileSubTab === 'academic' && (
                      <BatchCourseSection userData={ userDataFinal } />
                    )}
                    {profileSubTab === 'skills' && (
                      userDataFinal.skills && userDataFinal.skills.length > 0 ? (
                        <SkillsSection userData={ userDataFinal } isOwnProfile={ isOwnProfile } onSave={ handleSave } />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow">
                          <XCircle className="h-12 w-12 text-gray-400 mb-3" />
                          <span className="text-xl font-semibold text-gray-500">No Skills Listed</span>
                        </div>
                      )
                    )}
                    {profileSubTab === 'mentor' && isOwnProfile && (
                      <MentorSettingsSection userData={ userDataFinal } isOwnProfile={ isOwnProfile } />
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'links' && (
              <div>
                {isOwnProfile && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Links Visibility</label>
                    <select
                      value={userDataFinal.linksVisibility || 'public'}
                      onChange={(e) => updateLinksVisibilityMutation.mutate(e.target.value)}
                      className="border rounded px-3 py-2"
                    >
                      <option value="private">Private - Only you can see</option>
                      <option value="public">Public - Everyone can see</option>
                      <option value="links">Links - Only linked users can see</option>
                    </select>
                  </div>
                )}

                {isLinksLoading ? (
                  <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow">
                    <Loader className="animate-spin h-10 w-10 text-primary mb-4" />
                    <span className="text-lg text-info font-medium">Loading links...</span>
                  </div>
                ) : !isOwnProfile && userLinks?.visibility === 'private' ? (
                  <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow">
                    <XCircle className="h-12 w-12 text-gray-400 mb-3" />
                    <span className="text-xl font-semibold text-gray-500">{userLinks.message}</span>
                  </div>
                ) : userLinks?.links?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {userLinks.links.map(link => (
                      <div key={link._id} className="bg-white p-4 rounded-lg shadow border">
                        <div className="flex items-center gap-3">
                          <img src={link.profilePicture || '/avatar.png'} alt={link.name} className="w-10 h-10 rounded-full" />
                          <div>
                            <p className="font-semibold">{link.name}</p>
                            <p className="text-sm text-gray-500">@{link.username}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow">
                    <Link2 size={64} className="mx-auto text-red-500 mb-3" />
                    <span className="text-xl font-semibold text-gray-500">No Links Yet</span>
                    <span className="text-info mt-1">This user hasn't linked with anyone yet.</span>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settings' && isOwnProfile && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4">Account Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Left column: settings tabs */}
                  <div className="md:col-span-1">
                    <ChangeAccountSettings.Sidebar activeTab={settingsTab} setActiveTab={setSettingsTab} />
                  </div>
                  {/* Right column: form content */}
                  <div className="md:col-span-3">
                    <ChangeAccountSettings userData={userDataFinal} activeTab={settingsTab} setActiveTab={setSettingsTab} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default ProfilePage