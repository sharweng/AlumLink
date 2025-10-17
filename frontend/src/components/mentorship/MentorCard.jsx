import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../../lib/axios";
import toast from "react-hot-toast";
import { MapPin, Award, MessageSquare, X, Clock } from "lucide-react";
import { Link } from "react-router-dom";

const MentorCard = ({ mentor, existingMentorships = [] }) => {
    // Check if there's already a pending or accepted mentorship with this mentor
    const hasPendingRequest = existingMentorships.some(
        (m) => m.mentor._id === mentor._id && m.status === "pending"
    );
    const hasActiveMentorship = existingMentorships.some(
        (m) => m.mentor._id === mentor._id && m.status === "accepted"
    );
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [requestMessage, setRequestMessage] = useState("");
    const [goals, setGoals] = useState("");
    const [focusAreas, setFocusAreas] = useState([]);

    const queryClient = useQueryClient();

    const { mutate: sendRequest, isPending } = useMutation({
        mutationFn: async (data) => {
            const res = await axiosInstance.post("/mentorships/request", data);
            return res.data;
        },
        onSuccess: () => {
            toast.success("Mentorship request sent successfully!");
            setShowRequestModal(false);
            setRequestMessage("");
            setGoals("");
            setFocusAreas([]);
            queryClient.invalidateQueries(["myMentorships"]);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to send request");
        },
    });

    const handleSubmitRequest = (e) => {
        e.preventDefault();
        if (!requestMessage.trim()) {
            toast.error("Please write a message");
            return;
        }
        sendRequest({
            mentorId: mentor._id,
            requestMessage,
            goals,
            focusAreas,
        });
    };

    const toggleFocusArea = (area) => {
        if (focusAreas.includes(area)) {
            setFocusAreas(focusAreas.filter((a) => a !== area));
        } else {
            setFocusAreas([...focusAreas, area]);
        }
    };

    return (
        <>
            <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6">
                <Link to={`/profile/${mentor.username}`}>
                    <div className="flex items-start gap-4 mb-4">
                        <img
                            src={mentor.profilePicture || "/avatar.png"}
                            alt={mentor.name}
                            className="w-16 h-16 rounded-full object-cover"
                        />
                        <div className="flex-1">
                            <h3 className="font-semibold text-lg text-gray-900 hover:text-primary">
                                {mentor.name}
                            </h3>
                            <p className="text-sm text-gray-600">{mentor.headline}</p>
                            {mentor.location && (
                                <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                                    <MapPin size={14} />
                                    <span>{mentor.location}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </Link>

                <p className="text-gray-700 text-sm mb-4 line-clamp-3">{mentor.mentorBio}</p>

                {mentor.mentorExpertise && mentor.mentorExpertise.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {mentor.mentorExpertise.map((exp, index) => (
                            <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                {exp}
                            </span>
                        ))}
                    </div>
                )}

                {hasActiveMentorship ? (
                    <div className="w-full bg-green-100 text-green-800 py-2 px-4 rounded-lg text-center font-medium flex items-center justify-center gap-2">
                        <Award size={18} />
                        Active Mentorship
                    </div>
                ) : hasPendingRequest ? (
                    <div className="w-full bg-yellow-100 text-yellow-800 py-2 px-4 rounded-lg text-center font-medium flex items-center justify-center gap-2">
                        <Clock size={18} />
                        Request Pending
                    </div>
                ) : (
                    <button
                        onClick={() => setShowRequestModal(true)}
                        className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary-dark transition"
                    >
                        Request Mentorship
                    </button>
                )}
            </div>

            {/* Request Modal */}
            {showRequestModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold">Request Mentorship</h2>
                            <button
                                onClick={() => setShowRequestModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitRequest} className="p-6 space-y-4">
                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                                <img
                                    src={mentor.profilePicture || "/avatar.png"}
                                    alt={mentor.name}
                                    className="w-16 h-16 rounded-full object-cover"
                                />
                                <div>
                                    <h3 className="font-semibold text-lg">{mentor.name}</h3>
                                    <p className="text-sm text-gray-600">{mentor.headline}</p>
                                </div>
                            </div>

                            {mentor.mentorExpertise && mentor.mentorExpertise.length > 0 && (
                                <div>
                                    <label className="block font-medium mb-2">Focus Areas</label>
                                    <div className="flex flex-wrap gap-2">
                                        {mentor.mentorExpertise.map((area, index) => (
                                            <button
                                                key={index}
                                                type="button"
                                                onClick={() => toggleFocusArea(area)}
                                                className={`px-3 py-1 rounded-full text-sm transition ${
                                                    focusAreas.includes(area)
                                                        ? "bg-primary text-white"
                                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                }`}
                                            >
                                                {area}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block font-medium mb-2">
                                    Introduction Message <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={requestMessage}
                                    onChange={(e) => setRequestMessage(e.target.value)}
                                    placeholder="Introduce yourself and explain why you'd like this person to be your mentor..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    rows={4}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block font-medium mb-2">Your Goals (Optional)</label>
                                <textarea
                                    value={goals}
                                    onChange={(e) => setGoals(e.target.value)}
                                    placeholder="What do you hope to achieve through this mentorship?"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    rows={3}
                                />
                            </div>

                            <div className="flex gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowRequestModal(false)}
                                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition disabled:bg-gray-400"
                                >
                                    {isPending ? "Sending..." : "Send Request"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default MentorCard;
