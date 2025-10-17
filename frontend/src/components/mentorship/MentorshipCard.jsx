import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../../lib/axios";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { Check, X, Calendar, Target, FileText, Plus, UserX } from "lucide-react";
import CreateSessionModal from "./CreateSessionModal";

const MentorshipCard = ({ mentorship, authUser }) => {
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [notes, setNotes] = useState(mentorship.notes || "");
    const [showCreateSession, setShowCreateSession] = useState(false);
    const [showEndMentorshipModal, setShowEndMentorshipModal] = useState(false);

    const queryClient = useQueryClient();
    const isMentor = mentorship.mentor._id === authUser._id;

    const { mutate: respondToRequest, isPending: responding } = useMutation({
        mutationFn: async ({ status }) => {
            const res = await axiosInstance.put(`/mentorships/${mentorship._id}/respond`, { status });
            return res.data;
        },
        onSuccess: () => {
            toast.success("Response sent successfully!");
            queryClient.invalidateQueries(["myMentorships"]);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to respond");
        },
    });

    const { mutate: updateNotes, isPending: updatingNotes } = useMutation({
        mutationFn: async () => {
            const res = await axiosInstance.put(`/mentorships/${mentorship._id}`, { notes });
            return res.data;
        },
        onSuccess: () => {
            toast.success("Notes updated successfully!");
            setShowNoteModal(false);
            queryClient.invalidateQueries(["myMentorships"]);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to update notes");
        },
    });

    const { mutate: endMentorship, isPending: ending } = useMutation({
        mutationFn: async () => {
            const res = await axiosInstance.put(`/mentorships/${mentorship._id}`, { status: "completed" });
            return res.data;
        },
        onSuccess: () => {
            toast.success("Mentorship ended successfully!");
            setShowEndMentorshipModal(false);
            queryClient.invalidateQueries(["myMentorships"]);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to end mentorship");
        },
    });

    const otherUser = isMentor ? mentorship.mentee : mentorship.mentor;
    const statusColors = {
        pending: "bg-yellow-100 text-yellow-800",
        accepted: "bg-green-100 text-green-800",
        declined: "bg-red-100 text-red-800",
        completed: "bg-blue-100 text-blue-800",
        cancelled: "bg-gray-100 text-gray-800",
    };

    return (
        <>
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                    <Link to={`/profile/${otherUser.username}`}>
                        <div className="flex items-center gap-3">
                            <img
                                src={otherUser.profilePicture || "/avatar.png"}
                                alt={otherUser.name}
                                className="w-12 h-12 rounded-full object-cover"
                            />
                            <div>
                                <h3 className="font-semibold text-lg hover:text-primary">{otherUser.name}</h3>
                                <p className="text-sm text-gray-600">{otherUser.headline}</p>
                                <p className="text-xs text-gray-500">
                                    {isMentor ? "Your Mentee" : "Your Mentor"}
                                </p>
                            </div>
                        </div>
                    </Link>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[mentorship.status]}`}>
                        {mentorship.status.charAt(0).toUpperCase() + mentorship.status.slice(1)}
                    </span>
                </div>

                {mentorship.focusAreas && mentorship.focusAreas.length > 0 && (
                    <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Focus Areas:</p>
                        <div className="flex flex-wrap gap-2">
                            {mentorship.focusAreas.map((area, index) => (
                                <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                    {area}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {mentorship.status === "pending" && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <p className="text-sm font-medium mb-2">Request Message:</p>
                        <p className="text-sm text-gray-700">{mentorship.requestMessage}</p>
                    </div>
                )}

                {mentorship.goals && (
                    <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                            <Target size={16} />
                            Goals:
                        </p>
                        <p className="text-sm text-gray-600">{mentorship.goals}</p>
                    </div>
                )}

                <div className="flex flex-wrap gap-2 mt-4">
                    {mentorship.status === "pending" && isMentor && (
                        <>
                            <button
                                onClick={() => respondToRequest({ status: "accepted" })}
                                disabled={responding}
                                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:bg-gray-400"
                            >
                                <Check size={18} />
                                Accept
                            </button>
                            <button
                                onClick={() => respondToRequest({ status: "declined" })}
                                disabled={responding}
                                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2 disabled:bg-gray-400"
                            >
                                <X size={18} />
                                Decline
                            </button>
                        </>
                    )}

                    {mentorship.status === "accepted" && (
                        <>
                            <button
                                onClick={() => setShowCreateSession(true)}
                                className="flex-1 bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-dark transition flex items-center justify-center gap-2"
                            >
                                <Calendar size={18} />
                                Schedule Session
                            </button>
                            {isMentor && (
                                <button
                                    onClick={() => setShowNoteModal(true)}
                                    className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition flex items-center gap-2"
                                >
                                    <FileText size={18} />
                                    Notes
                                </button>
                            )}
                            <button
                                onClick={() => setShowEndMentorshipModal(true)}
                                className="bg-red-100 text-red-700 py-2 px-4 rounded-lg hover:bg-red-200 transition flex items-center gap-2"
                                title="End mentorship relationship"
                            >
                                <UserX size={18} />
                                End Mentorship
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Notes Modal */}
            {showNoteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-lg w-full">
                        <div className="border-b px-6 py-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold">Mentorship Notes</h2>
                            <button onClick={() => setShowNoteModal(false)} className="text-gray-500 hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add notes about your mentorship..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                rows={6}
                            />

                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setShowNoteModal(false)}
                                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => updateNotes()}
                                    disabled={updatingNotes}
                                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition disabled:bg-gray-400"
                                >
                                    {updatingNotes ? "Saving..." : "Save Notes"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Session Modal */}
            {showCreateSession && (
                <CreateSessionModal
                    mentorship={mentorship}
                    onClose={() => setShowCreateSession(false)}
                />
            )}

            {/* End Mentorship Confirmation Modal */}
            {showEndMentorshipModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full">
                        <div className="border-b px-6 py-4">
                            <h2 className="text-xl font-bold text-gray-900">End Mentorship</h2>
                        </div>

                        <div className="p-6">
                            <div className="mb-6">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <UserX className="text-red-600" size={24} />
                                </div>
                                <p className="text-center text-gray-700 mb-2">
                                    Are you sure you want to end this mentorship with{" "}
                                    <span className="font-semibold">{otherUser.name}</span>?
                                </p>
                                <p className="text-center text-sm text-gray-500">
                                    This will mark the mentorship as completed. You can still view past sessions and feedback.
                                </p>
                            </div>

                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setShowEndMentorshipModal(false)}
                                    disabled={ending}
                                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => endMentorship()}
                                    disabled={ending}
                                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-gray-400 flex items-center gap-2"
                                >
                                    {ending ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                            Ending...
                                        </>
                                    ) : (
                                        <>
                                            <UserX size={16} />
                                            End Mentorship
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default MentorshipCard;
