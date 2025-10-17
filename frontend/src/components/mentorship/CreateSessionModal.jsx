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
        meetingLink: "",
        location: "",
        agenda: "",
    });
    const [isVirtual, setIsVirtual] = useState(true);
    const [errors, setErrors] = useState({
        title: false,
        scheduledDate: false,
        meetingLink: false,
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
            meetingLink: isVirtual && !formData.meetingLink.trim(),
            location: !isVirtual && !formData.location.trim(),
        };
        
        setErrors(newErrors);
        
        if (newErrors.title || newErrors.scheduledDate || newErrors.meetingLink || newErrors.location) {
            return;
        }

        const selectedDate = new Date(formData.scheduledDate);
        if (selectedDate < new Date()) {
            setErrors({ ...newErrors, scheduledDate: true });
            return;
        }

        // Clear the field that's not being used
        const sessionData = {
            mentorshipId: mentorship._id,
            ...formData,
        };
        
        if (isVirtual) {
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
                                // Clear errors when toggling
                                setErrors({ ...errors, meetingLink: false, location: false });
                            }}
                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <label htmlFor="isVirtual" className="text-sm font-medium text-gray-700 cursor-pointer">
                            Virtual Meeting (Online)
                        </label>
                    </div>

                    {/* Conditional Meeting Link or Location */}
                    {isVirtual ? (
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Meeting Link <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="url"
                                name="meetingLink"
                                value={formData.meetingLink}
                                onChange={(e) => {
                                    handleChange(e);
                                    if (errors.meetingLink) setErrors({ ...errors, meetingLink: false });
                                }}
                                placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                                    errors.meetingLink 
                                        ? 'border-red-500 focus:ring-red-500' 
                                        : 'border-gray-300 focus:ring-primary'
                                }`}
                            />
                            {errors.meetingLink && (
                                <p className="text-red-500 text-sm mt-1">Meeting link is required for virtual meetings</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                                Provide a Zoom, Google Meet, or other video call link
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
