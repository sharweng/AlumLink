import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { axiosInstance } from "../../lib/axios";
import { Image, X, Loader, MapPin, Video, Ticket, Calendar, Clock } from "lucide-react";

const EventCreation = ({ onClose }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "Webinar",
    eventDate: "",
    eventTime: "",
    eventDuration: "",
    location: "",
    isVirtual: false,
    virtualLink: "",
    capacity: "",
    requiresTicket: false,
    ticketPrice: "",
    tags: "",
  });

  const [images, setImages] = useState([]);
  const [errors, setErrors] = useState({});

  const { mutate: createEvent, isPending } = useMutation({
    mutationFn: async (eventData) => {
      const response = await axiosInstance.post("/events/create", eventData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event created successfully!");
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to create event");
    },
  });

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear errors on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: false }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    if (!formData.eventDate) newErrors.eventDate = "Event date is required";
    if (!formData.eventTime) newErrors.eventTime = "Event time is required";
    if (!formData.eventDuration) newErrors.eventDuration = "Event duration is required";
    
    // Validate that duration is a positive number
    if (formData.eventDuration && (isNaN(formData.eventDuration) || parseFloat(formData.eventDuration) <= 0)) {
      newErrors.eventDuration = "Duration must be a positive number";
    }
    
    if (formData.isVirtual) {
      if (!formData.virtualLink.trim()) newErrors.virtualLink = "Virtual link is required";
    } else {
      if (!formData.location.trim()) newErrors.location = "Location is required";
    }

    if (formData.requiresTicket && !formData.ticketPrice) {
      newErrors.ticketPrice = "Ticket price is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateEvent = () => {
    if (!validateForm()) {
      return;
    }

    const eventData = {
      ...formData,
      images,
      tags: formData.tags ? formData.tags.split(",").map((tag) => tag.trim()) : [],
      capacity: formData.capacity ? parseInt(formData.capacity) : 0,
      ticketPrice: formData.ticketPrice ? parseFloat(formData.ticketPrice) : 0,
      eventDuration: parseFloat(formData.eventDuration),
    };

    createEvent(eventData);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Create New Event</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X size={20} />
        </button>
      </div>

      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Event Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter event title"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
              errors.title ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe your event..."
            rows={4}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none ${
              errors.description ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Event Type <span className="text-red-500">*</span>
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="Webinar">Webinar</option>
            <option value="Workshop">Workshop</option>
            <option value="Reunion">Reunion</option>
          </select>
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar size={16} className="inline mr-1" />
              Event Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="eventDate"
              value={formData.eventDate}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                errors.eventDate ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.eventDate && (
              <p className="mt-1 text-sm text-red-600">{errors.eventDate}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Clock size={16} className="inline mr-1" />
              Start Time <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              name="eventTime"
              value={formData.eventTime}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                errors.eventTime ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.eventTime && (
              <p className="mt-1 text-sm text-red-600">{errors.eventTime}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Clock size={16} className="inline mr-1" />
              Duration (hours) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="eventDuration"
              value={formData.eventDuration}
              onChange={handleChange}
              placeholder="e.g., 2 or 1.5"
              step="0.5"
              min="0.5"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                errors.eventDuration ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.eventDuration && (
              <p className="mt-1 text-sm text-red-600">{errors.eventDuration}</p>
            )}
          </div>
        </div>

        {/* Virtual Event Toggle */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isVirtual"
            name="isVirtual"
            checked={formData.isVirtual}
            onChange={handleChange}
            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <label htmlFor="isVirtual" className="text-sm font-medium text-gray-700">
            <Video size={16} className="inline mr-1" />
            Virtual Event
          </label>
        </div>

        {/* Location or Virtual Link */}
        {formData.isVirtual ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Virtual Link <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              name="virtualLink"
              value={formData.virtualLink}
              onChange={handleChange}
              placeholder="https://zoom.us/j/..."
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                errors.virtualLink ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.virtualLink && (
              <p className="mt-1 text-sm text-red-600">{errors.virtualLink}</p>
            )}
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MapPin size={16} className="inline mr-1" />
              Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Enter event location"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                errors.location ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.location && (
              <p className="mt-1 text-sm text-red-600">{errors.location}</p>
            )}
          </div>
        )}

        {/* Capacity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Capacity (optional)
          </label>
          <input
            type="number"
            name="capacity"
            value={formData.capacity}
            onChange={handleChange}
            placeholder="Leave empty for unlimited"
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Ticketing */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="requiresTicket"
            name="requiresTicket"
            checked={formData.requiresTicket}
            onChange={handleChange}
            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <label htmlFor="requiresTicket" className="text-sm font-medium text-gray-700">
            <Ticket size={16} className="inline mr-1" />
            Requires Ticket
          </label>
        </div>

        {formData.requiresTicket && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ticket Price (₱) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="ticketPrice"
              value={formData.ticketPrice}
              onChange={handleChange}
              placeholder="0 for free"
              min="0"
              step="0.01"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                errors.ticketPrice ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.ticketPrice && (
              <p className="mt-1 text-sm text-red-600">{errors.ticketPrice}</p>
            )}
          </div>
        )}

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tags (comma separated)
          </label>
          <input
            type="text"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            placeholder="e.g., networking, career, tech"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Event Images
          </label>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors">
              <Image size={20} />
              <span>Add Images</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>
          
          {images.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {images.map((img, index) => (
                <div key={index} className="relative group">
                  <img
                    src={img}
                    alt={`Event ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <button
            onClick={handleCreateEvent}
            disabled={isPending}
            className="flex-1 bg-primary text-white py-2 px-4 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isPending && <Loader className="animate-spin" size={16} />}
            {isPending ? "Creating..." : "Create Event"}
          </button>
          <button
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventCreation;
