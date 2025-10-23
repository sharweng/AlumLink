import React, { useState } from "react";
import { Form, Button } from "react-bootstrap";

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [errors, setErrors] = useState({});

  // Add state for password visibility
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // ...existing submit logic...
    // In error handling, if error message is 'Current password is incorrect', set errors.currentPassword to that message so it shows in red text.
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group>
        <Form.Label>Current Password</Form.Label>
        <div className="relative">
          <Form.Control
            type={showCurrentPassword ? "text" : "password"}
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            isInvalid={!!errors.currentPassword}
          />
          <button
            type="button"
            className="absolute right-2 top-2 text-xs"
            onClick={() => setShowCurrentPassword(v => !v)}
          >
            {showCurrentPassword ? "Hide" : "Show"}
          </button>
        </div>
        {errors.currentPassword && (
          <div className="text-red-500 text-sm mt-1">{errors.currentPassword}</div>
        )}
      </Form.Group>

      <Form.Group>
        <Form.Label>New Password</Form.Label>
        <div className="relative">
          <Form.Control
            type={showNewPassword ? "text" : "password"}
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            isInvalid={!!errors.newPassword}
          />
          <button
            type="button"
            className="absolute right-2 top-2 text-xs"
            onClick={() => setShowNewPassword(v => !v)}
          >
            {showNewPassword ? "Hide" : "Show"}
          </button>
        </div>
        {errors.newPassword && (
          <div className="text-red-500 text-sm mt-1">{errors.newPassword}</div>
        )}
      </Form.Group>

      <Form.Group>
        <Form.Label>Confirm New Password</Form.Label>
        <div className="relative">
          <Form.Control
            type={showConfirmNewPassword ? "text" : "password"}
            value={confirmNewPassword}
            onChange={e => setConfirmNewPassword(e.target.value)}
            isInvalid={!!errors.confirmNewPassword}
          />
          <button
            type="button"
            className="absolute right-2 top-2 text-xs"
            onClick={() => setShowConfirmNewPassword(v => !v)}
          >
            {showConfirmNewPassword ? "Hide" : "Show"}
          </button>
        </div>
        {errors.confirmNewPassword && (
          <div className="text-red-500 text-sm mt-1">{errors.confirmNewPassword}</div>
        )}
      </Form.Group>

      <Button type="submit">Change Password</Button>
    </Form>
  );
};

export default ChangePassword;