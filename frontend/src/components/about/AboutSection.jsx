import { useState } from "react"
import { axiosInstance } from "../../lib/axios"
import toast from "react-hot-toast"
import { Upload, File, Trash2, Loader, Download } from "lucide-react"
import ConfirmModal from "../common/ConfirmModal"
import { useQueryClient } from "@tanstack/react-query"

const AboutSection = ({ userData, isOwnProfile, onSave}) => {
  const [ isEditing, setIsEditing ] = useState(false)
  const [ about, setAbout ] = useState(userData.about || "")
  const [ isUploadingCV, setIsUploadingCV ] = useState(false)
  const [ showDeleteCVConfirm, setShowDeleteCVConfirm ] = useState(false)
  const [ isDeletingCV, setIsDeletingCV ] = useState(false)
  const queryClient = useQueryClient()

  const handleSave = () => {
    setIsEditing(false)
    onSave({ about })
  }

  const handleCVUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only PDF and DOCX files are allowed")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB")
      return
    }

    setIsUploadingCV(true)

    try {
      // Convert file to base64
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = async () => {
        try {
          const response = await axiosInstance.post('/users/cv/upload', {
            fileData: reader.result,
            fileName: file.name,
            mimeType: file.type
          })

          toast.success("CV uploaded successfully")
          
          // Invalidate queries to refresh data
          queryClient.invalidateQueries(["userProfile", userData.username])
          queryClient.invalidateQueries(["authUser"])
          queryClient.invalidateQueries(["profile", userData.username])
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to upload CV")
        } finally {
          setIsUploadingCV(false)
        }
      }
      reader.onerror = () => {
        toast.error("Failed to read file")
        setIsUploadingCV(false)
      }
    } catch (error) {
      toast.error("Failed to upload CV")
      setIsUploadingCV(false)
    }
  }

  const handleDeleteCV = async () => {
    setIsDeletingCV(true)
    try {
      await axiosInstance.delete('/users/cv/delete')
      toast.success("CV deleted successfully")
      
      setShowDeleteCVConfirm(false)
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries(["userProfile", userData.username])
      queryClient.invalidateQueries(["authUser"])
      queryClient.invalidateQueries(["profile", userData.username])
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete CV")
    } finally {
      setIsDeletingCV(false)
    }
  }

  return (
    <div className='bg-white shadow rounded-lg p-6 mb-6'>
			<h2 className='text-xl font-semibold mb-4'>About</h2>
			{isOwnProfile ? (
				isEditing ? (
					<>
						<textarea
							value={about}
							onChange={(e) => setAbout(e.target.value)}
							className='w-full p-2 border rounded'
							rows='4'
						/>
						<button
							onClick={handleSave}
							className='mt-2 bg-primary text-white py-2 px-4 rounded hover:bg-red-700 
							transition duration-300'
						>
							Save
						</button>
					</>
				) : (
					<>
						<p>{userData.about}</p>
						<button
							onClick={() => setIsEditing(true)}
							className='mt-2 text-primary hover:text-red-700 transition duration-300'
						>
							Edit
						</button>
					</>
				)
			) : (
				<p>{userData.about}</p>
			)}

      {/* CV Section */}
      <div className='mt-6 pt-6 border-t'>
        <h3 className='text-lg font-semibold mb-3'>Curriculum Vitae</h3>
        
        {userData.cvUrl ? (
          <div className='flex items-center justify-between p-4 bg-gray-50 rounded-lg border'>
            <div className='flex items-center gap-3'>
              <File className='text-primary' size={24} />
              <div>
                <p className='font-medium text-sm'>{userData.cvFileName || 'Resume.pdf'}</p>
                <p className='text-xs text-gray-500'>Uploaded CV</p>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <a
                href={userData.cvUrl}
                target='_blank'
                rel='noopener noreferrer'
                className='p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors'
                title='Download CV'
              >
                <Download size={20} />
              </a>
              {isOwnProfile && (
                <button
                  onClick={() => setShowDeleteCVConfirm(true)}
                  className='p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                  title='Delete CV'
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {isOwnProfile ? (
              <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center'>
                <label className='cursor-pointer flex flex-col items-center gap-2'>
                  {isUploadingCV ? (
                    <>
                      <Loader className='animate-spin h-8 w-8 text-primary' />
                      <span className='text-sm text-gray-600'>Uploading CV...</span>
                    </>
                  ) : (
                    <>
                      <Upload className='h-8 w-8 text-gray-400' />
                      <span className='text-sm text-gray-600'>
                        Click to upload your CV (PDF or DOCX, max 5MB)
                      </span>
                    </>
                  )}
                  <input
                    type='file'
                    accept='.pdf,.docx'
                    onChange={handleCVUpload}
                    disabled={isUploadingCV}
                    className='hidden'
                  />
                </label>
              </div>
            ) : (
              <p className='text-gray-500 text-sm'>No CV uploaded</p>
            )}
          </>
        )}
      </div>

      {/* Delete CV Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteCVConfirm}
        onClose={() => setShowDeleteCVConfirm(false)}
        onConfirm={handleDeleteCV}
        title="Delete CV"
        message="Are you sure you want to delete your CV? This action cannot be undone."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        isLoading={isDeletingCV}
        loadingText="Deleting..."
        confirmButtonClass="bg-red-500 hover:bg-red-600"
      />
		</div>
  )
}

export default AboutSection