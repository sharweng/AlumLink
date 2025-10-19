import { Navigate, Route, Routes } from "react-router-dom"
import Layout from "./components/layout/Layout"

import HomePage from "./pages/HomePage"
import SignUpPage from "./pages/auth/SignUpPage"
import LoginPage from "./pages/auth/LoginPage"
import toast, { Toaster } from "react-hot-toast"
import { useQuery } from "@tanstack/react-query"
import { axiosInstance } from "./lib/axios"
import NotificationsPage from "./pages/NotificationsPage"
import NetworkPage from "./pages/NetworkPage"
import PostPage from "./pages/PostPage"
import ProfilePage from "./pages/ProfilePage"
import JobBoardPage from "./pages/JobBoardPage"
import JobPostPage from "./pages/JobPostPage"
import DiscussionForumsPage from "./pages/DiscussionForumsPage"
import DiscussionPage from "./pages/DiscussionPage"
import EventsPage from "./pages/EventsPage"
import MyEventsPage from "./pages/MyEventsPage"
import EventDetailPage from "./pages/EventDetailPage"
import EventEditPage from "./pages/EventEditPage"
import AdminDashboard from "./pages/AdminDashboard"
import MentorshipPortalPage from "./pages/MentorshipPortalPage"
import MessagesPage from "./pages/MessagesPage"
import AchievementsPage from "./pages/AchievementsPage"
import { SocketProvider } from "./contexts/SocketContext"
import CallManager from "./components/common/CallManager"

function App() {
  const { data: authUser, isLoading } = useQuery({
    queryKey: ['authUser'],
    queryFn: async() => {
      try {
        const res = await axiosInstance.get("/auth/me")
        return res.data
      } catch (error) {
        if(error.response && error.response.status === 401){
          return null
        }
        toast.error(error.response.data.message || "Something went wrong")
      }
    },
  })

  if (isLoading) return null

  return (
    <SocketProvider>
      <CallManager />
      <Layout>
        <Routes>
          <Route path="/" element={ 
            authUser ? (
              authUser.role === 'admin' ? <Navigate to="/admin/dashboard" /> : <HomePage />
            ) : <Navigate to={"/login"} /> 
          } />
        <Route path="/signup" element={ !authUser ? <SignUpPage /> : <Navigate to={"/"} /> } />
        <Route path="/login" element={ !authUser ? <LoginPage /> : <Navigate to={"/"} /> } />
        <Route path="/admin/dashboard" element={ 
          authUser?.role === 'admin' ? <AdminDashboard /> : <Navigate to={"/"} /> 
        } />
        <Route path="/jobs" element={ authUser ? <JobBoardPage /> : <Navigate to={"/login"} /> } />
        <Route path="/job/:jobId" element={ authUser ? <JobPostPage /> : <Navigate to={"/login"} /> } />
        <Route path="/forums" element={ authUser ? <DiscussionForumsPage /> : <Navigate to={"/login"} /> } />
        <Route path="/discussion/:discussionId" element={ authUser ? <DiscussionPage /> : <Navigate to={"/login"} /> } />
        <Route path="/events" element={ authUser ? <EventsPage /> : <Navigate to={"/login"} /> } />
        <Route path="/my-events" element={ authUser ? <MyEventsPage /> : <Navigate to={"/login"} /> } />
        <Route path="/event/:id" element={ authUser ? <EventDetailPage /> : <Navigate to={"/login"} /> } />
        <Route path="/event/:id/edit" element={ authUser ? <EventEditPage /> : <Navigate to={"/login"} /> } />
        <Route path="/notifications" element={ authUser ? <NotificationsPage /> : <Navigate to={"/login"} /> } />
        <Route path="/network" element={ authUser ? <NetworkPage /> : <Navigate to={"/login"} /> } />
        <Route path="/mentorship" element={ authUser ? <MentorshipPortalPage /> : <Navigate to={"/login"} /> } />
        <Route path="/messages" element={ authUser ? <MessagesPage /> : <Navigate to={"/login"} /> } />
        <Route path="/achievements" element={ authUser ? <AchievementsPage /> : <Navigate to={"/login"} /> } />
        <Route path="/post/:postId" element={ authUser ? <PostPage /> : <Navigate to={"/login"} /> } />
        <Route path="/profile/:username" element={ authUser ? <ProfilePage /> : <Navigate to={"/login"} /> } />
      </Routes>
      <Toaster />
    </Layout>
    </SocketProvider>
  )
}

export default App
