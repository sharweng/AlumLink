import { axiosInstance } from "../../lib/axios"
import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { Image, Loader, X } from "lucide-react"

const PostCreation = ({ user }) => {
  const [content, setContent] = useState("")
  const [images, setImages] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [showError, setShowError] = useState(false)

  const queryClient = useQueryClient()

  const { mutate: createPostMutation, isPending } = useMutation({
    mutationFn: async (postData) => {
      const res = await axiosInstance.post("/posts/create", postData, {
        headers:{ "Content-Type ": "application/json" }
      })
      return res.data
    },
    onSuccess: () => {
      resetForm()
      toast.success("Post created successfully")
      queryClient.invalidateQueries({ queryKey: ["posts"] })
    },
    onError: (error) => {
      toast.error(error.response.data.message || "Failed to create post")
    }
  })

  const handlePostCreation = async () => {
    try {
      // Validation: require at least content or image
      if (!content.trim() && images.length === 0) {
        setShowError(true);
        return;
      }

      const postData = { content }
      
      if (images.length > 0) {
        const imageDataURLs = await Promise.all(images.map(img => readFileAsDataURL(img)));
        postData.images = imageDataURLs;
      }

      createPostMutation(postData)
    } catch (error) {
      console.error("Error in handlePostCreation", error)
    }
  }

  const resetForm = () => {
    setContent("")
    setImages([])
    setImagePreviews([])
    setShowError(false)
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    setImages([...images, ...files])
    
    files.forEach(file => {
      readFileAsDataURL(file).then(preview => {
        setImagePreviews(prev => [...prev, preview])
      })
    })
    
    if(files.length > 0){
      setShowError(false) // Clear error when image is added
    }
  }

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index))
    setImagePreviews(imagePreviews.filter((_, i) => i !== index))
  }

  const readFileAsDataURL = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  return (
    <div className="bg-secondary rounded-lg shadow mb-4 p-4">
      <div className="flex space-x-3">
        <img src={ user.profilePicture || "/avatar.png" } alt={ user.name } className="w-12 h-12 rounded-full" />
        <div className="flex-1">
          <textarea placeholder="What's on your mind?"
            className={`w-full p-3 rounded-lg bg-base-100 hover:bg-base-200 focus:bg-base-200 focus:outline-none resize-none transition-colors duration-200 min-h-[100px] ${
              showError && !content.trim() && images.length === 0 ? 'border-2 border-red-500' : ''
            }`}
            value={ content }
            onChange={(e) => {
              setContent(e.target.value)
              if (e.target.value.trim()) setShowError(false) // Clear error when typing
            }} />
          {showError && !content.trim() && images.length === 0 && (
            <p className="text-red-500 text-sm mt-1">Content is required if no image is provided</p>
          )}
        </div>
      </div>
      
      {/* Image Previews */}
      {imagePreviews.length > 0 && (
        <div className="mt-4 grid grid-cols-3 md:grid-cols-4 gap-2">
          {imagePreviews.map((preview, index) => (
            <div key={index} className="relative group aspect-square">
              <img 
                src={preview} 
                alt={`Preview ${index + 1}`} 
                className="w-full h-full object-cover rounded-lg"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center mt-4">
        <div className="flex flex-col">
          <div className="flex space-x-4">
            <label className={`flex items-center text-info hover:text-info-dark transition-colors duration-200 cursor-pointer ${
              showError && !content.trim() && images.length === 0 ? 'text-red-500 font-semibold' : ''
            }`}>
              <Image size={20} className="mr-2" />
              <span>Photo</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
            </label>
          </div>
          {showError && !content.trim() && images.length === 0 && (
            <p className="text-red-500 text-sm mt-1">Or add a photo</p>
          )}
        </div>
        <button 
          className="bg-primary text-white rounded-lg px-4 py-2 hover:bg-red-700 transition-colors duration-200"
          onClick={handlePostCreation} 
          disabled={isPending}
        >
          { isPending ? <Loader className="size-5 animate-spin" /> : "Upload"}
        </button>
      </div>
    </div>
  )
}

export default PostCreation 