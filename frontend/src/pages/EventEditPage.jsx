import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { Image, X, Loader, MapPin, Video, Ticket, Calendar, Clock, ArrowLeft } from "lucide-react";
import Sidebar from "../components/Sidebar";

const EventEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData(["authUser"]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "Webinar",
    eventDate: "",
    eventTime: "",
    location: "",
    isVirtual: false,
    virtualLink: "",
    capacity: "",
    requiresTicket: false,
    ticketPrice: "",
    tags: "",
  });

  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [removedImages, setRemovedImages] = useState([]);
  const [errors, setErrors] = useState({});

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      const res = await axiosInstance.get(`/events/${id}`);
      return res.data;
    },
  });

  // Populate form data when event is loaded
  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || "",
        description: event.description || "",
        type: event.type || "Webinar",
        eventDate: event.eventDate ? event.eventDate.split('T')[0] : "",
        eventTime: event.eventTime || "",
        location: event.location || "",
        isVirtual: event.isVirtual || false,
        virtualLink: event.virtualLink || "",
        capacity: event.capacity || "",
        requiresTicket: event.requiresTicket || false,
        ticketPrice: event.ticketPrice || "",
        tags: event.tags ? event.tags.join(", ") : "",
      });
      setExistingImages(event.images || []);
    }
  }, [event]);

  const { mutate: updateEvent, isPending } = useMutation({
    mutationFn: async (eventData) => {
      const response = await axiosInstance.put(`/events/${id}`, eventData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["event", id] });
      toast.success("Event updated successfully!");
      navigate(`/event/${id}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update event");
    },
  });

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImages((prev) => [...prev, file]);
        setNewImagePreviews((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeExistingImage = (imageUrl) => {
    setRemovedImages((prev) => [...prev, imageUrl]);
    setExistingImages((prev) => prev.filter(img => img !== imageUrl));
  };

  const removeNewImage = (index) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
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

  const handleUpdateEvent = async () => {
    if (!validateForm()) {
      return;
    }

    const eventData = {
      ...formData,
      tags: formData.tags ? formData.tags.split(",").map((tag) => tag.trim()) : [],
      capacity: formData.capacity ? parseInt(formData.capacity) : 0,
      ticketPrice: formData.ticketPrice ? parseFloat(formData.ticketPrice) : 0,
      removedImages,
    };

    // Convert new images to base64 data URLs
    if (newImages.length > 0) {
      const imageDataURLs = await Promise.all(
        newImages.map(img => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(img);
          });
        })
      );
      eventData.newImages = imageDataURLs;
    }

    updateEvent(eventData);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Sidebar user={authUser} />
        </div>
        <div className="lg:col-span-3">
          <Link to={`/event/${id}`} className="inline-flex items-center gap-2 text-gray-600 hover:text-primary mb-4">
            <ArrowLeft size={20} />
            Back to Event
          </Link>
          <div className="bg-white rounded-lg shadow p-8 flex justify-center items-center min-h-[400px]">
            <Loader className="animate-spin h-12 w-12 text-primary" />
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Sidebar user={authUser} />
        </div>
        <div className="lg:col-span-3">
          <Link to="/events" className="inline-flex items-center gap-2 text-gray-600 hover:text-primary mb-4">
            <ArrowLeft size={20} />
            Back to Events
          </Link>
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">Event not found</p>
          </div>
        </div>
      </div>
    );
  }

  // Check if user is organizer
  if (authUser?._id !== event.organizer._id) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Sidebar user={authUser} />
        </div>
        <div className="lg:col-span-3">
          <Link to={`/event/${id}`} className="inline-flex items-center gap-2 text-gray-600 hover:text-primary mb-4">
            <ArrowLeft size={20} />
            Back to Event
          </Link>
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">You are not authorized to edit this event</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-1">
        <Sidebar user={authUser} />
      </div>

      <div className="lg:col-span-3">
        <Link to={`/event/${id}`} className="inline-flex items-center gap-2 text-gray-600 hover:text-primary mb-4">
          <ArrowLeft size={20} />
          Back to Event
        </Link>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-6">Edit Event</h3>

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
            <div className="grid grid-cols-2 gap-4">
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
                  Event Time <span className="text-red-500">*</span>
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
                placeholder="e.g., networking, alumni, tech"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Images
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors">
                  <Image size={20} />
                  <span>Upload Images</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              </div>

              {/* Existing Images */}
              {existingImages.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm text-gray-600 mb-2">Current Images:</p>
                  <div className="grid grid-cols-3 gap-3">
                    {existingImages.map((img, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={img}
                          alt={`Event image ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(img)}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Images Preview */}
              {newImagePreviews.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm text-gray-600 mb-2">New Images to Upload:</p>
                  <div className="grid grid-cols-3 gap-3">
                    {newImagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`New image ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeNewImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleUpdateEvent}
                disabled={isPending}
                className="flex-1 bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    Updating...
                  </>
                ) : (
                  "Update Event"
                )}
              </button>
              <button
                onClick={() => navigate(`/event/${id}`)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventEditPage;
