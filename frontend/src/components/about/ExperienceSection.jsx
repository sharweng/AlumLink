import { Briefcase, X } from "lucide-react";
import { useState } from "react";
import { formatDate } from "../../utils/dateUtils";
import toast from "react-hot-toast";


const ExperienceSection = ({ userData, isOwnProfile, onSave }) => {
	const [isEditing, setIsEditing] = useState(false);
	const [experiences, setExperiences] = useState(userData.experience || []);
	const [newExperience, setNewExperience] = useState({
		title: "",
		company: "",
		startDate: "",
		endDate: "",
		description: "",
		currentlyWorking: false,
	});
	const [editIdx, setEditIdx] = useState(null);
	const [editExperience, setEditExperience] = useState(null);

	const handleAddExperience = () => {
		// Required fields
		if (!newExperience.title || !newExperience.company || !newExperience.startDate || (!newExperience.currentlyWorking && !newExperience.endDate)) {
			toast.error("Please fill in all required fields: Title, Company, Start Date, and End Date if not currently working there.");
			return;
		}
		// Date logic
		if (!newExperience.currentlyWorking && newExperience.endDate < newExperience.startDate) {
			toast.error("End date cannot be earlier than start date.");
			return;
		}
		setExperiences([...experiences, newExperience]);
		setNewExperience({
			title: "",
			company: "",
			startDate: "",
			endDate: "",
			description: "",
			currentlyWorking: false,
		});
	};

	const handleDeleteExperience = (id) => {
		setExperiences(experiences.filter((exp) => exp._id !== id));
		setEditIdx(null);
		setEditExperience(null);
	};

	const handleSave = () => {
		const sorted = [...experiences].sort((a, b) => {
			if (!a.startDate) return 1;
			if (!b.startDate) return -1;
			return new Date(b.startDate) - new Date(a.startDate);
		});
		onSave({ experience: sorted });
		setExperiences(sorted);
		setIsEditing(false);
		setEditIdx(null);
		setEditExperience(null);
	};

	const handleCurrentlyWorkingChange = (e) => {
		setNewExperience({
			...newExperience,
			currentlyWorking: e.target.checked,
			endDate: e.target.checked ? "" : newExperience.endDate,
		});
	};

	return (
		<div className='bg-white shadow rounded-lg p-6 mb-6'>
			<h2 className='text-xl font-semibold mb-4'>Experience</h2>
			{experiences.length === 0 && !isEditing && (
				<p className='text-gray-500 text-center py-4'>No experience added yet.</p>
			)}
			
			{experiences.length > 0 && experiences.map((exp, idx) => (
				<div key={exp._id || idx} className='mb-4 flex justify-between items-start'>
					<div className='flex items-start'>
						<Briefcase size={20} className='mr-2 mt-1' />
						<div>
							{editIdx === idx ? (
								<>
									<input
										type='text'
										placeholder='Title*'
										value={editExperience.title}
										onChange={e => setEditExperience({ ...editExperience, title: e.target.value })}
										className='w-full p-2 border rounded mb-2'
									/>
									<input
										type='text'
										placeholder='Company*'
										value={editExperience.company}
										onChange={e => setEditExperience({ ...editExperience, company: e.target.value })}
										className='w-full p-2 border rounded mb-2'
									/>
									<input
										type='date'
										placeholder='Start Date*'
										value={editExperience.startDate}
										onChange={e => setEditExperience({ ...editExperience, startDate: e.target.value })}
										className='w-full p-2 border rounded mb-2'
									/>
									<div className='flex items-center mb-2'>
										<input
											type='checkbox'
											id={`currentlyWorking-edit-${idx}`}
											checked={editExperience.currentlyWorking}
											onChange={e => setEditExperience({ ...editExperience, currentlyWorking: e.target.checked, endDate: e.target.checked ? "" : editExperience.endDate })}
											className='mr-2  accent-red-500'
										/>
										<label htmlFor={`currentlyWorking-edit-${idx}`}>I currently work here</label>
									</div>
									{!editExperience.currentlyWorking && (
										<input
											type='date'
											placeholder='End Date*'
											value={editExperience.endDate}
											onChange={e => setEditExperience({ ...editExperience, endDate: e.target.value })}
											className='w-full p-2 border rounded mb-2'
										/>
									)}
									<textarea
										placeholder='Description'
										value={editExperience.description}
										onChange={e => setEditExperience({ ...editExperience, description: e.target.value })}
										className='w-full p-2 border rounded mb-2'
									/>
									<div className="flex gap-2 mt-2">
										<button
											className='bg-red-500 text-white py-1 px-3 rounded hover:bg-red-700 transition duration-300'
											onClick={() => {
												// Validation
												if (!editExperience.title || !editExperience.company || !editExperience.startDate || (!editExperience.currentlyWorking && !editExperience.endDate)) {
													toast.error("Please fill in all required fields: Title, Company, Start Date, and End Date if not currently working there.");
													return;
												}
												if (!editExperience.currentlyWorking && editExperience.endDate < editExperience.startDate) {
													toast.error("End date cannot be earlier than start date.");
													return;
												}
												const updated = experiences.map((e, i) => i === idx ? editExperience : e);
												setExperiences(updated);
												setEditIdx(null);
												setEditExperience(null);
											}}
										>Save</button>
										<button
											className='bg-gray-400 text-white py-1 px-3 rounded hover:bg-gray-600 transition duration-300'
											onClick={() => { setEditIdx(null); setEditExperience(null); }}
										>Cancel</button>
									</div>
								</>
							) : (
								<>
									<h3 className='font-semibold'>{exp.title}</h3>
									<p className='text-gray-600'>{exp.company}</p>
									<p className='text-gray-500 text-sm'>
										{formatDate(exp.startDate)} - {exp.endDate ? formatDate(exp.endDate) : "Present"}
									</p>
									<p className='text-gray-700'>{exp.description}</p>
								</>
							)}
						</div>
					</div>
					{isEditing && (
						<div className="flex gap-2">
							<button
								className='text-gray-500'
								onClick={() => {
									// Normalize values for edit form
									const normalizeDate = (date) => {
										if (!date) return "";
										// If already YYYY-MM-DD, return as is
										if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
										// Try to parse and format
										const d = new Date(date);
										if (!isNaN(d)) {
											return d.toISOString().slice(0, 10);
										}
										return "";
									};
									setEditIdx(idx);
									setEditExperience({
										...exp,
										startDate: normalizeDate(exp.startDate),
										endDate: normalizeDate(exp.endDate),
										currentlyWorking: exp.endDate ? !!exp.currentlyWorking : true
									});
								}}
								disabled={editIdx !== null}
							>Edit</button>
							<button onClick={() => handleDeleteExperience(exp._id)} className='text-red-500'>
								<X size={20} />
							</button>
						</div>
					)}
				</div>
			))}

			{isEditing && (
				<div className='mt-4'>
					<input
						type='text'
						placeholder='Title*'
						value={newExperience.title}
						onChange={(e) => setNewExperience({ ...newExperience, title: e.target.value })}
						className='w-full p-2 border rounded mb-2'
					/>
					<input
						type='text'
						placeholder='Company*'
						value={newExperience.company}
						onChange={(e) => setNewExperience({ ...newExperience, company: e.target.value })}
						className='w-full p-2 border rounded mb-2'
					/>
					<input
						type='date'
						placeholder='Start Date*'
						value={newExperience.startDate}
						onChange={(e) => setNewExperience({ ...newExperience, startDate: e.target.value })}
						className='w-full p-2 border rounded mb-2'
					/>
					<div className='flex items-center mb-2'>
						<input
							type='checkbox'
							id='currentlyWorking'
							checked={newExperience.currentlyWorking}
							onChange={handleCurrentlyWorkingChange}
							className='mr-2 accent-red-500'
						/>
						<label htmlFor='currentlyWorking'>I currently work here</label>
					</div>
					{!newExperience.currentlyWorking && (
						<input
							type='date'
							placeholder='End Date*'
							value={newExperience.endDate}
							onChange={(e) => setNewExperience({ ...newExperience, endDate: e.target.value })}
							className='w-full p-2 border rounded mb-2'
						/>
					)}
					<textarea
						placeholder='Description'
						value={newExperience.description}
						onChange={(e) => setNewExperience({ ...newExperience, description: e.target.value })}
						className='w-full p-2 border rounded mb-2'
					/>
					<div className="flex gap-2 mt-2">
						<button
							onClick={handleAddExperience}
							className='bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-700 transition duration-300'
						>
							Add Experience
						</button>
						<button
							onClick={handleSave}
							className='bg-primary text-white py-2 px-4 rounded hover:bg-red-700 transition duration-300'
						>
							Save Changes
						</button>
					</div>
				</div>
			)}

			{isOwnProfile && !isEditing && (
				<button
					onClick={() => setIsEditing(true)}
					className='mt-4 text-primary hover:text-red-700 transition duration-300'
				>
					Edit Experiences
				</button>
			)}
		</div>
	);
};
export default ExperienceSection;