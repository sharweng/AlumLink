import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../../lib/axios";
import toast from "react-hot-toast";
import BanUnbanButton from "../common/BanUnbanButton";
import * as XLSX from 'xlsx';
import { Loader } from "lucide-react";

const AdminUsers = ({ users, authUser, updatePermissionMutation, toggleStatusMutation }) => {
  const queryClient = useQueryClient();
  const [userSearch, setUserSearch] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, percentage: 0 });
  const [importStartTime, setImportStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [processingBulkAction, setProcessingBulkAction] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showUnbanModal, setShowUnbanModal] = useState(false);
  const [showToggleStatusModal, setShowToggleStatusModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [importRole, setImportRole] = useState("student");
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [sendingEmails, setSendingEmails] = useState(false);

  // Mutation for updating user role
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }) => {
      const res = await axiosInstance.put(`/admin/users/${userId}/role`, { role });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["adminUsers"]);
      toast.success("Role updated successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update role");
    }
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === "text/csv" || 
                 file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
                 file.type === "application/vnd.ms-excel" ||
                 file.name.endsWith('.xlsx') ||
                 file.name.endsWith('.xls'))) {
      setImportFile(file);
    } else {
      toast.error("Please select a valid CSV or XLSX file");
    }
  };

  const parseCSV = (text) => {
    const lines = text.split('\n');
    const result = [];
    
    for (let i = 1; i < lines.length; i++) { // Skip header row
      const line = lines[i].trim();
      if (!line) continue;
      
      const columns = line.split(',');
      if (columns.length < 2) continue;
      
      const userData = {
        fullname: columns[1]?.trim(),      // Column 2 (index 1)
        tuptId: columns[2]?.trim(),         // Column 3 (index 2)
        email: columns[4]?.trim(),          // Column 5 (index 4)
        course: columns[6]?.trim(),         // Column 7 (index 6)
        experienceTitle: columns[8]?.trim(),    // Column 9 (index 8)
        experienceCompany: columns[9]?.trim(),  // Column 10 (index 9)
        experienceStartDate: columns[10]?.trim(), // Column 11 (index 10)
        experienceEndDate: columns[12]?.trim()    // Column 13 (index 12)
      };
      
      result.push(userData);
    }
    
    return result;
  };

  const parseXLSX = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length < 2) {
            reject(new Error("No data found in spreadsheet"));
            return;
          }
          
          // Get headers from first row
          const headers = jsonData[0].map(h => h?.toString().trim().toLowerCase() || '');
          
          // Find column indices by header names
          const findColumn = (possibleNames) => {
            for (const name of possibleNames) {
              const index = headers.findIndex(h => h.includes(name.toLowerCase()));
              if (index !== -1) return index;
            }
            return -1;
          };
          
          const nameCol = findColumn(['name', 'full name', 'fullname']);
          const tuptIdCol = findColumn(['tupt-id', 'tupt id', 'tuptid', 'id number']);
          const emailCol = findColumn(['tup email', 'email (tup)', 'tupemail']);
          const courseCol = findColumn(['course']);
          const jobTitleCol = findColumn(['position', 'job title', 'title']);
          const companyCol = findColumn(['company', 'organization']);
          const startDateCol = findColumn(['start work date', 'start date']);
          const endDateCol = findColumn(['end work date', 'end date']);
          
          const result = [];
          
          // Skip header row (index 0)
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row || row.length < 2) continue;
            
            // Helper function to parse dates from Excel
            const parseExcelDate = (value) => {
              if (!value) return '';
              
              // If it's already a valid date string
              if (typeof value === 'string') {
                const trimmed = value.trim();
                // Check if it's a valid date format (MM/DD/YYYY or similar)
                const dateRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
                if (dateRegex.test(trimmed)) {
                  return trimmed;
                }
                // Try to parse as date string
                const parsedDate = new Date(trimmed);
                if (!isNaN(parsedDate.getTime())) {
                  const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
                  const day = String(parsedDate.getDate()).padStart(2, '0');
                  const year = parsedDate.getFullYear();
                  return `${month}/${day}/${year}`;
                }
                return trimmed;
              }
              
              // If it's an Excel serial number
              if (typeof value === 'number') {
                // Excel stores dates as days since 1899-12-30 (not 1900-01-01 due to a bug)
                const excelEpoch = new Date(Date.UTC(1899, 11, 30));
                const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
                
                // Format as MM/DD/YYYY
                const month = String(date.getUTCMonth() + 1).padStart(2, '0');
                const day = String(date.getUTCDate()).padStart(2, '0');
                const year = date.getUTCFullYear();
                return `${month}/${day}/${year}`;
              }
              
              return '';
            };
            
            const userData = {
              fullname: nameCol !== -1 ? row[nameCol]?.toString().trim() || '' : '',
              tuptId: tuptIdCol !== -1 ? row[tuptIdCol]?.toString().trim() || '' : '',
              email: emailCol !== -1 ? row[emailCol]?.toString().trim().toLowerCase() || '' : '',
              course: courseCol !== -1 ? row[courseCol]?.toString().trim() || '' : '',
              experienceTitle: jobTitleCol !== -1 ? row[jobTitleCol]?.toString().trim() || '' : '',
              experienceCompany: companyCol !== -1 ? row[companyCol]?.toString().trim() || '' : '',
              experienceStartDate: startDateCol !== -1 ? parseExcelDate(row[startDateCol]) : '',
              experienceEndDate: endDateCol !== -1 ? parseExcelDate(row[endDateCol]) : '',
              role: '' // Will be set from modal selection
            };
            
            // Only add if we have at least name, tuptId, and email
            if (userData.fullname && userData.tuptId && userData.email) {
              result.push(userData);
            }
          }
          
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  };

  const handleImport = async () => {
    if (!importFile) {
      toast.error("Please select a file first");
      return;
    }

    setImporting(true);
    setImportProgress({ current: 0, total: 0, percentage: 0 });
    const startTime = Date.now();
    setImportStartTime(startTime);
    setElapsedTime(0);
    
    // Start elapsed time counter
    const timerInterval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    
    try {
      let users;
      
      // Check file type and parse accordingly
      if (importFile.name.endsWith('.xlsx') || importFile.name.endsWith('.xls')) {
        users = await parseXLSX(importFile);
      } else {
        // CSV parsing
        const text = await importFile.text();
        users = parseCSV(text);
      }
      
      if (users.length === 0) {
        toast.error("No valid user data found in file");
        clearInterval(timerInterval);
        setImporting(false);
        return;
      }

      // Add role to all users
      users = users.map(user => ({ ...user, role: importRole }));

      // Set initial progress
      setImportProgress({ current: 0, total: users.length, percentage: 0 });

      // Process users in batches to show progress
      const batchSize = 5; // Process 5 users at a time
      const batches = [];
      for (let i = 0; i < users.length; i += batchSize) {
        batches.push(users.slice(i, i + batchSize));
      }

      const allResults = {
        created: [],
        updated: [],
        errors: []
      };

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const response = await axiosInstance.post("/admin/users/import", { users: batch });
        const { results } = response.data;
        
        // Accumulate results
        allResults.created.push(...results.created);
        allResults.updated.push(...results.updated);
        allResults.errors.push(...results.errors);
        
        // Update progress
        const processed = Math.min((i + 1) * batchSize, users.length);
        const percentage = Math.round((processed / users.length) * 100);
        setImportProgress({ current: processed, total: users.length, percentage });
      }
      
      clearInterval(timerInterval);
      
      // Show results
      if (allResults.created.length > 0) {
        toast.success(`Created ${allResults.created.length} new user(s)`);
      }
      if (allResults.updated.length > 0) {
        toast.success(`Updated ${allResults.updated.length} existing user(s)`);
      }
      if (allResults.errors.length > 0) {
        toast.error(`${allResults.errors.length} error(s) occurred during import`);
        console.log("Import errors:", allResults.errors);
      }
      
      // Show info if no users were created or updated
      if (allResults.created.length === 0 && allResults.updated.length === 0) {
        if (allResults.errors.length > 0) {
          toast.error("No users were imported due to errors");
        } else {
          toast("No new or updated users. All data is already up to date.");
        }
      }
      
      // Refresh users list
      queryClient.invalidateQueries(["adminUsers"]);
      
      // Reset and close modal
      setImportFile(null);
      setImportRole("student");
      setShowImportModal(false);
      
    } catch (error) {
      clearInterval(timerInterval);
      console.error("Import error:", error);
      toast.error(error.response?.data?.message || "Failed to import users");
    } finally {
      setImporting(false);
    }
  };

  const toggleSelectUser = (userId) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const toggleSelectAll = () => {
    const selectableUsers = filteredUsers.filter(
      user => user._id !== authUser._id && !(user.permission === 'superAdmin' && authUser?.permission !== 'superAdmin')
    );
    
    if (selectedUsers.size > 0) {
      // If any users are selected, deselect all
      setSelectedUsers(new Set());
    } else {
      // If none are selected, select all selectable users
      const allIds = selectableUsers.map(user => user._id);
      setSelectedUsers(new Set(allIds));
    }
  };

  const handleBulkBan = async () => {
    if (selectedUsers.size === 0) return;

    setProcessingBulkAction(true);
    let successCount = 0;
    let errorCount = 0;

    for (const userId of selectedUsers) {
      try {
        await axiosInstance.put(`/admin/users/${userId}/ban`, { reason: "Bulk ban action" });
        successCount++;
      } catch (error) {
        console.error(`Failed to ban user ${userId}:`, error);
        errorCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`Successfully banned ${successCount} user(s)`);
    }
    if (errorCount > 0) {
      toast.error(`Failed to ban ${errorCount} user(s)`);
    }

    queryClient.invalidateQueries(["adminUsers"]);
    setSelectedUsers(new Set());
    setProcessingBulkAction(false);
    setShowBanModal(false);
  };

  const handleBulkUnban = async () => {
    if (selectedUsers.size === 0) return;

    setProcessingBulkAction(true);
    let successCount = 0;
    let errorCount = 0;

    for (const userId of selectedUsers) {
      try {
        await axiosInstance.put(`/admin/users/${userId}/unban`);
        successCount++;
      } catch (error) {
        console.error(`Failed to unban user ${userId}:`, error);
        errorCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`Successfully unbanned ${successCount} user(s)`);
    }
    if (errorCount > 0) {
      toast.error(`Failed to unban ${errorCount} user(s)`);
    }

    queryClient.invalidateQueries(["adminUsers"]);
    setSelectedUsers(new Set());
    setProcessingBulkAction(false);
    setShowUnbanModal(false);
  };

  const handleBulkToggleStatus = async () => {
    if (selectedUsers.size === 0) return;

    setProcessingBulkAction(true);
    let successCount = 0;
    let errorCount = 0;

    for (const userId of selectedUsers) {
      try {
        await axiosInstance.put(`/admin/users/${userId}/toggle-status`);
        successCount++;
      } catch (error) {
        console.error(`Failed to toggle status for user ${userId}:`, error);
        errorCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`Successfully toggled status for ${successCount} user(s)`);
    }
    if (errorCount > 0) {
      toast.error(`Failed to toggle status for ${errorCount} user(s)`);
    }

    queryClient.invalidateQueries(["adminUsers"]);
    setSelectedUsers(new Set());
    setProcessingBulkAction(false);
    setShowToggleStatusModal(false);
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.size === 0) return;
    
    if (!deletePassword) {
      toast.error("Please enter your password to confirm deletion");
      return;
    }

    setProcessingBulkAction(true);
    
    try {
      // Verify password first
      await axiosInstance.post('/auth/verify-password', { password: deletePassword });
      
      let successCount = 0;
      let errorCount = 0;

      for (const userId of selectedUsers) {
        try {
          await axiosInstance.delete(`/admin/users/${userId}`);
          successCount++;
        } catch (error) {
          console.error(`Failed to delete user ${userId}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully deleted ${successCount} user(s)`);
      }
      if (errorCount > 0) {
        toast.error(`Failed to delete ${errorCount} user(s)`);
      }

      queryClient.invalidateQueries(["adminUsers"]);
      setSelectedUsers(new Set());
      setShowDeleteModal(false);
      setDeletePassword("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid password. Deletion cancelled.");
    } finally {
      setProcessingBulkAction(false);
    }
  };

  const handleSendCredentialsEmails = async () => {
    if (selectedUsers.size === 0) return;

    setSendingEmails(true);

    try {
      const userIds = Array.from(selectedUsers);
      const response = await axiosInstance.post('/admin/users/send-credentials', { userIds });

      toast.success(response.data.message || `Emails sent successfully to ${response.data.successCount} user(s)`);
      
      if (response.data.errorCount > 0) {
        toast.error(`Failed to send ${response.data.errorCount} email(s). Check console for details.`);
        console.error('Email sending errors:', response.data.errors);
      }

      setSelectedUsers(new Set());
      setShowEmailModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send emails");
    } finally {
      setSendingEmails(false);
    }
  };



  // prepare sortedUsers: super-admins, admins, then users; each group sorted by TUPT-ID
  const sortedUsers = users
    ? [...users].sort((a, b) => {
        const rank = (u) =>
          u.permission === "superAdmin"
            ? 0
            : u.permission === "admin"
            ? 1
            : 2;
        const ra = rank(a);
        const rb = rank(b);
        if (ra !== rb) return ra - rb;
        
        // Within same permission level, sort by TUPT-ID
        const tuptA = a.tuptId || '';
        const tuptB = b.tuptId || '';
        return tuptA.localeCompare(tuptB);
      })
    : [];

  const filteredUsers = sortedUsers.filter(user => {
    const q = userSearch?.toLowerCase() || "";
    return (
      user.name.toLowerCase().includes(q) ||
      user.username.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      user.tuptId?.toLowerCase().includes(q)
    );
  });

  return (
    <>
      {/* Ban Confirmation Modal */}
      {showBanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Ban Users</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to ban <strong>{selectedUsers.size}</strong> user(s)?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowBanModal(false)}
                disabled={processingBulkAction}
                className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkBan}
                disabled={processingBulkAction}
                className="px-4 py-2 rounded bg-yellow-600 text-white hover:bg-yellow-700 disabled:opacity-50 flex items-center gap-2"
              >
                {processingBulkAction && <Loader className="animate-spin" size={16} />}
                {processingBulkAction ? "Banning" : "Ban Users"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unban Confirmation Modal */}
      {showUnbanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Unban Users</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to unban <strong>{selectedUsers.size}</strong> user(s)?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowUnbanModal(false)}
                disabled={processingBulkAction}
                className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkUnban}
                disabled={processingBulkAction}
                className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {processingBulkAction && <Loader className="animate-spin" size={16} />}
                {processingBulkAction ? "Unbanning" : "Unban Users"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Status Confirmation Modal */}
      {showToggleStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Toggle User Status</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to toggle the status (activate/deactivate) for <strong>{selectedUsers.size}</strong> user(s)?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowToggleStatusModal(false)}
                disabled={processingBulkAction}
                className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkToggleStatus}
                disabled={processingBulkAction}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {processingBulkAction && <Loader className="animate-spin" size={16} />}
                {processingBulkAction ? "Processing" : "Toggle Status"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal with Password */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4 text-red-600">Delete Users</h3>
            <div className="mb-6">
              <p className="text-gray-600 mb-2">
                You are about to <strong className="text-red-600">permanently delete {selectedUsers.size} user(s)</strong> and all their data.
              </p>
              <p className="text-sm text-red-600 font-semibold mb-4">
                This action cannot be undone!
              </p>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter your password to confirm:
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Your password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                disabled={processingBulkAction}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && deletePassword) {
                    handleBulkDelete();
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword("");
                }}
                disabled={processingBulkAction}
                className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={processingBulkAction || !deletePassword}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {processingBulkAction && <Loader className="animate-spin" size={16} />}
                {processingBulkAction ? "Deleting" : "Delete Users"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Credentials Confirmation Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Send Login Credentials</h3>
            <p className="text-gray-600 mb-4">
              Send login credentials email to <strong>{selectedUsers.size}</strong> selected user(s)?
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Email will include:</strong>
              </p>
              <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
                <li>Username</li>
                <li>TUP Email</li>
                <li>Auto-generated password</li>
                <li>Login link</li>
              </ul>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowEmailModal(false)}
                disabled={sendingEmails}
                className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSendCredentialsEmails}
                disabled={sendingEmails}
                className="px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
              >
                {sendingEmails && <Loader className="animate-spin" size={16} />}
                {sendingEmails ? "Sending..." : "Send Emails"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Import Users from CSV/XLSX</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">
                Upload a CSV or XLSX file exported from Google Forms. The system will automatically detect columns by their headers:
              </p>
              <ul className="text-xs text-gray-500 space-y-1 mb-4">
                <li><strong>Name / Full Name:</strong> Required ✓</li>
                <li><strong>TUPT-ID / ID Number:</strong> Required ✓ (Format: TUPT-XX-XXXX)</li>
                <li><strong>TUP Email:</strong> Required ✓</li>
                <li><strong>Course:</strong> Optional</li>
                <li><strong>Position / Job Title:</strong> Optional</li>
                <li><strong>Company / Organization:</strong> Optional</li>
                <li><strong>Start Work Date / Start Date:</strong> Optional</li>
                <li><strong>End Work Date / End Date:</strong> Optional</li>
              </ul>
              <p className="text-xs text-gray-500 mb-4">
                <strong>Note:</strong> Username will be auto-generated (first letters + last name). 
                Password will be last name + last 4 digits of TUPT-ID (e.g., "marbella1119"). 
                Batch will be extracted from TUPT-ID (e.g., TUPT-20-0563 → Batch 2020).
                Names with commas will be repositioned (e.g., "Marbella, Sharwin John" → "Sharwin John Marbella").
              </p>
              
              {/* Role Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select User Role:
                </label>
                <select
                  value={importRole}
                  onChange={(e) => setImportRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={importing}
                >
                  <option value="student">Student</option>
                  <option value="alumni">Alumni</option>
                </select>
              </div>

              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
              />
              {importFile && (
                <p className="text-sm text-green-600 mt-2">
                  Selected: {importFile.name}
                </p>
              )}
              
              {/* Progress Indicator */}
              {importing && importProgress.total > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-gray-700">
                      Processing: {importProgress.current} / {importProgress.total} users
                    </span>
                    <span className="font-bold text-primary">
                      {importProgress.percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-primary h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${importProgress.percentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-500">
                      Time elapsed: {elapsedTime}s
                    </p>
                    <p className="text-xs text-gray-500">
                      Please wait...
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                  setImportRole("student");
                }}
                disabled={importing}
                className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!importFile || importing}
                className="px-4 py-2 rounded bg-primary text-white hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
              >
                {importing && <Loader className="animate-spin" size={16} />}
                {importing ? "Importing" : "Import"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">All Users</h2>
          <div className="flex items-center gap-2">
            {selectedUsers.size > 0 && (
              <>
                <span className="text-sm text-gray-600 mr-2">
                  {selectedUsers.size} selected
                </span>
                <button
                  type="button"
                  className="px-3 py-1 rounded bg-yellow-100 hover:bg-yellow-200 border border-yellow-300 text-yellow-700 text-sm disabled:opacity-50"
                  onClick={() => setShowBanModal(true)}
                  disabled={processingBulkAction}
                  title="Ban selected users"
                >
                  Ban
                </button>
                <button
                  type="button"
                  className="px-3 py-1 rounded bg-green-100 hover:bg-green-200 border border-green-300 text-green-700 text-sm disabled:opacity-50"
                  onClick={() => setShowUnbanModal(true)}
                  disabled={processingBulkAction}
                  title="Unban selected users"
                >
                  Unban
                </button>
                <button
                  type="button"
                  className="px-3 py-1 rounded bg-blue-100 hover:bg-blue-200 border border-blue-300 text-blue-700 text-sm disabled:opacity-50"
                  onClick={() => setShowToggleStatusModal(true)}
                  disabled={processingBulkAction}
                  title="Toggle active/inactive status"
                >
                  Toggle Status
                </button>
                <button
                  type="button"
                  className="px-3 py-1 rounded bg-purple-100 hover:bg-purple-200 border border-purple-300 text-purple-700 text-sm disabled:opacity-50"
                  onClick={() => setShowEmailModal(true)}
                  disabled={processingBulkAction}
                  title="Send login credentials to selected users"
                >
                  Email
                </button>
                {authUser?.permission === 'superAdmin' && (
                  <button
                    type="button"
                    className="px-3 py-1 rounded bg-red-100 hover:bg-red-200 border border-red-300 text-red-700 text-sm font-semibold disabled:opacity-50"
                    onClick={() => setShowDeleteModal(true)}
                    disabled={processingBulkAction}
                    title="Permanently delete selected users"
                  >
                    Delete
                  </button>
                )}
              </>
            )}
            <input
              type="search"
              placeholder="Search users"
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              className="border rounded px-3 py-1 min-w-0 w-48"
            />
            <button
              type="button"
              className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 border text-gray-700 flex items-center"
              onClick={() => queryClient.invalidateQueries(["adminUsers"])}
              title="Refresh users"
            >
              Refresh
            </button>
            {authUser?.permission === 'superAdmin' && (
              <button
                type="button"
                className="px-3 py-1 rounded bg-primary hover:bg-primary/90 text-white flex items-center"
                onClick={() => setShowImportModal(true)}
                title="Import users from CSV/XLSX"
              >
                Import Users
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left w-12">
                  <input
                    type="checkbox"
                    checked={
                      filteredUsers.filter(u => u._id !== authUser._id && !(u.permission === 'superAdmin' && authUser?.permission !== 'superAdmin')).length > 0 &&
                      selectedUsers.size === filteredUsers.filter(u => u._id !== authUser._id && !(u.permission === 'superAdmin' && authUser?.permission !== 'superAdmin')).length
                    }
                    onChange={toggleSelectAll}
                    className="w-4 h-4 cursor-pointer"
                    title="Select all"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                  User
                </th>
                <th className="px-8 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                  TUPT-ID
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                  Role
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                  Permission
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                  Status
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 w-12">
                    {user._id !== authUser._id && !(user.permission === 'superAdmin' && authUser?.permission !== 'superAdmin') && (
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(user._id)}
                        onChange={() => toggleSelectUser(user._id)}
                        className="w-4 h-4 cursor-pointer"
                      />
                    )}
                  </td>
                  <td className="px-6 py-4 w-1/4">
                    <div className="flex items-center group" title={`${user.name} — ${user.email}`}>
                      <a href={`/profile/${user.username}`} className="block">
                        <img
                          className="h-8 w-8 rounded-full flex-shrink-0 hover:ring-2 hover:ring-primary transition"
                          src={user.profilePicture || "/avatar.png"}
                          alt={user.name}
                        />
                      </a>
                      <div className="ml-3 min-w-0 flex-1 relative">
                        <a href={`/profile/${user.username}`} className="text-sm font-medium text-gray-900 truncate">
                          {user.name}
                        </a>
                        <div
                          className="text-xs text-gray-500 truncate"
                          title={`@${user.username}`}
                        >
                          @{user.username}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4 w-1/4 text-center">
                    {authUser?.permission === 'superAdmin' ? (
                      <input
                        type="text"
                        className="px-2 py-1 w-full text-center bg-transparent outline-none"
                        style={{ minWidth: '160px' }}
                        defaultValue={user.tuptId}
                        onBlur={e => {
                          if (e.target.value !== user.tuptId) {
                            axiosInstance.put(`/users/${user._id}`, { tuptId: e.target.value })
                              .then(() => { toast.success('TUPT-ID updated'); queryClient.invalidateQueries(["adminUsers"]); })
                              .catch(() => toast.error('Failed to update TUPT-ID'));
                          }
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.target.blur();
                          }
                        }}
                      />
                    ) : (
                      <span className="text-sm text-gray-900 truncate" style={{ minWidth: '160px', display: 'inline-block' }} title={user.tuptId}>{user.tuptId}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 w-1/6 text-center">
                    {(authUser?.permission === 'admin' || authUser?.permission === 'superAdmin') && user._id !== authUser?._id && !(user.permission === 'superAdmin' && authUser?.permission !== 'superAdmin') ? (
                      <select
                        value={user.role || 'student'}
                        onChange={(e) => updateRoleMutation.mutate({ userId: user._id, role: e.target.value })}
                        disabled={updateRoleMutation.isPending}
                        className={`w-24 px-2 py-1 text-xs leading-5 font-semibold rounded-full border text-center ${
                          user.role === 'alumni' ? 'bg-green-100 text-green-800 border-green-300' : 
                          user.role === 'staff' ? 'bg-purple-100 text-purple-800 border-purple-300' : 
                          'bg-blue-100 text-blue-800 border-blue-300'
                        } cursor-pointer hover:opacity-80`}
                      >
                        <option value="student">Student</option>
                        <option value="alumni">Alumni</option>
                        <option value="staff">Staff</option>
                      </select>
                    ) : (
                      <span className={`w-24 px-2 py-1 inline-flex justify-center text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'alumni' ? 'bg-green-100 text-green-800' : 
                        user.role === 'staff' ? 'bg-purple-100 text-purple-800' : 
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Student'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 w-1/6 text-center">
                    {(authUser?.permission === 'admin' || authUser?.permission === 'superAdmin') && user._id !== authUser?._id && !(user.permission === 'superAdmin' && authUser?.permission !== 'superAdmin') ? (
                      <select
                        value={user.permission}
                        onChange={(e) => updatePermissionMutation.mutate({ userId: user._id, permission: e.target.value })}
                        disabled={updatePermissionMutation.isPending}
                        className={`w-24 px-2 py-1 text-xs leading-5 font-semibold rounded-full border text-center ${
                          user.permission === 'superAdmin' ? 'bg-purple-100 text-purple-800 border-purple-300' : user.permission === 'admin' ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-gray-100 text-gray-800 border-gray-300'
                        } cursor-pointer hover:opacity-80`}
                      >
                        <option value="regular">Regular</option>
                        <option value="admin">Admin</option>
                        {authUser?.permission === 'superAdmin' && <option value="superAdmin">Admin+</option>}
                      </select>
                    ) : (
                      <span className={`w-24 px-2 py-1 inline-flex justify-center text-xs leading-5 font-semibold rounded-full ${
                        user.permission === 'superAdmin'
                          ? 'bg-purple-100 text-purple-800'
                          : user.permission === 'admin'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.permission === 'superAdmin' ? 'Admin+' : user.permission === 'admin' ? 'Admin' : 'Regular'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 w-1/6 text-center">
                    <span className={`w-24 px-2 py-1 inline-flex justify-center text-xs leading-5 font-semibold rounded-full ${
                      !user.isActive
                        ? 'bg-red-100 text-red-800'
                        : user.banned
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                    }`}>
                      {!user.isActive
                        ? 'Inactive'
                        : user.banned
                          ? 'Banned'
                          : 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium w-1/12 text-center h-24">
                    {user._id !== authUser._id && !(user.permission === 'superAdmin' && authUser?.permission !== 'superAdmin') ? (
                      <div className="flex flex-col gap-1 items-center justify-center h-full">
                        <button
                          onClick={() => toggleStatusMutation.mutate(user._id)}
                          disabled={toggleStatusMutation.isPending}
                          className={`w-24 px-3 py-1 rounded text-xs ${
                            user.isActive
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          } transition-colors disabled:opacity-50`}
                        >
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <BanUnbanButton user={user} />
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        {/* Empty placeholder to maintain height */}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default AdminUsers;