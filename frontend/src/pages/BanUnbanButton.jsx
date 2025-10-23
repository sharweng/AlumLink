import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

const BanUnbanButton = ({ user }) => {
  const queryClient = useQueryClient();
  const isBanned = user.banned;
  const isPending = false;

  const { mutate: banUser, isPending: isBanning } = useMutation({
    mutationFn: async () => {
      await axiosInstance.put(`/admin/users/${user._id}/ban`, { reason: "" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      toast.success("User banned");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to ban user");
    },
  });

  const { mutate: unbanUser, isPending: isUnbanning } = useMutation({
    mutationFn: async () => {
      await axiosInstance.put(`/admin/users/${user._id}/unban`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      toast.success("User unbanned");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to unban user");
    },
  });

  return (
    <button
      onClick={() => (isBanned ? unbanUser() : banUser())}
      disabled={isBanning || isUnbanning}
      className={`w-24 px-3 py-1 rounded text-xs transition-colors disabled:opacity-50 ${
        isBanned
          ? "bg-green-100 text-green-700 hover:bg-green-200"
          : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
      }`}
      title={isBanned ? "Unban user" : "Ban user"}
    >
      {isBanned ? (isUnbanning ? "Unbanning..." : "Unban") : isBanning ? "Banning..." : "Ban"}
    </button>
  );
};

export default BanUnbanButton;