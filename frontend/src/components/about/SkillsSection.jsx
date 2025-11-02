import { X } from "lucide-react"
import { useState } from "react"
import toast from "react-hot-toast"

const SkillsSection = ({ userData, isOwnProfile, onSave }) => {
  const [ isEditing, setIsEditing ] = useState(false)
  const [ skills, setSkills ] = useState(userData.skills || [])
  const [ newSkill, setNewSkill ] = useState("")

	const handleAddSkill = () => {
		if (!newSkill) return;
		if (skills.map(s => s.toLowerCase()).includes(newSkill.toLowerCase())) {
			toast.error("Skill already exists.");
			return;
		}
		setSkills([...skills, newSkill])
		setNewSkill("")
	}

  const handleDeleteSkill = (skillToDelete) => {
    setSkills(skills.filter((skill) => skill !== skillToDelete))
  }

	const handleSave = () => {
		const sortedSkills = [...skills].sort((a, b) => a.localeCompare(b));
		onSave({ skills: sortedSkills })
		setSkills(sortedSkills)
		setIsEditing(false)
	}

  return (
    <div className='bg-white shadow rounded-lg p-6'>
			<h2 className='text-xl font-semibold mb-4'>Skills</h2>
			
			{skills.length === 0 && !isEditing && (
				<p className='text-gray-500 text-center py-4'>No skills added yet.</p>
			)}
			
			{skills.length > 0 && (
				<div className='flex flex-wrap'>
					{skills.map((skill, index) => (
						<span
							key={index}
							className='bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm mr-2 mb-2 flex items-center'
						>
							{skill}
							{isEditing && (
								<button onClick={() => handleDeleteSkill(skill)} className='ml-2 text-red-500'>
									<X size={14} />
								</button>
							)}
						</span>
					))}
				</div>
			)}

			{isEditing && (
				<div className='mt-4 flex'>
								<input
									type='text'
									placeholder='New Skill'
									value={newSkill}
									onChange={(e) => setNewSkill(e.target.value)}
									onKeyDown={e => {
										if (e.key === "Enter") {
											e.preventDefault();
											handleAddSkill();
										}
									}}
									className='flex-grow p-2 border rounded-l'
								/>
					<button
						onClick={handleAddSkill}
						className='bg-primary text-white py-2 px-4 rounded-r hover:bg-red-700 transition duration-300'
					>
						Add Skill
					</button>
				</div>
			)}

			{isOwnProfile && (
				<>
					{isEditing ? (
						<button
							onClick={handleSave}
							className='mt-4 bg-primary text-white py-2 px-4 rounded hover:bg-red-700 transition duration-300'
						>
							Save Changes
						</button>
					) : (
						<button
							onClick={() => setIsEditing(true)}
							className='mt-4 text-primary hover:text-red-700 transition duration-300'
						>
							Edit Skills
						</button>
					)}
				</>
			)}
		</div>
  )
}

export default SkillsSection