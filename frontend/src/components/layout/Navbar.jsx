import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { axiosInstance } from "../../lib/axios"
import { Home, User, Users, Bell, LogOut, Search, Briefcase } from "lucide-react"
import { Link } from "react-router-dom"
import { useState, useRef, useEffect } from "react"
import SearchResults from "../SearchResults"

const Navbar = () => {
  const queryClient = useQueryClient()
  const authUser = queryClient.getQueryData(["authUser"])
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("")
  const [showResults, setShowResults] = useState(false)
  const [searchResults, setSearchResults] = useState({ users: [], posts: [], jobPosts: [] })
  const [isSearching, setIsSearching] = useState(false)
  const searchRef = useRef(null)
  const searchTimeoutRef = useRef(null)

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => axiosInstance.get("/notifications"),
    enabled: !!authUser
  })

  const { data: linkRequests } = useQuery({
    queryKey: ["linkRequests"],
    queryFn: async () => axiosInstance.get("/links/requests"),
    enabled: !!authUser
  })

  const { mutate: logout } = useMutation({
    mutationFn: () => axiosInstance.post("/auth/logout"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authUser"] })
    }
  })

  // Search functionality
  const performSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults({ users: [], posts: [], jobPosts: [] })
      setShowResults(false)
      return
    }

    setIsSearching(true)
    try {
      const response = await axiosInstance.get(`/search?query=${encodeURIComponent(query.trim())}`)
      setSearchResults(response.data)
      setShowResults(true)
    } catch (error) {
      console.error("Search error:", error)
      setSearchResults({ users: [], posts: [], jobPosts: [] })
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearchChange = (e) => {
    const query = e.target.value
    setSearchQuery(query)

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query)
    }, 300)
  }

  const handleSearchFocus = () => {
    if (searchQuery.trim()) {
      setShowResults(true)
    }
  }

  const closeSearch = () => {
    setShowResults(false)
  }

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  const unreadNotificationCount = notifications?.data.filter(notif => !notif.read).length
  const unreadLinkRequestsCount = linkRequests?.data?.length

  return (
    <nav className='bg-secondary shadow-md sticky top-0 z-10'>
			<div className='max-w-7xl mx-auto px-4'>
				<div className='flex justify-between items-center py-3'>
					<div className='flex items-center space-x-4'>
						<Link to='/'>
							<img className='h-8 rounded' src='/alumniLink.png' alt='AlumniLink' />
						</Link>
					</div>
					
					{/* Search Bar - Only show when authenticated */}
					{authUser && (
						<div className='flex-1 max-w-md mx-4 relative' ref={searchRef}>
							<div className='relative'>
								<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' size={20} />
								<input
									type='text'
									placeholder='Search people, posts, skills, courses...'
									value={searchQuery}
									onChange={handleSearchChange}
									onFocus={handleSearchFocus}
									className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white'
								/>
							</div>
							{showResults && (
								<SearchResults
									results={searchResults}
									isLoading={isSearching}
									query={searchQuery}
									onClose={closeSearch}
								/>
							)}
						</div>
					)}
					
					<div className='flex items-center gap-2 md:gap-6'>
						{authUser ? (
							<>
								<Link to={"/"} className='text-neutral flex flex-col items-center'>
									<Home size={20} />
									<span className='text-xs hidden md:block'>Home</span>
								</Link>
								<Link to='/jobs' className='text-neutral flex flex-col items-center'>
									<Briefcase size={20} />
									<span className='text-xs hidden md:block'>Jobs</span>
								</Link>
								<Link to='/network' className='text-neutral flex flex-col items-center relative'>
									<Users size={20} />
									<span className='text-xs hidden md:block'>My Network</span>
									{unreadLinkRequestsCount > 0 && (
										<span
											className='absolute -top-1 -right-1 md:right-4 bg-red-500 text-white text-xs 
										rounded-full size-3 md:size-4 flex items-center justify-center'
										>
											{unreadLinkRequestsCount}
										</span>
									)}
								</Link>
								<Link to='/notifications' className='text-neutral flex flex-col items-center relative'>
									<Bell size={20} />
									<span className='text-xs hidden md:block'>Notifications</span>
									{unreadNotificationCount > 0 && (
										<span
											className='absolute -top-1 -right-1 md:right-4 bg-red-500 text-white text-xs 
										rounded-full size-3 md:size-4 flex items-center justify-center'
										>
											{unreadNotificationCount}
										</span>
									)}
								</Link>
								<Link
									to={`/profile/${authUser.username}`}
									className='text-neutral flex flex-col items-center'
								>
									<User size={20} />
									<span className='text-xs hidden md:block'>Me</span>
								</Link>
								<button
									className='flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800'
									onClick={() => logout()}
								>
									<LogOut size={20} />
									<span className='hidden md:inline'>Logout</span>
								</button>
							</>
						) : (
							<>
								<Link to='/login' className='btn btn-ghost'>
									Sign In
								</Link>
								<Link to='/signup' className='btn btn-primary'>
									Join now
								</Link>
							</>
						)}
					</div>
				</div>
			</div>
		</nav>
  )
}

export default Navbar