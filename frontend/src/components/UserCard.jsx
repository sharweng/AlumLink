import { Link } from "react-router-dom"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { axiosInstance } from "../lib/axios"
import toast from "react-hot-toast"
import { useState } from "react"
import UnlinkModal from "./network/UnlinkModal"



const UserCard = ({ user, isLink }) => {
	const queryClient = useQueryClient();
	const [showUnlinkModal, setShowUnlinkModal] = useState(false);
	const { mutate: unlinkUser, isPending: isUnlinking } = useMutation({
		mutationFn: async () => {
			await axiosInstance.delete(`/links/${user._id}`)
		},
		onSuccess: () => {
			toast.success("Unlinked successfully");
			queryClient.invalidateQueries({ queryKey: ["links"] });
			setShowUnlinkModal(false);
		},
		onError: (error) => {
			toast.error(error?.response?.data?.message || "Failed to unlink");
			setShowUnlinkModal(false);
		}
	});

	const handleCardClick = (e) => {
		// Prevent navigation if clicking the unlink button or modal
		if (e.target.closest('button') || e.target.closest('.unlink-modal')) return;
		window.location.href = `/profile/${user.username}`;
	};

	return (
		<div
			className='bg-white rounded-lg shadow p-2 flex flex-col items-center transition-all hover:shadow-md w-full max-w-[220px] cursor-pointer'
			onClick={handleCardClick}
		>
			<img
				src={user.profilePicture || "/avatar.png"}
				alt={user.name}
				className='w-16 h-16 rounded-full object-cover mb-2'
			/>
			<h3
				className='font-semibold text-base text-center truncate max-w-[180px] cursor-pointer'
				title={user.name}
			>
				{user.name}
			</h3>
			<p
				className='text-gray-600 text-center truncate max-w-[180px]'
				title={user.headline}
			>
				{user.headline}
			</p>
			<p className='text-sm text-gray-500 mt-2'>{user.links?.length} links</p>
			{isLink && (
				<>
					<button
						className='mt-4 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors w-full disabled:opacity-60'
						onClick={e => { e.stopPropagation(); setShowUnlinkModal(true); }}
						disabled={isUnlinking}
					>
						{isUnlinking ? "Unlinking..." : "Unlink"}
					</button>
					<div className="unlink-modal">
						<UnlinkModal
							isOpen={showUnlinkModal}
							onClose={() => setShowUnlinkModal(false)}
							onConfirm={() => unlinkUser()}
							isLoading={isUnlinking}
						/>
					</div>
				</>
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