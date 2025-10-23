import { useState } from "react";
import { axiosInstance } from "../../lib/axios";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";

const BanUnbanButton = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const isBanned = user.banned;
  // Use React Query's queryClient to refetch users after ban/unban
  const queryClient = useQueryClient();

  const handleBanUnban = async () => {
    setLoading(true);
    try {
      await axiosInstance.put(`/users/${user._id}`, { banned: !isBanned });
      toast.success(isBanned ? "User unbanned" : "User banned");
  queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    } catch (err) {
      toast.error("Failed to update user status");
    }
    setLoading(false);
  };

  return (
    <button
      className={`w-24 px-3 py-1 rounded text-xs transition-colors disabled:opacity-50 ${
        isBanned
          ? 'bg-green-100 text-green-700 hover:bg-green-200'
          : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
      }`}
      onClick={handleBanUnban}
      disabled={loading}
    >
      {loading ? "Processing..." : isBanned ? "Unban" : "Ban"}
    </button>
  );
};

export default BanUnbanButton;
