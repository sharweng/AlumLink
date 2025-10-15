import { axiosInstance } from "../../lib/axios"
import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { Image, Loader } from "lucide-react"

const PostCreation = ({ user }) => {
  const [content, setContent] = useState("")
  const [image, setImage] = useState("")
  const [imagePreview, setImagePreview] = useState("")
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
      if (!content.trim() && !image) {
        setShowError(true);
        return;
      }

      const postData = { content }
      if (image) postData.image = await readFileAsDataURL(image)

      createPostMutation(postData)
    } catch (error) {
      console.error("Error in handlePostCreation", error)
    }
  }

  const resetForm = () => {
    setContent("")
    setImage(null)
    setImagePreview(null)
    setShowError(false)
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    setImage(file)
    if(file){
      readFileAsDataURL(file).then(setImagePreview)
      setShowError(false) // Clear error when image is added
    }else{
      setImagePreview(null)
    }
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
              showError && !content.trim() && !image ? 'border-2 border-red-500' : ''
            }`}
            value={ content }
            onChange={(e) => {
              setContent(e.target.value)
              if (e.target.value.trim()) setShowError(false) // Clear error when typing
            }} />
          {showError && !content.trim() && !image && (
            <p className="text-red-500 text-sm mt-1">Content is required if no image is provided</p>
          )}
        </div>
      </div>
      { imagePreview && (
        <div className="mt-4">
          <img src={ imagePreview } alt="Selected" className="w-full h-auto rounded-lg" />
        </div>
      )}

      <div className="flex justify-between items-center mt-4">
        <div className="flex flex-col">
          <div className="flex space-x-4">
            <label className={`flex items-center text-info hover:text-info-dark transition-colors duration-200 cursor-pointer ${
              showError && !content.trim() && !image ? 'text-red-500 font-semibold' : ''
            }`}>
              <Image size={20} className="mr-2" />
              <span>Photo</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
          </div>
          {showError && !content.trim() && !image && (
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