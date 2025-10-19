import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../../lib/axios";
import toast from "react-hot-toast";
import { Calendar, Clock, Video, MapPin, CheckCircle, FileText, Star, X, Edit2, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import VideoCallModal from "./VideoCallModal";
import { useSocket } from "../../contexts/SocketContext";

const SessionCard = ({ session, mentorship, authUser }) => {
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [feedback, setFeedback] = useState("");
    const [rating, setRating] = useState(5);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState("");
    const [showVideoCall, setShowVideoCall] = useState(false);
    const [currentCallId, setCurrentCallId] = useState(null);
    const [isEditingFeedback, setIsEditingFeedback] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const queryClient = useQueryClient();
    const isMentor = mentorship.mentor._id === authUser._id;
    const needsMyConfirmation = isMentor ? !session.confirmedByMentor : !session.confirmedByMentee;
    const otherPartyConfirmed = isMentor ? session.confirmedByMentee : session.confirmedByMentor;
    const otherUser = isMentor ? mentorship.mentee : mentorship.mentor;
    const { socket } = useSocket();

    // Load existing feedback when editing
    useEffect(() => {
        if (isEditingFeedback && session.feedback) {
            const existingFeedback = isMentor 
                ? session.feedback.mentorFeedback 
                : session.feedback.menteeFeedback;
            setFeedback(existingFeedback || "");
            if (!isMentor && session.feedback.rating) {
                setRating(session.feedback.rating);
            }
        }
    }, [isEditingFeedback, session.feedback, isMentor]);

    const { mutate: confirmSession, isPending: confirming } = useMutation({
        mutationFn: async () => {
            const res = await axiosInstance.put(`/mentorships/sessions/${session._id}/confirm`);
            return res.data;
        },
        onSuccess: () => {
            toast.success("Session confirmed!");
            queryClient.invalidateQueries(["sessions"]);
            queryClient.invalidateQueries(["mentorshipSessions"]);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to confirm session");
        },
    });

    const { mutate: cancelSession, isPending: cancelling } = useMutation({
        mutationFn: async () => {
            const res = await axiosInstance.put(`/mentorships/sessions/${session._id}/cancel`, {
                reason: cancelReason.trim() || undefined,
            });
            return res.data;
        },
        onSuccess: () => {
            toast.success("Session cancelled");
            setShowCancelModal(false);
            setCancelReason("");
            queryClient.invalidateQueries(["sessions"]);
            queryClient.invalidateQueries(["mentorshipSessions"]);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to cancel session");
        },
    });

    const { mutate: markComplete, isPending: completing } = useMutation({
        mutationFn: async () => {
            const res = await axiosInstance.put(`/mentorships/sessions/${session._id}`, {
                status: "completed",
            });
            return res.data;
        },
        onSuccess: () => {
            toast.success("Session marked as completed!");
            queryClient.invalidateQueries(["sessions"]);
            queryClient.invalidateQueries(["mentorshipSessions"]);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to update session");
        },
    });

    const { mutate: submitFeedback, isPending: submitting } = useMutation({
        mutationFn: async () => {
            const res = await axiosInstance.post(`/mentorships/sessions/${session._id}/feedback`, {
                feedback,
                rating: !isMentor ? rating : undefined, // Only send rating if mentee
                role: isMentor ? "mentor" : "mentee",
            });
            return res.data;
        },
        onSuccess: () => {
            toast.success(isEditingFeedback ? "Feedback updated successfully!" : "Feedback submitted successfully!");
            setShowFeedbackModal(false);
            setFeedback("");
            setRating(5);
            setIsEditingFeedback(false);
            queryClient.invalidateQueries(["sessions"]);
            queryClient.invalidateQueries(["mentorshipSessions"]);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to submit feedback");
        },
    });

    const { mutate: deleteFeedback, isPending: deleting } = useMutation({
        mutationFn: async () => {
            const res = await axiosInstance.delete(`/mentorships/sessions/${session._id}/feedback`, {
                data: { role: isMentor ? "mentor" : "mentee" }
            });
            return res.data;
        },
        onSuccess: () => {
            toast.success("Feedback deleted successfully!");
            setShowDeleteConfirm(false);
            queryClient.invalidateQueries(["sessions"]);
            queryClient.invalidateQueries(["mentorshipSessions"]);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to delete feedback");
        },
    });

    const statusColors = {
        pending: "bg-yellow-100 text-yellow-800",
        scheduled: "bg-blue-100 text-blue-800",
        completed: "bg-green-100 text-green-800",
        cancelled: "bg-red-100 text-red-800",
        "in-progress": "bg-yellow-100 text-yellow-800",
    };

    const hasFeedback = isMentor ? session.feedback?.mentorFeedback : session.feedback?.menteeFeedback;
    const isUpcoming = new Date(session.scheduledDate) > new Date();
    const canComplete = isMentor && session.status === "scheduled" && !isUpcoming; // Only mentor can mark complete
    const canProvideFeedback = session.status === "completed" && !hasFeedback; // Both can provide feedback

    return (
        <>
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="font-semibold text-lg">{session.title}</h3>
                        <p className="text-sm text-gray-600">{session.description}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[session.status]}`}>
                        {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                    </span>
                </div>

                <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-gray-700">
                        <Calendar size={18} className="text-primary" />
                        <span className="text-sm">
                            {new Date(session.scheduledDate).toLocaleDateString("en-US", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                        </span>
                        <span className="text-xs text-gray-500">
                            ({isUpcoming ? "in" : ""} {formatDistanceToNow(new Date(session.scheduledDate), { addSuffix: !isUpcoming })})
                        </span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-700">
                        <Clock size={18} className="text-primary" />
                        <span className="text-sm">
                            {new Date(session.scheduledDate).toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </span>
                        <span className="text-sm text-gray-500">({session.duration} minutes)</span>
                    </div>

                    {/* Video Call Button - Only show for scheduled/in-progress virtual sessions */}
                    {session.meetingLink && session.status !== "cancelled" && isUpcoming && (
                        <div className="flex items-center gap-2">
                            <Video size={18} className="text-primary" />
                            <button
                                onClick={() => {
                                    const callId = `${session._id}-${Date.now()}`;
                                    setCurrentCallId(callId);
                                    if (socket) {
                                        socket.emit('call-invite', {
                                            callId,
                                            recipientId: otherUser._id,
                                            callerId: authUser._id,
                                            callerName: authUser.name,
                                            callerProfilePicture: authUser.profilePicture,
                                            otherUser: otherUser
                                        });
                                    }
                                    setShowVideoCall(true);
                                }}
                                className="text-sm text-blue-600 hover:underline font-medium"
                            >
                                Join Video Call
                            </button>
                        </div>
                    )}

                    {session.location && (
                        <div className="flex items-center gap-2 text-gray-700">
                            <MapPin size={18} className="text-primary" />
                            <span className="text-sm">{session.location}</span>
                        </div>
                    )}
                </div>

                {session.agenda && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <p className="text-sm font-medium mb-2">Agenda:</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{session.agenda}</p>
                    </div>
                )}

                {session.actionItems && session.actionItems.length > 0 && (
                    <div className="mb-4">
                        <p className="text-sm font-medium mb-2">Action Items:</p>
                        <ul className="space-y-1">
                            {session.actionItems.map((item, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm">
                                    <CheckCircle
                                        size={16}
                                        className={`mt-0.5 flex-shrink-0 ${
                                            item.completed ? "text-green-600" : "text-gray-400"
                                        }`}
                                    />
                                    <span className={item.completed ? "line-through text-gray-500" : "text-gray-700"}>
                                        {item.task}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Feedback Section - Separate boxes for Mentor and Mentee */}
                {session.feedback && (session.feedback.rating || session.feedback.mentorFeedback || session.feedback.menteeFeedback) && (
                    <div className="space-y-3 mb-4">
                        {/* Rating Display - Only if mentee has rated */}
                        {session.feedback.rating && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                <p className="text-sm font-medium flex items-center gap-2 text-yellow-800">
                                    <Star size={16} className="text-yellow-500 fill-yellow-500" />
                                    Session Rating: {session.feedback.rating}/5 (by {mentorship.mentee.name})
                                </p>
                            </div>
                        )}

                        {/* Mentee Feedback Box */}
                        {session.feedback.menteeFeedback && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <Link 
                                        to={`/profile/${mentorship.mentee.username}`}
                                        className="flex items-center gap-2 "
                                    >
                                        <img 
                                            src={mentorship.mentee.profilePicture || "/avatar.png"} 
                                            alt={mentorship.mentee.name}
                                            className="w-8 h-8 rounded-full object-cover"
                                        />
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800">
                                                {mentorship.mentee.name}
                                            </p>
                                            <p className="text-xs text-gray-500">@{mentorship.mentee.username} · Mentee</p>
                                        </div>
                                    </Link>
                                    {!isMentor && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    setIsEditingFeedback(true);
                                                    setShowFeedbackModal(true);
                                                }}
                                                className="text-blue-600 hover:text-blue-800 transition"
                                                title="Edit feedback"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => setShowDeleteConfirm(true)}
                                                className="text-red-600 hover:text-red-800 transition"
                                                title="Delete feedback"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed">{session.feedback.menteeFeedback}</p>
                            </div>
                        )}

                        {/* Mentor Feedback Box */}
                        {session.feedback.mentorFeedback && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <Link 
                                        to={`/profile/${mentorship.mentor.username}`}
                                        className="flex items-center gap-2 "
                                    >
                                        <img 
                                            src={mentorship.mentor.profilePicture || "/avatar.png"} 
                                            alt={mentorship.mentor.name}
                                            className="w-8 h-8 rounded-full object-cover"
                                        />
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800">
                                                {mentorship.mentor.name}
                                            </p>
                                            <p className="text-xs text-gray-500">@{mentorship.mentor.username} · Mentor</p>
                                        </div>
                                    </Link>
                                    {isMentor && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    setIsEditingFeedback(true);
                                                    setShowFeedbackModal(true);
                                                }}
                                                className="text-blue-600 hover:text-blue-800 transition"
                                                title="Edit feedback"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => setShowDeleteConfirm(true)}
                                                className="text-red-600 hover:text-red-800 transition"
                                                title="Delete feedback"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed">{session.feedback.mentorFeedback}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Confirmation Status for Pending Sessions */}
                {session.status === "pending" && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm font-medium text-yellow-800 mb-2">
                            ⏳ Session Confirmation Needed
                        </p>
                        <div className="space-y-1 text-xs text-gray-600">
                            <p className="flex items-center gap-2">
                                {session.confirmedByMentor ? (
                                    <CheckCircle size={14} className="text-green-600" />
                                ) : (
                                    <Clock size={14} className="text-gray-400" />
                                )}
                                <span>Mentor: {session.confirmedByMentor ? "Confirmed" : "Pending"}</span>
                            </p>
                            <p className="flex items-center gap-2">
                                {session.confirmedByMentee ? (
                                    <CheckCircle size={14} className="text-green-600" />
                                ) : (
                                    <Clock size={14} className="text-gray-400" />
                                )}
                                <span>Mentee: {session.confirmedByMentee ? "Confirmed" : "Pending"}</span>
                            </p>
                        </div>
                    </div>
                )}

                {/* Cancel Request Status for Scheduled Sessions */}
                {session.status === "scheduled" && session.cancelRequestedBy && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm font-medium text-red-800 mb-2">
                            🚫 Cancellation Request Pending
                        </p>
                        <p className="text-xs text-gray-700 mb-2">
                            {session.cancelRequestedBy._id === authUser._id ? (
                                <>You have requested to cancel this session. Waiting for mentor approval.</>
                            ) : (
                                <>Mentee has requested to cancel this session.</>
                            )}
                        </p>
                        {session.cancelReason && (
                            <div className="mt-2 p-2 bg-white rounded border border-red-100">
                                <p className="text-xs font-medium text-gray-600">Reason:</p>
                                <p className="text-xs text-gray-700">{session.cancelReason}</p>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex gap-2">
                    {session.status === "pending" && needsMyConfirmation && (
                        <>
                            <button
                                onClick={() => confirmSession()}
                                disabled={confirming}
                                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:bg-gray-400"
                            >
                                <CheckCircle size={18} />
                                {confirming ? "Confirming..." : "Confirm Session"}
                            </button>
                            <button
                                onClick={() => setShowCancelModal(true)}
                                disabled={cancelling}
                                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2 disabled:bg-gray-400"
                            >
                                <X size={18} />
                                {cancelling ? "Cancelling..." : "Decline"}
                            </button>
                        </>
                    )}

                    {session.status === "pending" && !needsMyConfirmation && (
                        <>
                            <div className="flex-1 bg-gray-100 text-gray-600 py-2 px-4 rounded-lg text-center text-sm">
                                Waiting for {otherPartyConfirmed ? "system" : (isMentor ? "mentee" : "mentor")} confirmation
                            </div>
                            <button
                                onClick={() => setShowCancelModal(true)}
                                disabled={cancelling}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2 disabled:bg-gray-400"
                            >
                                <X size={18} />
                                Cancel
                            </button>
                        </>
                    )}

                    {canComplete && !session.cancelRequestedBy && (
                        <>
                            <button
                                onClick={() => markComplete()}
                                disabled={completing}
                                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:bg-gray-400"
                            >
                                <CheckCircle size={18} />
                                Mark Complete
                            </button>
                            <button
                                onClick={() => setShowCancelModal(true)}
                                disabled={cancelling}
                                className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <X size={18} />
                                {isMentor ? "Cancel" : "Request Cancel"}
                            </button>
                        </>
                    )}

                    {session.status === "scheduled" && !canComplete && !session.cancelRequestedBy && (
                        <button
                            onClick={() => setShowCancelModal(true)}
                            disabled={cancelling}
                            className="flex-1 border border-red-600 text-red-600 py-2 px-4 rounded-lg hover:bg-red-50 transition flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <X size={18} />
                            {isMentor ? "Cancel Session" : "Request Cancellation"}
                        </button>
                    )}

                    {/* Mentor Approves Mentee's Cancel Request */}
                    {session.status === "scheduled" && session.cancelRequestedBy && isMentor && session.cancelRequestedBy._id !== authUser._id && (
                        <>
                            <button
                                onClick={() => cancelSession()}
                                disabled={cancelling}
                                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2 disabled:bg-gray-400"
                            >
                                <CheckCircle size={18} />
                                {cancelling ? "Approving..." : "Approve Cancellation"}
                            </button>
                        </>
                    )}

                    {/* Mentee Waiting for Mentor Approval */}
                    {session.status === "scheduled" && session.cancelRequestedBy && !isMentor && session.cancelRequestedBy._id === authUser._id && (
                        <div className="flex-1 bg-gray-100 text-gray-600 py-2 px-4 rounded-lg text-center text-sm">
                            Waiting for mentor to approve cancellation
                        </div>
                    )}

                    {session.status === "completed" && canProvideFeedback && (
                        <button
                            onClick={() => setShowFeedbackModal(true)}
                            className={`flex-1 text-white py-2 px-4 rounded-lg transition flex items-center justify-center gap-2 ${
                                isMentor 
                                    ? 'bg-primary hover:bg-primary-dark' 
                                    : 'bg-yellow-600 hover:bg-yellow-700'
                            }`}
                        >
                            {isMentor ? <FileText size={18} /> : <Star size={18} />}
                            {isMentor ? 'Add Feedback' : 'Rate & Review Session'}
                        </button>
                    )}
                </div>
            </div>

            {/* Feedback Modal */}
            {showFeedbackModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-lg w-full">
                        <div className="border-b px-6 py-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold">
                                {isEditingFeedback 
                                    ? "Edit Feedback" 
                                    : !isMentor && !session.feedback?.rating 
                                        ? "Rate & Review Session" 
                                        : "Session Feedback"
                                }
                            </h2>
                            <button 
                                onClick={() => {
                                    setShowFeedbackModal(false);
                                    setIsEditingFeedback(false);
                                    setFeedback("");
                                    setRating(5);
                                }} 
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Rating - Only for mentees */}
                            {!isMentor && !session.feedback?.rating && (
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Rating <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((num) => (
                                            <button
                                                key={num}
                                                onClick={() => setRating(num)}
                                                className="focus:outline-none"
                                            >
                                                <Star
                                                    size={32}
                                                    className={`${
                                                        num <= rating
                                                            ? "text-yellow-500 fill-yellow-500"
                                                            : "text-gray-300"
                                                    } transition`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Only mentees can rate sessions</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Your Feedback as {isMentor ? "Mentor" : "Mentee"}
                                </label>
                                <textarea
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    placeholder={`Share your thoughts about this session as ${isMentor ? "the mentor" : "the mentee"}...`}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    rows={4}
                                />
                            </div>

                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setShowFeedbackModal(false)}
                                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => submitFeedback()}
                                    disabled={submitting || !feedback.trim()}
                                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition disabled:bg-gray-400"
                                >
                                    {submitting ? "Submitting..." : "Submit Feedback"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Session Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-lg w-full">
                        <div className="border-b px-6 py-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold">
                                {session.status === "pending" ? "Cancel Session" : 
                                 session.cancelRequestedBy && isMentor && session.cancelRequestedBy._id !== authUser._id ? "Approve Cancellation" :
                                 isMentor ? "Cancel Session" : "Request Cancellation"}
                            </h2>
                            <button onClick={() => setShowCancelModal(false)} className="text-gray-500 hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <p className="text-gray-700">
                                {session.status === "pending" ? (
                                    "Are you sure you want to cancel this session? The other party will be notified."
                                ) : session.cancelRequestedBy && isMentor && session.cancelRequestedBy._id !== authUser._id ? (
                                    "The mentee has requested to cancel this session. Do you approve?"
                                ) : isMentor ? (
                                    "Are you sure you want to cancel this session? The mentee will be notified immediately."
                                ) : (
                                    "This will send a cancellation request to the mentor. They need to approve before the session is cancelled."
                                )}
                            </p>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Reason for cancellation <span className="text-gray-500 font-normal">(optional)</span>
                                </label>
                                <textarea
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    placeholder="Let them know why you're cancelling..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    rows={3}
                                />
                            </div>

                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => {
                                        setShowCancelModal(false);
                                        setCancelReason("");
                                    }}
                                    disabled={cancelling}
                                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                                >
                                    {session.cancelRequestedBy && isMentor && session.cancelRequestedBy._id !== authUser._id ? "Reject" : "Keep Session"}
                                </button>
                                <button
                                    onClick={() => cancelSession()}
                                    disabled={cancelling}
                                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-gray-400"
                                >
                                    {cancelling ? "Processing..." : 
                                     session.status === "pending" ? "Cancel Session" :
                                     session.cancelRequestedBy && isMentor && session.cancelRequestedBy._id !== authUser._id ? "Approve Cancellation" :
                                     isMentor ? "Cancel Session" : "Request Cancellation"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Feedback Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full">
                        <div className="border-b px-6 py-4">
                            <h2 className="text-xl font-bold">Delete Feedback</h2>
                        </div>

                        <div className="p-6">
                            <p className="text-gray-700 mb-6">
                                Are you sure you want to delete your feedback? This action cannot be undone.
                                {!isMentor && session.feedback?.rating && (
                                    <span className="block mt-2 text-sm text-yellow-700 bg-yellow-50 p-2 rounded">
                                        ⚠️ This will also remove your rating.
                                    </span>
                                )}
                            </p>

                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={deleting}
                                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => deleteFeedback()}
                                    disabled={deleting}
                                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-gray-400 flex items-center gap-2"
                                >
                                    {deleting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 size={16} />
                                            Delete Feedback
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Video Call Modal */}
            <VideoCallModal
                isOpen={showVideoCall}
                onClose={() => {
                    setShowVideoCall(false);
                    setCurrentCallId(null);
                }}
                callId={currentCallId}
                authUser={authUser}
                otherUser={otherUser}
            />
        </>
    );
};

export default SessionCard;
