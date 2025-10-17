import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../../lib/axios";
import toast from "react-hot-toast";
import { Award, Edit2, X, Check } from "lucide-react";

const MentorSettingsSection = ({ userData, isOwnProfile }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        isMentor: userData.isMentor || false,
        mentorBio: userData.mentorBio || "",
        mentorExpertise: userData.mentorExpertise || [],
        mentorAvailability: userData.mentorAvailability || "",
        maxMentees: userData.maxMentees || 5,
    });
    const [newExpertise, setNewExpertise] = useState("");
    const [errors, setErrors] = useState({
        mentorBio: false,
        mentorExpertise: false,
    });
    const [showDeactivateModal, setShowDeactivateModal] = useState(false);

    const queryClient = useQueryClient();

    const { mutate: toggleMentorStatus, isPending } = useMutation({
        mutationFn: async () => {
            const res = await axiosInstance.put("/users/toggle-mentor", formData);
            return res.data;
        },
        onSuccess: () => {
            toast.success(formData.isMentor ? "Mentor profile activated!" : "Mentor profile deactivated");
            queryClient.invalidateQueries(["authUser"]);
            queryClient.invalidateQueries(["userProfile"]);
            setIsEditing(false);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to update mentor status");
        },
    });

    const handleToggle = () => {
        if (!formData.isMentor) {
            // Turning on mentor mode
            setFormData({ ...formData, isMentor: true });
            setIsEditing(true);
        } else {
            // Turning off mentor mode - show modal
            setShowDeactivateModal(true);
        }
    };

    const handleDeactivate = () => {
        setFormData({ ...formData, isMentor: false });
        setShowDeactivateModal(false);
        toggleMentorStatus();
    };

    const handleSave = () => {
        if (formData.isMentor) {
            const newErrors = {
                mentorBio: !formData.mentorBio.trim(),
                mentorExpertise: formData.mentorExpertise.length === 0,
            };
            
            setErrors(newErrors);
            
            if (newErrors.mentorBio || newErrors.mentorExpertise) {
                return;
            }
        }
        toggleMentorStatus();
    };

    const addExpertise = () => {
        if (newExpertise.trim() && !formData.mentorExpertise.includes(newExpertise.trim())) {
            setFormData({
                ...formData,
                mentorExpertise: [...formData.mentorExpertise, newExpertise.trim()],
            });
            setNewExpertise("");
        }
    };

    const removeExpertise = (expertise) => {
        setFormData({
            ...formData,
            mentorExpertise: formData.mentorExpertise.filter((e) => e !== expertise),
        });
    };

    if (!isOwnProfile) {
        // Only show if the user is a mentor (for other users viewing)
        if (!userData.isMentor) return null;
        
        return (
            <div className="bg-white shadow rounded-lg p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <Award className="text-primary" size={24} />
                    <h2 className="text-xl font-semibold">Mentor Profile</h2>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <h3 className="font-medium text-gray-700 mb-2">About as a Mentor</h3>
                        <p className="text-gray-600">{userData.mentorBio}</p>
                    </div>

                    {userData.mentorExpertise && userData.mentorExpertise.length > 0 && (
                        <div>
                            <h3 className="font-medium text-gray-700 mb-2">Areas of Expertise</h3>
                            <div className="flex flex-wrap gap-2">
                                {userData.mentorExpertise.map((exp, index) => (
                                    <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                                        {exp}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {userData.mentorAvailability && (
                        <div>
                            <h3 className="font-medium text-gray-700 mb-2">Availability</h3>
                            <p className="text-gray-600">{userData.mentorAvailability}</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <Award className="text-primary" size={24} />
                    <h2 className="text-xl font-semibold">Mentor Settings</h2>
                </div>
                
                {!isEditing && (
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <span className="text-sm font-medium text-gray-700">
                                {formData.isMentor ? "Active Mentor" : "Become a Mentor"}
                            </span>
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={formData.isMentor}
                                    onChange={handleToggle}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </div>
                        </label>
                    </div>
                )}
            </div>

            {formData.isMentor && (
                <>
                    {isEditing ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Mentor Bio <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={formData.mentorBio}
                                    onChange={(e) => {
                                        setFormData({ ...formData, mentorBio: e.target.value });
                                        if (errors.mentorBio) setErrors({ ...errors, mentorBio: false });
                                    }}
                                    placeholder="Describe your experience and what you can help mentees with..."
                                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                                        errors.mentorBio 
                                            ? 'border-red-500 focus:ring-red-500' 
                                            : 'border-gray-300 focus:ring-primary'
                                    }`}
                                    rows={4}
                                />
                                {errors.mentorBio && (
                                    <p className="text-red-500 text-sm mt-1">Mentor bio is required</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Areas of Expertise <span className="text-red-500">*</span>
                                </label>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={newExpertise}
                                        onChange={(e) => setNewExpertise(e.target.value)}
                                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addExpertise())}
                                        placeholder="e.g., Software Engineering, Product Management"
                                        className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                                            errors.mentorExpertise 
                                                ? 'border-red-500 focus:ring-red-500' 
                                                : 'border-gray-300 focus:ring-primary'
                                        }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            addExpertise();
                                            if (errors.mentorExpertise) setErrors({ ...errors, mentorExpertise: false });
                                        }}
                                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
                                    >
                                        Add
                                    </button>
                                </div>
                                {errors.mentorExpertise && (
                                    <p className="text-red-500 text-sm mb-2">At least one area of expertise is required</p>
                                )}
                                <div className="flex flex-wrap gap-2">
                                    {formData.mentorExpertise.map((exp, index) => (
                                        <span
                                            key={index}
                                            className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                                        >
                                            {exp}
                                            <button
                                                type="button"
                                                onClick={() => removeExpertise(exp)}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                <X size={14} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Availability
                                </label>
                                <input
                                    type="text"
                                    value={formData.mentorAvailability}
                                    onChange={(e) => setFormData({ ...formData, mentorAvailability: e.target.value })}
                                    placeholder="e.g., Weekday evenings, Weekends"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Maximum Mentees
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={formData.maxMentees}
                                    onChange={(e) => setFormData({ ...formData, maxMentees: parseInt(e.target.value) })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>

                            <div className="flex gap-3 justify-end pt-4 border-t">
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        setFormData({
                                            isMentor: userData.isMentor || false,
                                            mentorBio: userData.mentorBio || "",
                                            mentorExpertise: userData.mentorExpertise || [],
                                            mentorAvailability: userData.mentorAvailability || "",
                                            maxMentees: userData.maxMentees || 5,
                                        });
                                    }}
                                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isPending}
                                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition disabled:bg-gray-400 flex items-center gap-2"
                                >
                                    <Check size={18} />
                                    {isPending ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-medium text-gray-700 mb-2">About as a Mentor</h3>
                                <p className="text-gray-600">{formData.mentorBio || "No bio provided yet"}</p>
                            </div>

                            {formData.mentorExpertise.length > 0 && (
                                <div>
                                    <h3 className="font-medium text-gray-700 mb-2">Areas of Expertise</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.mentorExpertise.map((exp, index) => (
                                            <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                                                {exp}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {formData.mentorAvailability && (
                                <div>
                                    <h3 className="font-medium text-gray-700 mb-2">Availability</h3>
                                    <p className="text-gray-600">{formData.mentorAvailability}</p>
                                </div>
                            )}

                            <div className="flex justify-end pt-4 border-t">
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition flex items-center gap-2"
                                >
                                    <Edit2 size={18} />
                                    Edit Mentor Profile
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {!formData.isMentor && (
                <div className="text-center py-8">
                    <Award size={64} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-4">
                        Become a mentor and share your knowledge with fellow alumni. 
                        Help others grow in their careers by providing guidance and support.
                    </p>
                    <p className="text-sm text-gray-500">
                        Enable the toggle above to set up your mentor profile
                    </p>
                </div>
            )}

            {/* Deactivate Mentor Modal */}
            {showDeactivateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full">
                        <div className="border-b px-6 py-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold">Deactivate Mentor Profile</h2>
                            <button 
                                onClick={() => setShowDeactivateModal(false)} 
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <p className="text-gray-700">
                                Are you sure you want to deactivate your mentor profile? This will:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-gray-600 text-sm">
                                <li>Remove you from the mentor browse list</li>
                                <li>Prevent new mentorship requests</li>
                                <li>Keep your existing mentorships active</li>
                            </ul>
                            <p className="text-sm text-gray-500">
                                You can reactivate your mentor profile at any time.
                            </p>

                            <div className="flex gap-3 justify-end pt-4 border-t">
                                <button
                                    onClick={() => setShowDeactivateModal(false)}
                                    disabled={isPending}
                                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeactivate}
                                    disabled={isPending}
                                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-gray-400"
                                >
                                    {isPending ? "Deactivating..." : "Deactivate"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MentorSettingsSection;
