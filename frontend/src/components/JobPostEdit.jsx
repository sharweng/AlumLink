import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';
import { X, Plus, Minus } from 'lucide-react';

const JobPostEdit = ({ jobPost, onClose }) => {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    type: 'job',
    workType: 'onsite',
    description: '',
    requirements: '',
    skills: [],
    salary: {
      min: '',
      max: '',
      currency: 'USD'
    },
    duration: '',
    applicationDeadline: '',
    applicationUrl: '',
    applicationEmail: '',
    isActive: true
  });

  const [currentSkill, setCurrentSkill] = useState('');
  const [errors, setErrors] = useState({});

  // Initialize form with existing data
  useEffect(() => {
    if (jobPost) {
      setFormData({
        title: jobPost.title || '',
        company: jobPost.company || '',
        location: jobPost.location || '',
        type: jobPost.type || 'job',
        workType: jobPost.workType || 'onsite',
        description: jobPost.description || '',
        requirements: jobPost.requirements || '',
        skills: jobPost.skills || [],
        salary: {
          min: jobPost.salary?.min || '',
          max: jobPost.salary?.max || '',
          currency: jobPost.salary?.currency || 'PHP'
        },
        duration: jobPost.duration || '',
        applicationDeadline: jobPost.applicationDeadline ? new Date(jobPost.applicationDeadline).toISOString().split('T')[0] : '',
        applicationUrl: jobPost.applicationUrl || '',
        applicationEmail: jobPost.applicationEmail || '',
        isActive: jobPost.isActive !== undefined ? jobPost.isActive : true
      });
    }
  }, [jobPost]);

  const { mutate: updateJobPost, isPending } = useMutation({
    mutationFn: async (jobData) => {
      const res = await axiosInstance.put(`/jobs/${jobPost._id}`, jobData);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Job post updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['jobPosts'] });
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update job post');
    }
  });

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = 'Job title is required';
    if (!formData.company.trim()) newErrors.company = 'Company name is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.description.trim()) newErrors.description = 'Job description is required';
    if (!formData.requirements.trim()) newErrors.requirements = 'Requirements are required';

    if (formData.salary.min && formData.salary.max && 
        parseInt(formData.salary.min) > parseInt(formData.salary.max)) {
      newErrors.salary = 'Minimum salary cannot be greater than maximum salary';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // Clean up the data before sending
    const cleanData = {
      ...formData,
      salary: {
        min: formData.salary.min ? parseInt(formData.salary.min) : undefined,
        max: formData.salary.max ? parseInt(formData.salary.max) : undefined,
        currency: formData.salary.currency
      }
    };

    // Remove empty fields
    Object.keys(cleanData).forEach(key => {
      if (cleanData[key] === '' || cleanData[key] === undefined) {
        delete cleanData[key];
      }
    });

    if (cleanData.salary && !cleanData.salary.min && !cleanData.salary.max) {
      delete cleanData.salary;
    }

    updateJobPost(cleanData);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSalaryChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      salary: {
        ...prev.salary,
        [field]: value
      }
    }));
    
    if (errors.salary) {
      setErrors(prev => ({ ...prev, salary: '' }));
    }
  };

  const addSkill = () => {
    if (currentSkill.trim() && !formData.skills.includes(currentSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, currentSkill.trim()]
      }));
      setCurrentSkill('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto'>
        <div className='sticky top-0 bg-white border-b p-6'>
          <div className='flex items-center justify-between'>
            <h2 className='text-xl font-bold '>Edit Job Post</h2>
            <button
              onClick={onClose}
              className='p-2 hover:bg-gray-100 rounded-full transition-colors'
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className='p-6 space-y-6'>
          {/* Status Toggle */}
          <div className='flex items-center gap-4'>
            <label className='flex items-center gap-2'>
              <input
                type='checkbox'
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className='w-4 h-4 border-gray-300 rounded '
              />
              <span className='text-sm font-medium text-gray-700'>Job post is active</span>
            </label>
          </div>

          {/* Basic Information */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Job Title *
              </label>
              <input
                type='text'
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder='e.g. Software Engineer, Marketing Intern'
              />
              {errors.title && <p className='text-red-500 text-sm mt-1'>{errors.title}</p>}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Company *
              </label>
              <input
                type='text'
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                  errors.company ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder='Company name'
              />
              {errors.company && <p className='text-red-500 text-sm mt-1'>{errors.company}</p>}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Location *
              </label>
              <input
                type='text'
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                  errors.location ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder='e.g. New York, NY or Remote'
              />
              {errors.location && <p className='text-red-500 text-sm mt-1'>{errors.location}</p>}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Job Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent'
              >
                <option value='job'>Full-time Job</option>
                <option value='part-time'>Part-time Job</option>
                <option value='internship'>Internship</option>
                <option value='freelance'>Freelance</option>
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Work Type
              </label>
              <select
                value={formData.workType}
                onChange={(e) => handleInputChange('workType', e.target.value)}
                className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent'
              >
                <option value='onsite'>On-site</option>
                <option value='remote'>Remote</option>
                <option value='hybrid'>Hybrid</option>
              </select>
            </div>

            {(formData.type === 'part-time' || formData.type === 'internship' || formData.type === 'freelance') && (
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Duration
                </label>
                <input
                  type='text'
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                  className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent'
                  placeholder='e.g. 3 months, 6 weeks'
                />
              </div>
            )}
          </div>

          {/* Salary */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Salary (Optional)
            </label>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
              <input
                type='number'
                value={formData.salary.min}
                onChange={(e) => handleSalaryChange('min', e.target.value)}
                className='p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent'
                placeholder='Min salary'
              />
              <input
                type='number'
                value={formData.salary.max}
                onChange={(e) => handleSalaryChange('max', e.target.value)}
                className='p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent'
                placeholder='Max salary'
              />
              <select
                value={formData.salary.currency}
                onChange={(e) => handleSalaryChange('currency', e.target.value)}
                className='p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent'
              >
                <option value='USD'>USD</option>
                <option value='EUR'>EUR</option>
                <option value='GBP'>GBP</option>
                <option value='PHP'>PHP</option>
                <option value='INR'>INR</option>
              </select>
            </div>
            {errors.salary && <p className='text-red-500 text-sm mt-1'>{errors.salary}</p>}
          </div>

          {/* Description */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Job Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder='Describe the role, responsibilities, and what makes this opportunity great...'
            />
            {errors.description && <p className='text-red-500 text-sm mt-1'>{errors.description}</p>}
          </div>

          {/* Requirements */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Requirements *
            </label>
            <textarea
              value={formData.requirements}
              onChange={(e) => handleInputChange('requirements', e.target.value)}
              rows={3}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                errors.requirements ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder='List the required qualifications, experience, education, etc...'
            />
            {errors.requirements && <p className='text-red-500 text-sm mt-1'>{errors.requirements}</p>}
          </div>

          {/* Skills */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Required Skills
            </label>
            <div className='flex gap-2 mb-2'>
              <input
                type='text'
                value={currentSkill}
                onChange={(e) => setCurrentSkill(e.target.value)}
                onKeyPress={handleKeyPress}
                className='flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent'
                placeholder='Type a skill and press Enter or click Add'
              />
              <button
                type='button'
                onClick={addSkill}
                className='px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors'
              >
                <Plus size={18} />
              </button>
            </div>
            {formData.skills.length > 0 && (
              <div className='flex flex-wrap gap-2'>
                {formData.skills.map((skill, index) => (
                  <span
                    key={index}
                    className='flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm'
                  >
                    {skill}
                    <button
                      type='button'
                      onClick={() => removeSkill(skill)}
                      className='hover:bg-red-200 rounded-full p-1'
                    >
                      <Minus size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Application Details */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Application URL
              </label>
              <input
                type='url'
                value={formData.applicationUrl}
                onChange={(e) => handleInputChange('applicationUrl', e.target.value)}
                className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent'
                placeholder='https://company.com/careers/apply'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Application Email
              </label>
              <input
                type='email'
                value={formData.applicationEmail}
                onChange={(e) => handleInputChange('applicationEmail', e.target.value)}
                className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent'
                placeholder='careers@company.com'
              />
            </div>

            <div className='md:col-span-2'>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Application Deadline (Optional)
              </label>
              <input
                type='date'
                value={formData.applicationDeadline}
                onChange={(e) => handleInputChange('applicationDeadline', e.target.value)}
                className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent'
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className='flex justify-end gap-3 pt-4 border-t'>
            <button
              type='button'
              onClick={onClose}
              className='px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={isPending}
              className='px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
            >
              {isPending && (
                <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
              )}
              {isPending ? 'Updating...' : 'Update Job Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobPostEdit;