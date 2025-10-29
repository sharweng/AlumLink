import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { axiosInstance } from "../../lib/axios"
import { Bell, LogOut, Search, Briefcase, MessageSquare, Calendar, Shield, Award, Home } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { useState, useRef, useEffect } from "react"
import SearchResults from "../SearchResults"
import toast from "react-hot-toast"
import { X } from "lucide-react"

const Navbar = () => {
  // Universal modal state
  const [showUniversalModal, setShowUniversalModal] = useState(false);
  const modalTimerRef = useRef(null);

  // Show modal every 1 minute
  useEffect(() => {
    // Function to show modal
    const showModal = () => setShowUniversalModal(true);
    // Initial timer
    modalTimerRef.current = setTimeout(showModal, 180000);
    return () => {
      if (modalTimerRef.current) clearTimeout(modalTimerRef.current);
    };
  }, []);

  // When modal is closed, set timer to reopen after 1 minute
  useEffect(() => {
    if (!showUniversalModal) {
      if (modalTimerRef.current) clearTimeout(modalTimerRef.current);
      modalTimerRef.current = setTimeout(() => setShowUniversalModal(true), 180000);
    }
    // Clean up on unmount
    return () => {
      if (modalTimerRef.current) clearTimeout(modalTimerRef.current);
    };
  }, [showUniversalModal]);
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const authUser = queryClient.getQueryData(["authUser"])

  // Helper: is admin or super admin (use permission field)
  const isAdmin = authUser?.permission === "admin" || authUser?.permission === "superAdmin"
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("")
  const [showResults, setShowResults] = useState(false)
  const [searchResults, setSearchResults] = useState({ users: [], posts: [], jobPosts: [] })
  const [isSearching, setIsSearching] = useState(false)
  const searchRef = useRef(null)
  const searchTimeoutRef = useRef(null)
  const [showWidthWarning, setShowWidthWarning] = useState(false);

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

  // Check event reminders periodically when user is logged in
  useQuery({
    queryKey: ["eventReminders"],
    queryFn: async () => axiosInstance.get("/events/check-reminders"),
    enabled: !!authUser,
    refetchInterval: 180000, // Check every 60 seconds (1 minute)
    refetchOnWindowFocus: true, // Also check when user returns to tab
    refetchOnMount: true, // Check when component mounts
  })

  // Check if user is deactivated periodically
  useQuery({
    queryKey: ["userActiveStatus"],
    queryFn: async () => {
      const res = await axiosInstance.get("/auth/me");
      if (!res.data.isActive) {
        queryClient.setQueryData(["authUser"], null);
        toast.error("Your account has been deactivated");
        navigate("/login");
      }
      return res.data;
    },
    enabled: !!authUser,
    refetchInterval: 5000, // Check every 5 seconds
    refetchOnWindowFocus: true,
  })

  const { data: unreadMessagesData } = useQuery({
    queryKey: ["unreadMessages"],
    queryFn: async () => axiosInstance.get("/messages/unread-count"),
    enabled: !!authUser,
    refetchInterval: 10000, // Refetch every 10 seconds
  })

  const { mutate: logout } = useMutation({
    mutationFn: () => axiosInstance.post("/auth/logout"),
    onSuccess: () => {
      queryClient.setQueryData(["authUser"], null)
      queryClient.invalidateQueries({ queryKey: ["authUser"] })
      navigate("/login")
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

  useEffect(() => {
    const checkWidth = () => {
      if (window.innerWidth < 1024) {
        setShowWidthWarning(true);
      } else {
        setShowWidthWarning(false);
      }
    };
    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  const unreadNotificationCount = Array.isArray(notifications?.data) ? notifications.data.filter(notif => !notif.read).length : 0
  const unreadLinkRequestsCount = Array.isArray(linkRequests?.data) ? linkRequests.data.length : 0
  const unreadMessagesCount = unreadMessagesData?.data?.unreadCount || 0

  return (
    <>
      {/* Universal Modal: Experience Feedback */}
      {showUniversalModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black bg-opacity-60">
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border-2 border-primary flex flex-col items-center animate-fade-in">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
              onClick={() => setShowUniversalModal(false)}
              aria-label="Close"
            >
              <X size={24} />
            </button>
            <img src="/alumniLink.png" alt="AlumniLink Logo" className="w-16 h-16 mb-4 rounded-full border-2 border-primary shadow" />
            <h2 className="text-xl font-bold text-primary mb-2">Are you enjoying your experience?</h2>
            <p className="text-gray-700 mb-4 text-center">We'd love to hear your feedback! Please let us know how we're doing.</p>
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSfW8h-cOjpV2f7Bej3E2EHdx3YCg5VgOMeZU7ZtQpX4M6emLA/viewform?usp=header"
              target="_blank"
              rel="noopener noreferrer"
              className="mb-2 px-4 py-2 bg-primary text-white rounded-lg font-semibold shadow hover:bg-primary-dark transition"
            >
              Go to Google Forms
            </a>
            <div className="mt-2 text-sm text-gray-500 text-center">
              Experienced some bugs? <br />Write a feedback under the left sidebar.
            </div>
          </div>
        </div>
      )}
      {showWidthWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-60">
          <div className="text-center bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border-2 border-red-400 flex flex-col items-center animate-fade-in">
            <img src="/alumniLink.png" alt="AlumniLink Logo" className="w-20 h-20 mb-4 rounded-full border-2 border-red-300 shadow" />
            <h2 className="text-2xl font-extrabold text-red-600 mb-2 tracking-tight">Mobile Responsive Design Coming Soon</h2>
            <p className="text-gray-700 mb-2 text-lg">AlumniLink is best viewed at widths above <span className="font-bold text-red-500">1024px</span>.</p>
            <p className="text-gray-500 mb-4">If you're on mobile, please use desktop for now.</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              <span className="text-xs text-red-500 font-semibold">Thank you for your patience!</span>
            </div>
          </div>
        </div>
      )}
			<nav className='bg-secondary shadow-md sticky top-0 z-[30]'>
				<div className='max-w-7xl mx-auto px-4'>
					<div className='flex justify-between items-center py-1'>
						<div className='flex items-center space-x-4'>
              {/* Logo: for admin, link to dashboard; for others, link to home */}
              <Link to={isAdmin ? "/admin/dashboard" : "/"}>
                <img className='h-12 rounded' src='/alumniLink.png' alt='AlumniLink' />
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
														onKeyDown={e => {
															if (e.key === 'Enter' && searchQuery.trim()) {
																navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
																setShowResults(false);
															}
														}}
													/>
								</div>
												{showResults && (
													<div className="absolute left-0 right-0 z-[40]">
														<SearchResults
															results={searchResults}
															isLoading={isSearching}
															query={searchQuery}
															onClose={closeSearch}
														/>
													</div>
												)}
							</div>
						)}
						
						<div className='flex items-center gap-2 md:gap-6'>
              {authUser ? (
                <>
                  {/* Home always goes to homepage */}
                  <Link to='/' className='text-neutral flex flex-col items-center'>
                    <Home size={20} />
                    <span className='text-xs hidden md:block'>Home</span>
                  </Link>
                  {/* Admin Dashboard icon for admins */}
                  {isAdmin && (
                    <Link to='/admin/dashboard' className='text-neutral flex flex-col items-center'>
                      <Shield size={20} />
                      <span className='text-xs hidden md:block'>DBoard</span>
                    </Link>
                  )}
                  <Link to='/jobs' className='text-neutral flex flex-col items-center'>
                    <Briefcase size={20} />
                    <span className='text-xs hidden md:block'>Jobs</span>
                  </Link>
                  <Link to='/forums' className='text-neutral flex flex-col items-center'>
                    <MessageSquare size={20} />
                    <span className='text-xs hidden md:block'>Forums</span>
                  </Link>
                  <Link to='/events' className='text-neutral flex flex-col items-center'>
                    <Calendar size={20} />
                    <span className='text-xs hidden md:block'>Events</span>
                  </Link>
                  <Link to='/mentorship' className='text-neutral flex flex-col items-center'>
                    <Award size={20} />
                    <span className='text-xs hidden md:block'>Mentor</span>
                  </Link>
                  <Link to='/notifications' className='text-neutral flex flex-col items-center relative'>
                    <Bell size={20} />
                    <span className='text-xs hidden md:block'>Notifs</span>
                    {unreadNotificationCount > 0 && (
                      <span
                        className="absolute -top-1 md:right-4 bg-red-500 text-white rounded-full flex items-center justify-center font-bold transition-all"
                        style={{
                          minWidth: '1.1rem',
                          height: '1.1rem',
                          fontSize: '0.65rem',
                          padding: 0,
                          lineHeight: '1.1rem',
                        }}
                      >
                        {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                      </span>
                    )}
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
		</>
  )
}

export default Navbar