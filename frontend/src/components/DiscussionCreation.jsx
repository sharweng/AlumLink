import { axiosInstance } from "../lib/axios";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Image, FileText, Loader, X, Tag as TagIcon } from "lucide-react";

const DiscussionCreation = ({ onClose }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [files, setFiles] = useState([]);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [category, setCategory] = useState("General");
  const [errors, setErrors] = useState({ title: "", content: "", files: "" });

  const queryClient = useQueryClient();

  const categories = ['General', 'Technical', 'Career', 'Events', 'Help', 'Other'];

  const { mutate: createDiscussionMutation, isPending } = useMutation({
    mutationFn: async (discussionData) => {
      const res = await axiosInstance.post("/discussions/create", discussionData, {
        headers: { "Content-Type": "application/json" }
      });
      return res.data;
    },
    onSuccess: () => {
      resetForm();
      toast.success("Discussion created successfully");
      queryClient.invalidateQueries({ queryKey: ["discussions"] });
      if (onClose) onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to create discussion");
    }
  });

  const handleDiscussionCreation = async () => {
    // Reset errors
    const newErrors = { title: "", content: "", files: "" };
    let hasError = false;

    // Validate title
    if (!title.trim()) {
      newErrors.title = "Title is required";
      hasError = true;
    }

    // Validate content
    if (!content.trim()) {
      newErrors.content = "Content is required";
      hasError = true;
    }

    // Validate file sizes (25MB limit = 25 * 1024 * 1024 bytes)
    const maxFileSize = 25 * 1024 * 1024;
    const oversizedFiles = files.filter(file => file.size > maxFileSize);
    if (oversizedFiles.length > 0) {
      newErrors.files = `File "${oversizedFiles[0].name}" is larger than 25MB`;
      hasError = true;
    }

    setErrors(newErrors);

    if (hasError) {
      return;
    }

    try {
      const discussionData = { 
        title: title.trim(), 
        content: content.trim(),
        category,
        tags
      };

      // Convert images to base64
      if (images.length > 0) {
        const imageDataURLs = await Promise.all(
          images.map(img => readFileAsDataURL(img))
        );
        discussionData.images = imageDataURLs;
      }

      // Convert files to base64 with metadata
      if (files.length > 0) {
        const fileData = await Promise.all(
          files.map(async (file) => ({
            data: await readFileAsDataURL(file),
            name: file.name,
            type: file.type,
            size: file.size
          }))
        );
        discussionData.files = fileData;
      }

      createDiscussionMutation(discussionData);
    } catch (error) {
      console.error("Error in handleDiscussionCreation", error);
      toast.error("Failed to process files");
    }
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setImages([]);
    setImagePreviews([]);
    setFiles([]);
    setTags([]);
    setTagInput("");
    setCategory("General");
    setErrors({ title: "", content: "", files: "" });
  };

  const handleImageChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setImages([...images, ...selectedFiles]);
    
    selectedFiles.forEach(file => {
      readFileAsDataURL(file).then(preview => {
        setImagePreviews(prev => [...prev, preview]);
      });
    });
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles([...files, ...selectedFiles]);
    // Clear file error when new files are selected
    if (errors.files) {
      setErrors({ ...errors, files: "" });
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const removeFile = (index) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    
    // Clear error if all oversized files are removed
    const maxFileSize = 25 * 1024 * 1024;
    const hasOversizedFiles = updatedFiles.some(file => file.size > maxFileSize);
    if (!hasOversizedFiles) {
      setErrors({ ...errors, files: "" });
    }
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const readFileAsDataURL = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Create New Discussion</h3>
        {onClose && (
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        )}
      </div>

      {/* Title Input */}
      <div className="mb-4">
        <label className="block text-sm font-semibold mb-2">Title *</label>
        <input
          type="text"
          placeholder="Enter discussion title..."
          className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 ${
            errors.title 
              ? 'border-red-500 focus:ring-red-500' 
              : 'border-gray-300 focus:ring-primary'
          }`}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (errors.title) setErrors({ ...errors, title: "" });
          }}
        />
        {errors.title && (
          <p className="text-red-500 text-sm mt-1">{errors.title}</p>
        )}
      </div>

      {/* Category Selection */}
      <div className="mb-4">
        <label className="block text-sm font-semibold mb-2">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Content Textarea */}
      <div className="mb-4">
        <label className="block text-sm font-semibold mb-2">Content *</label>
        <textarea
          placeholder="Share your thoughts, ask questions, or start a discussion..."
          className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 resize-none min-h-[150px] ${
            errors.content 
              ? 'border-red-500 focus:ring-red-500' 
              : 'border-gray-300 focus:ring-primary'
          }`}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            if (errors.content) setErrors({ ...errors, content: "" });
          }}
        />
        {errors.content && (
          <p className="text-red-500 text-sm mt-1">{errors.content}</p>
        )}
      </div>

      {/* Tags Input */}
      <div className="mb-4">
        <label className="block text-sm font-semibold mb-2">Tags</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="Add a tag and press Enter..."
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagInputKeyDown}
          />
          <button
            type="button"
            onClick={addTag}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Add
          </button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span key={index} className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                <TagIcon size={14} />
                {tag}
                <button onClick={() => removeTag(tag)} className="ml-1 hover:text-red-600">
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Image Previews */}
      {imagePreviews.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2">Images</label>
          <div className="grid grid-cols-3 gap-2">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative">
                <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-32 object-cover rounded-lg" />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2">Attachments</label>
          <div className={`space-y-2 ${errors.files ? 'border-2 border-red-500 rounded-lg p-2' : ''}`}>
            {files.map((file, index) => {
              const fileSizeMB = file.size / (1024 * 1024);
              const isOversized = fileSizeMB > 25;
              return (
                <div 
                  key={index} 
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    isOversized ? 'bg-red-50 border border-red-300' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText size={20} className={isOversized ? "text-red-500" : "text-primary"} />
                    <div>
                      <p className={`text-sm font-medium ${isOversized ? 'text-red-600' : ''}`}>
                        {file.name}
                      </p>
                      <p className={`text-xs ${isOversized ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>
                        {fileSizeMB >= 1 
                          ? `${fileSizeMB.toFixed(2)} MB` 
                          : `${(file.size / 1024).toFixed(2)} KB`}
                        {isOversized && ' - Too large!'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <X size={18} />
                  </button>
                </div>
              );
            })}
          </div>
          {errors.files && (
            <p className="text-red-500 text-sm mt-1">{errors.files}</p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center mt-6">
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-primary hover:text-red-700 transition-colors cursor-pointer">
            <Image size={20} />
            <span>Add Images</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageChange}
            />
          </label>
          <label className="flex items-center gap-2 text-primary hover:text-red-700 transition-colors cursor-pointer">
            <FileText size={20} />
            <span>Add Files</span>
            <input
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </div>
        <div className="flex gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            className="bg-primary text-white rounded-lg px-6 py-2 hover:bg-red-700 transition-colors flex items-center gap-2"
            onClick={handleDiscussionCreation}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader className="size-5 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Discussion"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiscussionCreation;
