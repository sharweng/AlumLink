import { GraduationCap } from "lucide-react"

const BatchCourseSection = ({ userData }) => {
  return (
    <div className='bg-white shadow rounded-lg p-6 mb-6'>
      <div className='flex items-center mb-4'>
        <h2 className='text-xl font-semibold flex items-center'>
          Academic Background
        </h2>
      </div>

      <div className='space-y-2'>
        {userData.batch || userData.course ? (
          <div className='flex items-center space-x-4'>
            {userData.batch && (
              <div className='bg-blue-50 px-3 py-1 rounded-full'>
                <span className='text-blue-700'>
                  Batch {userData.batch}
                </span>
              </div>
            )}
            {userData.course && (
              <div className='bg-green-50 px-3 py-1 rounded-full'>
                <span className='text-green-700'>
                  {userData.course}
                </span>
              </div>
            )}
          </div>
        ) : (
          <p className='text-gray-500'>
            No academic background information available
          </p>
        )}
      </div>
    </div>
  )
}

export default BatchCourseSection