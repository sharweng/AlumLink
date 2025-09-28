import { Link } from "react-router-dom"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { axiosInstance } from "../lib/axios"
import toast from "react-hot-toast"



const UserCard = ({ user, isLink }) => {
	const queryClient = useQueryClient();
	const { mutate: unlinkUser, isPending: isUnlinking } = useMutation({
		mutationFn: async () => {
			await axiosInstance.delete(`/links/${user._id}`)
		},
			onSuccess: () => {
				toast.success("Unlinked successfully");
				queryClient.invalidateQueries({ queryKey: ["links"] });
			},
		onError: (error) => {
			toast.error(error?.response?.data?.message || "Failed to unlink");
		}
	});

	return (
		<div className='bg-white rounded-lg shadow p-4 flex flex-col items-center transition-all hover:shadow-md'>
			<Link to={`/profile/${user.username}`} className='flex flex-col items-center'>
				<img
					src={user.profilePicture || "/avatar.png"}
					alt={user.name}
					className='w-24 h-24 rounded-full object-cover mb-4'
				/>
				<h3 className='font-semibold text-lg text-center'>{user.name}</h3>
			</Link>
			<p className='text-gray-600 text-center'>{user.headline}</p>
			<p className='text-sm text-gray-500 mt-2'>{user.links?.length} links</p>
			{isLink && (
				<button
					className='mt-4 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors w-full disabled:opacity-60'
					onClick={() => {
						if(window.confirm("Are you sure you want to unlink this user?")) unlinkUser();
					}}
					disabled={isUnlinking}
				>
					{isUnlinking ? "Unlinking..." : "Unlink"}
				</button>
			)}
			{!isLink && (
				<button className='mt-4 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors w-full' disabled>
					Link
				</button>
			)}
		</div>
	)
}

export default UserCard