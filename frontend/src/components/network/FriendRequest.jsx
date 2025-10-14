import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../../lib/axios";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";


const FriendRequest = ({ request }) => {
	const queryClient = useQueryClient();

	const { mutate: acceptLinkRequest } = useMutation({
		mutationFn: (requestId) => axiosInstance.put(`/links/accept/${requestId}`),
		onSuccess: () => {
			toast.success("Link request accepted");
			queryClient.invalidateQueries({ queryKey: ["linkRequests"] });
			queryClient.invalidateQueries({ queryKey: ["links"] });
		},
		onError: (error) => {
			toast.error(error.response.data.error);
		},
	});

	const { mutate: rejectLinkRequest } = useMutation({
		mutationFn: (requestId) => axiosInstance.put(`/links/reject/${requestId}`),
		onSuccess: () => {
			toast.success("Link request rejected");
			queryClient.invalidateQueries({ queryKey: ["linkRequests"] });
		},
		onError: (error) => {
			toast.error(error.response.data.error);
		},
	});

	return (
		<div className='bg-white rounded-lg shadow p-4 flex items-center justify-between transition-all hover:shadow-md'>
			<div className='flex items-center gap-4'>
				<Link to={`/profile/${request.sender.username}`}>
					<img
						src={request.sender.profilePicture || "/avatar.png"}
						alt={request.name}
						className='w-16 h-16 rounded-full object-cover'
					/>
				</Link>

				<div>
					<Link to={`/profile/${request.sender.username}`} className='font-semibold text-lg'>
						{request.sender.name}
					</Link>
					<p className='text-gray-600'>{request.sender.headline}</p>
				</div>
			</div>

			<div className='space-x-2'>
				<button
					className=' text-white px-4 py-2 rounded-md bg-green-500 hover:bg-green-600 transition-colors'
					onClick={() => acceptLinkRequest(request._id)}
				>
					Accept
				</button>
				<button
					className=' text-white px-4 py-2 rounded-md bg-red-500 hover:bg-red-600 transition-colors'
					onClick={() => rejectLinkRequest(request._id)}
				>
					Reject
				</button>
			</div>
		</div>
	);
};
export default FriendRequest;