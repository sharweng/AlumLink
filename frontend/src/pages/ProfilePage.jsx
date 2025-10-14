import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { axiosInstance } from "../lib/axios";
import ProfileHeader from "../components/about/ProfileHeader";
import AboutSection from "../components/about/AboutSection";
import ExperienceSection from "../components/about/ExperienceSection";
import BatchCourseSection from "../components/about/BatchCourseSection";
import SkillsSection from "../components/about/SkillsSection";
import toast from "react-hot-toast";

const ProfilePage = () => {
  const { username } = useParams();
  const queryClient = useQueryClient(); 
  const authUser = queryClient.getQueryData(["authUser"]);

  const { data: userProfile, isLoading: isUserProfileLoading } = useQuery({
    queryKey: ["userProfile", username],
    queryFn: async () => axiosInstance.get(`/users/${username}`)
  });

  const { mutate: updateProfile, isPending: isSaving } = useMutation({
    mutationFn: async (updatedData) => {
      await axiosInstance.put(`/users/profile`, updatedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["userProfile", username]);
      toast.success("Profile updated successfully");
    }
  });

  if (isUserProfileLoading) return null

  const isOwnProfile = authUser?.username === userProfile.data.username;
  const userData = isOwnProfile ? authUser : userProfile.data;

  const handleSaveHeader = (updatedData, onDone) => {
    updateProfile(updatedData, {
      onSuccess: () => {
        if (onDone) onDone();
      }
    });
  }

  const handleSave = (updatedData) => {
		updateProfile(updatedData);
	};

  return (
    <div className="max-w-4xl mx-auto p-4">
      <ProfileHeader userData={ userData } isOwnProfile={ isOwnProfile } onSave={ handleSaveHeader } isSaving={isSaving} />
      <AboutSection userData={ userData } isOwnProfile={ isOwnProfile } onSave={ handleSave } />
      <ExperienceSection userData={ userData } isOwnProfile={ isOwnProfile } onSave={ handleSave } />
      <BatchCourseSection userData={ userData } />
      <SkillsSection userData={ userData } isOwnProfile={ isOwnProfile } onSave={ handleSave } /> 
    </div>
  )
}

export default ProfilePage