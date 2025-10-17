import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { Users, Calendar, Award, Search, BookOpen, Clock } from "lucide-react";
import MentorCard from "../components/mentorship/MentorCard";
import MentorshipCard from "../components/mentorship/MentorshipCard";
import SessionCard from "../components/mentorship/SessionCard";
import Sidebar from "../components/Sidebar";

const MentorshipPortalPage = () => {
    const [activeTab, setActiveTab] = useState("browse"); // browse, myMentorships, sessions
    const [searchQuery, setSearchQuery] = useState("");
    const [filterExpertise, setFilterExpertise] = useState("");

    const queryClient = useQueryClient();
    const authUser = queryClient.getQueryData(["authUser"]);

    // Fetch all mentors
    const { data: mentors, isLoading: loadingMentors } = useQuery({
        queryKey: ["mentors", filterExpertise],
        queryFn: async () => {
            const res = await axiosInstance.get("/mentorships/mentors", {
                params: { expertise: filterExpertise || undefined },
            });
            return res.data;
        },
    });

    // Fetch user's mentorships
    const { data: myMentorships, isLoading: loadingMentorships } = useQuery({
        queryKey: ["myMentorships"],
        queryFn: async () => {
            const res = await axiosInstance.get("/mentorships/my-mentorships");
            return res.data;
        },
    });

    // Fetch user's sessions
    const { data: sessions, isLoading: loadingSessions } = useQuery({
        queryKey: ["mentorshipSessions"],
        queryFn: async () => {
            const res = await axiosInstance.get("/mentorships/sessions");
            return res.data;
        },
    });

    const filteredMentors = mentors?.filter((mentor) => {
        // Don't show the current user in the browse list
        if (mentor._id === authUser._id) return false;
        
        // Filter by expertise if selected
        if (filterExpertise && !mentor.mentorExpertise?.includes(filterExpertise)) {
            return false;
        }
        
        // Filter by search query
        if (searchQuery) {
            const searchLower = searchQuery.toLowerCase();
            return (
                mentor.name.toLowerCase().includes(searchLower) ||
                mentor.mentorBio.toLowerCase().includes(searchLower) ||
                mentor.mentorExpertise.some((exp) => exp.toLowerCase().includes(searchLower))
            );
        }
        
        return true;
    });

    const upcomingSessions = sessions?.filter(
        (session) => session.status === "scheduled" && new Date(session.scheduledDate) > new Date()
    );
    
    const pendingSessions = sessions?.filter((session) => session.status === "pending");
    
    const pastSessions = sessions?.filter(
        (session) => session.status === "completed" || (session.status === "scheduled" && new Date(session.scheduledDate) <= new Date())
    );

    const activeMentorships = myMentorships?.filter((m) => m.status === "accepted");
    const pendingMentorships = myMentorships?.filter((m) => m.status === "pending");

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto px-4 py-8">
            {/* Sidebar */}
            <div className="lg:col-span-3">
                <Sidebar user={authUser} />
            </div>

            {/* Main Content */}
            <div className="lg:col-span-9">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                            <BookOpen className="text-primary" />
                            Mentorship & Coaching Portal
                        </h1>
                        <p className="text-gray-600 mt-2">
                            Connect with experienced alumni mentors to guide your career journey
                        </p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-blue-600 mb-2">
                            <Users size={20} />
                            <span className="font-semibold">Mentors</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{mentors?.length || 0}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-green-600 mb-2">
                            <Award size={20} />
                            <span className="font-semibold">Active</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{activeMentorships?.length || 0}</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-purple-600 mb-2">
                            <Calendar size={20} />
                            <span className="font-semibold">Upcoming</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{upcomingSessions?.length || 0}</p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-yellow-600 mb-2">
                            <Clock size={20} />
                            <span className="font-semibold">Pending Sessions</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{pendingSessions?.length || 0}</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-md mb-6">
                <div className="flex border-b">
                    <button
                        onClick={() => setActiveTab("browse")}
                        className={`flex-1 px-6 py-4 font-semibold transition ${
                            activeTab === "browse"
                                ? "text-primary border-b-2 border-primary"
                                : "text-gray-600 hover:text-gray-900"
                        }`}
                    >
                        Browse Mentors
                    </button>
                    <button
                        onClick={() => setActiveTab("myMentorships")}
                        className={`flex-1 px-6 py-4 font-semibold transition ${
                            activeTab === "myMentorships"
                                ? "text-primary border-b-2 border-primary"
                                : "text-gray-600 hover:text-gray-900"
                        }`}
                    >
                        My Mentorships
                    </button>
                    <button
                        onClick={() => setActiveTab("sessions")}
                        className={`flex-1 px-6 py-4 font-semibold transition ${
                            activeTab === "sessions"
                                ? "text-primary border-b-2 border-primary"
                                : "text-gray-600 hover:text-gray-900"
                        }`}
                    >
                        Sessions
                    </button>
                </div>
            </div>

            {/* Browse Mentors Tab */}
            {activeTab === "browse" && (
                <div>
                    {/* Search and Filters */}
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search mentors by name or expertise..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                            <select
                                value={filterExpertise}
                                onChange={(e) => setFilterExpertise(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="">All Expertise</option>
                                <option value="Software Engineering">Software Engineering</option>
                                <option value="Product Management">Product Management</option>
                                <option value="Data Science">Data Science</option>
                                <option value="Design">Design</option>
                                <option value="Marketing">Marketing</option>
                                <option value="Business">Business</option>
                                <option value="Finance">Finance</option>
                                <option value="Entrepreneurship">Entrepreneurship</option>
                            </select>
                        </div>
                    </div>

                    {/* Mentors Grid */}
                    {loadingMentors ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : filteredMentors?.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-md p-12 text-center">
                            <Users size={64} className="mx-auto text-gray-400 mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No mentors found</h3>
                            <p className="text-gray-600">Try adjusting your search or filters</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {filteredMentors?.map((mentor) => (
                                <MentorCard 
                                    key={mentor._id} 
                                    mentor={mentor} 
                                    existingMentorships={myMentorships || []}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* My Mentorships Tab */}
            {activeTab === "myMentorships" && (
                <div>
                    {loadingMentorships ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : myMentorships?.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-md p-12 text-center">
                            <Award size={64} className="mx-auto text-gray-400 mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No mentorships yet</h3>
                            <p className="text-gray-600 mb-6">Start by requesting a mentor from the Browse tab</p>
                            <button
                                onClick={() => setActiveTab("browse")}
                                className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition"
                            >
                                Browse Mentors
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {pendingMentorships?.length > 0 && (
                                <div>
                                    <h2 className="text-xl font-semibold mb-4">Pending Requests</h2>
                                    <div className="grid grid-cols-1 gap-4">
                                        {pendingMentorships.map((mentorship) => (
                                            <MentorshipCard key={mentorship._id} mentorship={mentorship} authUser={authUser} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeMentorships?.length > 0 && (
                                <div>
                                    <h2 className="text-xl font-semibold mb-4">Active Mentorships</h2>
                                    <div className="grid grid-cols-1 gap-4">
                                        {activeMentorships.map((mentorship) => (
                                            <MentorshipCard key={mentorship._id} mentorship={mentorship} authUser={authUser} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Sessions Tab */}
            {activeTab === "sessions" && (
                <div>
                    {loadingSessions ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : sessions?.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-md p-12 text-center">
                            <Calendar size={64} className="mx-auto text-gray-400 mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No sessions scheduled</h3>
                            <p className="text-gray-600">Sessions will appear here once they're scheduled</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {pendingSessions?.length > 0 && (
                                <div>
                                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                        <Clock className="text-yellow-600" />
                                        Pending Sessions (Awaiting Confirmation)
                                    </h2>
                                    <div className="grid grid-cols-1 gap-4">
                                        {pendingSessions.map((session) => (
                                            <SessionCard 
                                                key={session._id} 
                                                session={session} 
                                                mentorship={session.mentorship}
                                                authUser={authUser} 
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {upcomingSessions?.length > 0 && (
                                <div>
                                    <h2 className="text-xl font-semibold mb-4">Upcoming Sessions</h2>
                                    <div className="grid grid-cols-1 gap-4">
                                        {upcomingSessions.map((session) => (
                                            <SessionCard 
                                                key={session._id} 
                                                session={session} 
                                                mentorship={session.mentorship}
                                                authUser={authUser} 
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <h2 className="text-xl font-semibold mb-4">Past Sessions</h2>
                                <div className="grid grid-cols-1 gap-4">
                                    {pastSessions && pastSessions.length > 0 ? (
                                        pastSessions.map((session) => (
                                            <SessionCard 
                                                key={session._id} 
                                                session={session} 
                                                mentorship={session.mentorship}
                                                authUser={authUser} 
                                            />
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            <p>No past sessions yet</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
            </div>
        </div>
    );
};

export default MentorshipPortalPage;
