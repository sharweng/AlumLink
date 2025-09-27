import { Link } from "react-router-dom"

const UserCard = ({ user, isLink }) => {
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
			<button className='mt-4 bg-primary text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors w-full'>
				{isLink ? "Linked" : "Link"}
			</button>
		</div>
  )
}

export default UserCard