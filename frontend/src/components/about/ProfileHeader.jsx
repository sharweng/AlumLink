import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ChangeAccountSettings from "./ChangeAccountSettings";
import { useMemo, useState } from "react";
import { axiosInstance } from "../../lib/axios";
import toast from "react-hot-toast";
import { Camera, Clock, MapPin, UserCheck, UserPlus, X, Loader, MessageCircle, MoreVertical, CheckCircle, XCircle } from "lucide-react";
import ReportModal from "../common/ReportModal";
import { useNavigate } from "react-router-dom";

const ProfileHeader = ({ userData, isOwnProfile, onSave, isSaving, tabs, activeTab, setActiveTab }) => {
  const [banReason, setBanReason] = useState("");
  const [showUnbanModal, setShowUnbanModal] = useState(false);
  const [ isEditing, setIsEditing ] = useState(false);
  const [ editedData, setEditedData ] = useState({})
  const [ showMoreMenu, setShowMoreMenu ] = useState(false);
  const [ showReportModal, setShowReportModal ] = useState(false);
  const [ showBanModal, setShowBanModal ] = useState(false);

  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData(["authUser"]);
  // Assume authUser.role is 'admin' for admin check, and userData.banned for banned status
  const isAdmin = authUser?.role === 'admin';
  const isBanned = userData?.banned;
  const navigate = useNavigate();

  const { data: linkStatus, refetch:refetchLinkStatus } = useQuery({
    queryKey: ["linkStatus", userData._id],
    queryFn: () => axiosInstance.get(`/links/status/${ userData._id }`),
    enabled: !isOwnProfile
  });

  // Check if user can message this person
  const { data: canMessageData } = useQuery({
    queryKey: ["canMessage", userData._id],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get(`/messages/conversations/${userData._id}`);
        return { canMessage: true, conversationId: response.data._id };
      } catch (error) {
        // If 403, user cannot message (not connected/no mentorship)
        if (error.response?.status === 403) {
          return { canMessage: false };
        }
        throw error;
      }
    },
    enabled: !isOwnProfile,
    retry: false
  });

  const isLinked = userData.links.some((link) => link._id === authUser._id)

  const { mutate: sendLinkRequest } = useMutation({
    mutationFn: (userId) => axiosInstance.post(`/links/request/${ userId} `),
    onSuccess: () => {
      toast.success("Link request sent")
      refetchLinkStatus()
      queryClient.invalidateQueries(["linkRequests"])
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to send a link request")
    }
  })

  const { mutate: acceptRequest } = useMutation({
    mutationFn: (requestId) => axiosInstance.put(`/links/accept/${ requestId }`),
    onSuccess: () => {
      toast.success("Link request accepted")
      refetchLinkStatus()
      queryClient.invalidateQueries(["linkRequests"])
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to accept a link request")
    }
  })

  const { mutate: rejectRequest } = useMutation({
    mutationFn: (requestId) => axiosInstance.put(`/links/reject/${ requestId }`),
    onSuccess: () => {
      toast.success("Link request rejected")
      refetchLinkStatus()
      queryClient.invalidateQueries(["linkRequests"])
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to reject a link request")
    }
  })

  const { mutate: removeLink } = useMutation({
    mutationFn: (userId) => axiosInstance.delete(`/links/${ userId }`),
    onSuccess: () => {
      toast.success("Link removed successfully")
      refetchLinkStatus()
      queryClient.invalidateQueries(["linkRequests"])
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to remove link")
    }
  })


  // Compute link status correctly
  let computedLinkStatus = "not_linked";
  if (isLinked) {
    computedLinkStatus = "linked";
  } else if (linkStatus?.data?.status) {
    computedLinkStatus = linkStatus.data.status;
  }

  const renderLinkButton = () => {
    const baseClass = "text-white py-2 px-4 rounded-full transition duration-300 flex items-center justify-center cursor-pointer";
    switch(computedLinkStatus){
      case "linked":
        return (
          <button
            className={`${baseClass} bg-green-500 hover:bg-red-600`}
            title="Unlink"
            onClick={() => removeLink(userData._id)}
          >
            <UserCheck size={20} className='mr-2' />
            Linked
          </button>
        )
      case "pending":
        return(
          <button className={`${baseClass} bg-yellow-500 hover:bg-yellow-600`} disabled>
            <Clock size={20} className='mr-2' />
            Pending
          </button>
        )
      case "received":
        return (
          <div className="flex gap-2 justify-center">
            <button 
              className={`${baseClass} bg-green-500 hover:bg-green-600`}
              onClick={() => acceptRequest(linkStatus.data.requestId)}
            >
              Accept
            </button>
            <button className={`${baseClass} bg-red-500 hover:bg-red-600`} onClick={() => rejectRequest(linkStatus.data.requestId)}>
              Reject
            </button>
          </div>
        )
      default:
        return (
          <button 
            className={`${baseClass} bg-primary hover:bg-red-700`}
            onClick={() => sendLinkRequest(userData._id)}
          >
            <UserPlus size={20} className='mr-2' />
            Send Link Request
          </button>
        )
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setEditedData((prev) => ({ ...prev, [e.target.name]: reader.result }));
        };
        reader.readAsDataURL(file);
      }
  }

  const handleSave = () => {
    onSave(editedData, () => {
      setIsEditing(false);
    });
  };

  const handleMessage = () => {
    navigate(`/messages?user=${userData._id}`);
  };

  // Ban user handler
  const handleBanUser = async (userId) => {
    try {
      await axiosInstance.put(`/admin/users/${userId}/ban`, { reason: banReason });
      toast.success("User banned successfully");
      setShowBanModal(false);
      setBanReason("");
      // Refetch user data to update badge/UI
      queryClient.invalidateQueries(["profile", userId]);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to ban user");
    }
  };

  // Unban user handler
  const handleUnbanUser = async (userId) => {
    try {
      await axiosInstance.put(`/admin/users/${userId}/unban`);
      toast.success("User unbanned successfully");
      setShowUnbanModal(false);
      // Refetch user data to update badge/UI
      queryClient.invalidateQueries(["profile", userId]);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to unban user");
    }
  };

  return (
    <div className='bg-white shadow rounded-lg mb-6'>
      <div
        className='relative h-48 rounded-t-lg bg-cover bg-center'
        style={{
          backgroundImage: `url('${editedData.bannerImg || userData.bannerImg || "/banner.png"}')`,
        }}
      >
        {isEditing && (
          <label className='absolute top-2 right-2 bg-white p-2 rounded-full shadow cursor-pointer'>
            <Camera size={20} />
            <input
              type='file'
              className='hidden'
              name='bannerImg'
              onChange={handleImageChange}
              accept='image/*'
            />
          </label>
        )}
      </div>

      <div className='p-4'>
        <div className='relative -mt-20 mb-4'>
          <img
            className='w-32 h-32 rounded-full mx-auto object-cover'
            src={editedData.profilePicture || userData.profilePicture || "/avatar.png"}
            alt={userData.name}
          />

          {isEditing && (
            <label className='absolute bottom-0 right-1/2 transform translate-x-16 bg-white p-2 rounded-full shadow cursor-pointer'>
              <Camera size={20} />
              <input
                type='file'
                className='hidden'
                name='profilePicture'
                onChange={handleImageChange}
                accept='image/*'
              />
            </label>
          )}
        </div>

        <div className='text-center mb-4'>
          {isEditing ? (
            <input
              type='text'
              value={editedData.name ?? userData.name}
              onChange={(e) => setEditedData({ ...editedData, name: e.target.value })}
              className='text-2xl font-bold mb-2 text-center w-full'
            />
          ) : (
            <h1 className='text-2xl font-bold mb-2'>{userData.name}</h1>
          )}

          {isEditing ? (
            <input
              type='text'
              value={editedData.headline ?? userData.headline}
              onChange={(e) => setEditedData({ ...editedData, headline: e.target.value })}
              className='text-gray-600 text-center w-full'
            />
          ) : (
            <p className='text-gray-600'>{userData.headline}</p>
          )}

          <div className='flex justify-center items-center mt-2'>
            <MapPin size={16} className='text-gray-500 mr-1' />
            {isEditing ? (
              <input
                type='text'
                value={editedData.location ?? userData.location}
                onChange={(e) => setEditedData({ ...editedData, location: e.target.value })}
                className='text-gray-600 text-center'
              />
            ) : (
              <span className='text-gray-600'>{userData.location}</span>
            )}
          </div>
        </div>

        {/* Inline link and message buttons */}
        {!isOwnProfile && (
          <div className='flex justify-center items-center gap-2'>
            {renderLinkButton()}
            {canMessageData?.canMessage && (
              <button
                onClick={handleMessage}
                className='bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full transition duration-300 flex items-center justify-center'
                title="Message"
              >
                <MessageCircle size={20} />
              </button>
            )}
          </div>
        )}

        {isOwnProfile && (
          isEditing ? (
            <button
              className='w-full bg-primary text-white py-2 px-4 rounded-full hover:bg-red-700 transition duration-300 flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed'
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? <Loader className="animate-spin mr-2" size={20} /> : null}
              {isSaving ? "Saving..." : "Save Profile"}
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className='w-full bg-primary text-white py-2 px-4 rounded-full hover:bg-red-700 transition duration-300'
            >
              Edit Profile
            </button>
          )
        )}
      </div>

      {/* Tabs at the very bottom of header with more options and banned badge */}
      {tabs && setActiveTab && (
        <div className="flex border-b border-gray-200 px-0 bg-white rounded-b-lg shadow-sm items-center justify-between">
          <div className="flex">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 font-semibold text-base transition-colors duration-150 focus:outline-none ${
                  activeTab === tab.id
                    ? 'border-b-4 border-primary text-primary bg-gray-50'
                    : 'text-gray-500 hover:text-primary hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
            {isOwnProfile && (
              <button
                key="settings"
                onClick={() => setActiveTab("settings")}
                className={`px-6 py-3 font-semibold text-base transition-colors duration-150 focus:outline-none ${
                  activeTab === "settings"
                    ? 'border-b-4 border-primary text-primary bg-gray-50'
                    : 'text-gray-500 hover:text-primary hover:bg-gray-100'
                }`}
              >
                Settings
              </button>
            )}
          </div>
          {/* BANNED badge and More options icon/menu */}
          {!isOwnProfile && (
            <div className="flex items-center mr-2 relative">
              {isBanned && (
                <span className="mr-1 inline-block text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">BANNED</span>
              )}
              <button
                className="p-2 hover:bg-gray-100 rounded-full transition"
                onClick={() => setShowMoreMenu(v => !v)}
                title="More options"
              >
                <MoreVertical size={22} className="text-gray-600" />
              </button>
              {showMoreMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-md z-20">
                  {isAdmin ? (
                    isBanned ? (
                      <button
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 text-red-600 flex items-center gap-2"
                        onClick={() => {
                          setShowMoreMenu(false);
                          setShowUnbanModal(true);
                        }}
                      >
                        <CheckCircle size={16} className='text-red-600' />
                        Unban user
                      </button>
                    ) : (
                      <button
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 text-red-600 flex items-center gap-2"
                        onClick={() => {
                          setShowMoreMenu(false);
                          setShowBanModal(true);
                        }}
                      >
                        <XCircle size={16} className='text-red-600' />
                        Ban user
                      </button>
                    )
                  ) : (
                    <button
                      className="w-full text-left px-3 py-2 hover:bg-gray-50"
                      onClick={() => {
                        setShowMoreMenu(false);
                        setShowReportModal(true);
                      }}
                    >
                      Report user
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Settings tab content is now rendered in ProfilePage for consistent layout */}
      {/* Report Modal for reporting the user from profile header */}
      {showReportModal && !isOwnProfile && !isAdmin && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          defaultType={'other'}
          targetId={userData?.username}
        />
      )}
      {/* Ban Modal for admin - matches provided image */}
      {showBanModal && isAdmin && !isOwnProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              onClick={() => setShowBanModal(false)}
              aria-label="Close"
            >
              <X size={22} />
            </button>
            <h2 className="text-xl font-bold mb-2">Ban User</h2>
            <p className="mb-4 text-gray-700">Are you sure you want to ban this user? Banned users cannot log in, message, or be seen by regular users.</p>
            <textarea
              className="w-full border border-gray-300 rounded-lg p-2 mb-4 resize-none"
              rows={3}
              placeholder="Optional reason (why you're banning)"
              value={banReason}
              onChange={e => setBanReason(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                onClick={() => setShowBanModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 font-semibold"
                onClick={() => handleBanUser(userData._id)}
              >
                Yes, Ban
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ...existing code...

export default ProfileHeader