import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { axiosInstance } from "../lib/axios";
import ProfileHeader from "../components/ProfileHeader";
import AboutSection from "../components/AboutSection";
import ExperienceSection from "../components/ExperienceSection";
import EducationSection from "../components/EducationSection";
import SkillsSection from "../components/SkillsSection";

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
      queryClient.invalidateQueries(["authUser"]);
      queryClient.invalidateQueries(["userProfile", username]);
    }
  });

  if (isUserProfileLoading) return null

  const isOwnProfile = authUser?.username === userProfile.data.username;
  const userData = isOwnProfile ? authUser : userProfile.data;

  const handleSave = (updatedData, onDone) => {
    updateProfile(updatedData, {
      onSuccess: () => {
        if (onDone) onDone();
      }
    });
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <ProfileHeader userData={ userData } isOwnProfile={ isOwnProfile } onSave={ handleSave } isSaving={isSaving} />
      <AboutSection userData={ userData } isOwnProfile={ isOwnProfile } onSave={ handleSave } />
      <ExperienceSection userData={ userData } isOwnProfile={ isOwnProfile } onSave={ handleSave } />
      <EducationSection userData={ userData } isOwnProfile={ isOwnProfile } onSave={ handleSave } />
      <SkillsSection userData={ userData } isOwnProfile={ isOwnProfile } onSave={ handleSave } /> 
    </div>
  )
}

export default ProfilePage