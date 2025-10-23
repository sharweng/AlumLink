import { useState } from "react";
import { axiosInstance } from "../../lib/axios";
import toast from "react-hot-toast";

const SETTINGS_TABS = [
  { id: "email", label: "Change Email" },
  { id: "password", label: "Change Password" },
];

export function Sidebar({ activeTab, setActiveTab }) {
  return (
    <div className="space-y-2">
      {SETTINGS_TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`w-full text-left px-3 py-2 rounded-lg font-medium text-sm ${
            activeTab === tab.id
              ? 'bg-primary text-white shadow'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

const ChangeAccountSettings = ({ userData, activeTab, setActiveTab }) => {
  // If activeTab/setActiveTab are passed from parent, use them, else fallback to local state
  const [localTab, setLocalTab] = useState("email");
  const tab = activeTab || localTab;
  const setTab = setActiveTab || setLocalTab;

  const [email, setEmail] = useState(userData.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [currentPasswordError, setCurrentPasswordError] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  const handleEmailChange = async (e) => {
    e.preventDefault();
    if (!email) {
      setEmailError('Email is required');
      return;
    }
    setEmailError('');
    setIsSaving(true);
    try {
      await axiosInstance.put(`/users/${userData._id}`, { email });
      toast.success("Email updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update email");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    let hasError = false;
    if (!currentPassword) {
      setCurrentPasswordError('Current password is required');
      hasError = true;
    } else {
      setCurrentPasswordError('');
    }
    if (!newPassword) {
      setNewPasswordError('New password is required');
      hasError = true;
    } else {
      setNewPasswordError('');
    }
    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm new password');
      hasError = true;
    } else {
      setConfirmPasswordError('');
    }
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      hasError = true;
    }
    if (hasError) return;
    setIsSaving(true);
    try {
      await axiosInstance.put(`/users/${userData._id}`, {
        currentPassword,
        newPassword,
        confirmNewPassword: confirmPassword,
      });
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setCurrentPasswordError("");
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.error || "Failed to update password";
      if (msg === "Current password is incorrect") {
        setCurrentPasswordError(msg);
      } else {
        toast.error(msg);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      {tab === "email" && (
        <form onSubmit={handleEmailChange} className="mb-8">
          <label className="block mb-2 font-semibold">Change Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full p-2 border rounded mb-2 ${emailError ? 'border-red-500 bg-red-50' : ''}`}
          />
          {emailError && <div className="text-red-600 text-sm mb-2">{emailError}</div>}
          <button
            type="submit"
            className="bg-primary text-white px-4 py-2 rounded hover:bg-red-700 transition"
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Update Email"}
          </button>
        </form>
      )}
      {tab === "password" && (
        <form onSubmit={handlePasswordChange}>
          <label className="block mb-2 font-semibold">Change Password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={`w-full p-2 border rounded mb-2 ${currentPasswordError ? 'border-red-500 bg-red-50' : ''}`}
            placeholder="Current Password"
          />
          {currentPasswordError && <div className="text-red-600 text-sm mb-2">{currentPasswordError}</div>}
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={`w-full p-2 border rounded mb-2 ${newPasswordError ? 'border-red-500 bg-red-50' : ''}`}
            placeholder="New Password"
          />
          {newPasswordError && <div className="text-red-600 text-sm mb-2">{newPasswordError}</div>}
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`w-full p-2 border rounded mb-2 ${confirmPasswordError ? 'border-red-500 bg-red-50' : ''}`}
            placeholder="Confirm New Password"
          />
          {confirmPasswordError && <div className="text-red-600 text-sm mb-2">{confirmPasswordError}</div>}
          <button
            type="submit"
            className="bg-primary text-white px-4 py-2 rounded hover:bg-red-700 transition"
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Update Password"}
          </button>
        </form>
      )}
    </div>
  );
};

ChangeAccountSettings.Sidebar = function SidebarProxy(props) {
  // Proxy for sidebar, so parent can use it
  return <Sidebar {...props} />;
};

export default ChangeAccountSettings;