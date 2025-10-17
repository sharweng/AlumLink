import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../../lib/axios";
import toast from "react-hot-toast";
import { Calendar, Clock, Video, MapPin, CheckCircle, FileText, Star, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const SessionCard = ({ session, mentorship, authUser }) => {
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [feedback, setFeedback] = useState("");
    const [rating, setRating] = useState(5);

    const queryClient = useQueryClient();
    const isMentor = mentorship.mentor._id === authUser._id;

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
            setShowFeedbackModal(true);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to update session");
        },
    });

    const { mutate: submitFeedback, isPending: submitting } = useMutation({
        mutationFn: async () => {
            const res = await axiosInstance.post(`/mentorships/sessions/${session._id}/feedback`, {
                feedback,
                rating,
            });
            return res.data;
        },
        onSuccess: () => {
            toast.success("Feedback submitted successfully!");
            setShowFeedbackModal(false);
            queryClient.invalidateQueries(["sessions"]);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to submit feedback");
        },
    });

    const statusColors = {
        scheduled: "bg-blue-100 text-blue-800",
        completed: "bg-green-100 text-green-800",
        cancelled: "bg-red-100 text-red-800",
        "in-progress": "bg-yellow-100 text-yellow-800",
    };

    const hasFeedback = isMentor ? session.feedback?.mentorFeedback : session.feedback?.menteeFeedback;
    const isUpcoming = new Date(session.scheduledDate) > new Date();
    const canComplete = session.status === "scheduled" && !isUpcoming;

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

                    {session.meetingLink && (
                        <div className="flex items-center gap-2">
                            <Video size={18} className="text-primary" />
                            <a
                                href={session.meetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline"
                            >
                                Join Meeting
                            </a>
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

                {session.feedback && (
                    <div className="bg-blue-50 rounded-lg p-4 mb-4">
                        <p className="text-sm font-medium mb-2 flex items-center gap-2">
                            <Star size={16} className="text-yellow-500 fill-yellow-500" />
                            Rating: {session.feedback.rating}/5
                        </p>
                        {session.feedback.mentorFeedback && (
                            <div className="mb-2">
                                <p className="text-xs font-medium text-gray-600">Mentor Feedback:</p>
                                <p className="text-sm text-gray-700">{session.feedback.mentorFeedback}</p>
                            </div>
                        )}
                        {session.feedback.menteeFeedback && (
                            <div>
                                <p className="text-xs font-medium text-gray-600">Mentee Feedback:</p>
                                <p className="text-sm text-gray-700">{session.feedback.menteeFeedback}</p>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex gap-2">
                    {canComplete && (
                        <button
                            onClick={() => markComplete()}
                            disabled={completing}
                            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:bg-gray-400"
                        >
                            <CheckCircle size={18} />
                            Mark Complete
                        </button>
                    )}

                    {session.status === "completed" && !hasFeedback && (
                        <button
                            onClick={() => setShowFeedbackModal(true)}
                            className="flex-1 bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-dark transition flex items-center justify-center gap-2"
                        >
                            <FileText size={18} />
                            Add Feedback
                        </button>
                    )}
                </div>
            </div>

            {/* Feedback Modal */}
            {showFeedbackModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-lg w-full">
                        <div className="border-b px-6 py-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold">Session Feedback</h2>
                            <button onClick={() => setShowFeedbackModal(false)} className="text-gray-500 hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Rating</label>
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
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Your Feedback</label>
                                <textarea
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    placeholder="Share your thoughts about this session..."
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
        </>
    );
};

export default SessionCard;
