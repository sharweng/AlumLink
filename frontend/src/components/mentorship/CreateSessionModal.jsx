import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../../lib/axios";
import toast from "react-hot-toast";
import { X } from "lucide-react";

const CreateSessionModal = ({ mentorship, onClose }) => {
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        scheduledDate: "",
        duration: 60,
        location: "",
        agenda: "",
    });
    const [isVirtual, setIsVirtual] = useState(true);
    const [errors, setErrors] = useState({
        title: false,
        scheduledDate: false,
        location: false,
    });

    const queryClient = useQueryClient();

    const { mutate: createSession, isPending } = useMutation({
        mutationFn: async (sessionData) => {
            const res = await axiosInstance.post("/mentorships/sessions", sessionData);
            return res.data;
        },
        onSuccess: () => {
            toast.success("Session scheduled successfully!");
            queryClient.invalidateQueries(["sessions"]);
            queryClient.invalidateQueries(["mentorshipSessions"]);
            onClose();
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to create session");
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const newErrors = {
            title: !formData.title.trim(),
            scheduledDate: !formData.scheduledDate,
            location: !isVirtual && !formData.location.trim(),
        };
        
        setErrors(newErrors);
        
        if (newErrors.title || newErrors.scheduledDate || newErrors.location) {
            return;
        }

        const selectedDate = new Date(formData.scheduledDate);
        if (selectedDate < new Date()) {
            setErrors({ ...newErrors, scheduledDate: true });
            return;
        }

        // Build session data
        const sessionData = {
            mentorshipId: mentorship._id,
            ...formData,
        };
        
        // If virtual, add a placeholder meeting link (we'll use built-in video)
        if (isVirtual) {
            sessionData.meetingLink = "builtin-video-call"; // Indicator for built-in video
            sessionData.location = "";
        } else {
            sessionData.meetingLink = "";
        }

        createSession(sessionData);
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Schedule New Session</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Session Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={(e) => {
                                handleChange(e);
                                if (errors.title) setErrors({ ...errors, title: false });
                            }}
                            placeholder="e.g., Career Development Discussion"
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                                errors.title 
                                    ? 'border-red-500 focus:ring-red-500' 
                                    : 'border-gray-300 focus:ring-primary'
                            }`}
                        />
                        {errors.title && (
                            <p className="text-red-500 text-sm mt-1">Session title is required</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Brief description of what will be covered..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Date & Time <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="datetime-local"
                                name="scheduledDate"
                                value={formData.scheduledDate}
                                onChange={(e) => {
                                    handleChange(e);
                                    if (errors.scheduledDate) setErrors({ ...errors, scheduledDate: false });
                                }}
                                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                                    errors.scheduledDate 
                                        ? 'border-red-500 focus:ring-red-500' 
                                        : 'border-gray-300 focus:ring-primary'
                                }`}
                            />
                            {errors.scheduledDate && (
                                <p className="text-red-500 text-sm mt-1">
                                    {formData.scheduledDate && new Date(formData.scheduledDate) < new Date()
                                        ? "Please select a future date and time"
                                        : "Date and time is required"}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Duration</label>
                            <select
                                name="duration"
                                value={formData.duration}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value={30}>30 minutes</option>
                                <option value={45}>45 minutes</option>
                                <option value={60}>60 minutes</option>
                                <option value={90}>90 minutes</option>
                                <option value={120}>2 hours</option>
                            </select>
                        </div>
                    </div>

                    {/* Virtual Meeting Checkbox */}
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <input
                            type="checkbox"
                            id="isVirtual"
                            checked={isVirtual}
                            onChange={(e) => {
                                setIsVirtual(e.target.checked);
                                // Clear location error when toggling
                                setErrors({ ...errors, location: false });
                            }}
                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <label htmlFor="isVirtual" className="text-sm font-medium text-gray-700 cursor-pointer">
                            Virtual Meeting (Online)
                        </label>
                    </div>

                    {/* Conditional Meeting Link or Location */}
                    {isVirtual ? (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                <p className="text-sm font-medium text-blue-900">Built-in Video Call</p>
                            </div>
                            <p className="text-xs text-blue-700">
                                This session will use our integrated video calling feature. Both parties can join directly from the session card.
                            </p>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Location <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={(e) => {
                                    handleChange(e);
                                    if (errors.location) setErrors({ ...errors, location: false });
                                }}
                                placeholder="Physical meeting location (e.g., Coffee Shop, Office Address)"
                                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                                    errors.location 
                                        ? 'border-red-500 focus:ring-red-500' 
                                        : 'border-gray-300 focus:ring-primary'
                                }`}
                            />
                            {errors.location && (
                                <p className="text-red-500 text-sm mt-1">Location is required for physical meetings</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                                Provide the address or place where you'll meet
                            </p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium mb-2">Agenda</label>
                        <textarea
                            name="agenda"
                            value={formData.agenda}
                            onChange={handleChange}
                            placeholder="Topics to discuss, goals for this session..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            rows={4}
                        />
                    </div>

                    <div className="flex gap-3 justify-end pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition disabled:bg-gray-400"
                        >
                            {isPending ? "Scheduling..." : "Schedule Session"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateSessionModal;
