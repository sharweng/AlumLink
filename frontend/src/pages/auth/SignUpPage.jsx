import React from 'react'
import SignUpForm from '../../components/auth/SignUpForm'
import { Link } from 'react-router-dom'

const SignUpPage = () => {
  return (
    <div className='min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8'>
        <div className='sm:mx-auto sm:w-full sm:max-w-md'>
            <img className='mx-auto h-36 w-auto' src="/alumniLinkNoWhite.png" alt="AlumniLinkLogo" />
            {/* h2 - tagline change it? */}
            <h2 className='text-center text-3xl font-extrabold text-gray-900'>
                Connect with familiar faces, AlumniLink
            </h2>
        </div>
        <div className='mt-8 sm:mx-auto sm:w-full sm:max-w-md shadow-md'>
            <div className='bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10'>
                <SignUpForm />
                
                <div className='mt-6'>
                    <div className='relative'>
                        <div className='absolute inset-0 flex items-center'>
                            <div className='w-full border-t border-gray-300'></div>
                        </div>
                        <div className='relative flex justify-center text-sm'>
                            <span className='px-2 bg-white text-gray-500'>Already in AlumniLink?</span>
                        </div>
                    </div>
                    <div className='mt-6'>
                        <Link to='/login' className='w-full flex justify-center py-2 px-4 border border-transparent rounden-md shadow-sm text-sm font-medium text-primary bg-white hover:bg-gray-50'>
                            Sign in
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    </div>
  )
}

export default SignUpPage