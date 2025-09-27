import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { Camera, Clock, MapPin, UserCheck, UserPlus, X, Loader } from "lucide-react";

const ProfileHeader = ({ userData, isOwnProfile, onSave, isSaving }) => {
  const [ isEditing, setIsEditing ] = useState(false);
  const [ editedData, setEditedData ] = useState({})
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData(["authUser"])

  const { data: linkStatus, refetch:refetchLinkStatus } = useQuery({
    queryKey: ["linkStatus", userData._id],
    queryFn: () => axiosInstance.get(`/links/status/${ userData._id }`),
    enabled: !isOwnProfile
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
    const baseClass = "text-white py-2 px-4 rounded-full transition duration-300 flex items-center justify-center";
    switch(computedLinkStatus){
      case "linked":
        return (
          <div className="flex gap-2 justify-center">
            <div className={`${baseClass} bg-green-500 hover:bg-green-600`}>
              <UserCheck size={20} className='mr-2' />
              Linked
            </div>
            <button className={`${baseClass} bg-red-500 hover:bg-red-600 text-sm`} onClick={() => removeLink(userData._id)}> 
              <X size={20} className='mr-2' />
              Remove Link
            </button>
          </div>
        )
      case "pending":
        return(
          <button className={`${baseClass} bg-yellow-500 hover:bg-yellow-600`}>
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

				{isOwnProfile ? (
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
							className='w-full bg-primary text-white py-2 px-4 rounded-full hover:bg-red-700
							 transition duration-300'
						>
							Edit Profile
						</button>
					)
				) : (
					<div className='flex justify-center'>{renderLinkButton()}</div>
				)}
			</div>
		</div>
  )
}

export default ProfileHeader