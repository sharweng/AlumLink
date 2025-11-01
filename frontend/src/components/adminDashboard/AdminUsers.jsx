import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../../lib/axios";
import toast from "react-hot-toast";
import BanUnbanButton from "../common/BanUnbanButton";
import * as XLSX from 'xlsx';

const AdminUsers = ({ users, authUser, updatePermissionMutation, toggleStatusMutation }) => {
  const queryClient = useQueryClient();
  const [userSearch, setUserSearch] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);

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
          
          const result = [];
          
          // Skip header row (index 0)
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row || row.length < 2) continue;
            
            // Based on your Google Forms structure:
            // A(0): Timestamp, B(1): Name, C(2): TUPT-ID, D(3): Personal Email
            // E(4): TUP Email, F(5): Contact, G(6): Course, H(7): Employment Status
            // I(8): Position/Job Title, J(9): Company, K(10): Start Date, 
            // L(11): Working Present, M(12): End Date, N(13): Type of Work Setup
            
            const userData = {
              fullname: row[1]?.toString().trim() || '',
              tuptId: row[2]?.toString().trim() || '',
              email: row[4]?.toString().trim() || '',
              course: row[6]?.toString().trim() || '',
              experienceTitle: row[8]?.toString().trim() || '',
              experienceCompany: row[9]?.toString().trim() || '',
              experienceStartDate: row[10]?.toString().trim() || '',
              experienceEndDate: row[12]?.toString().trim() || ''
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
        setImporting(false);
        return;
      }

      const response = await axiosInstance.post("/admin/users/import", { users });
      
      const { results } = response.data;
      
      // Show results
      if (results.created.length > 0) {
        toast.success(`Created ${results.created.length} new user(s)`);
      }
      if (results.updated.length > 0) {
        toast.success(`Updated ${results.updated.length} existing user(s)`);
      }
      if (results.errors.length > 0) {
        toast.error(`${results.errors.length} error(s) occurred during import`);
        console.log("Import errors:", results.errors);
      }
      
      // Refresh users list
      queryClient.invalidateQueries(["adminUsers"]);
      
      // Reset and close modal
      setImportFile(null);
      setShowImportModal(false);
      
    } catch (error) {
      console.error("Import error:", error);
      toast.error(error.response?.data?.message || "Failed to import users");
    } finally {
      setImporting(false);
    }
  };



  // prepare sortedUsers: super-admins, admins, then users; each group newest-first
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
        return new Date(b.createdAt) - new Date(a.createdAt);
      })
    : [];

  return (
    <>
      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Import Users from CSV/XLSX</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">
                Upload a CSV or XLSX file exported from Google Forms with the following columns:
              </p>
              <ul className="text-xs text-gray-500 space-y-1 mb-4">
                <li><strong>Column A:</strong> Timestamp</li>
                <li><strong>Column B:</strong> Name (Full Name) ✓</li>
                <li><strong>Column C:</strong> TUPT-ID Number ✓</li>
                <li><strong>Column D:</strong> Personal Email</li>
                <li><strong>Column E:</strong> TUP Email ✓</li>
                <li><strong>Column F:</strong> Contact Number</li>
                <li><strong>Column G:</strong> Course ✓</li>
                <li><strong>Column H:</strong> Employment Status</li>
                <li><strong>Column I:</strong> Position/Job Title</li>
                <li><strong>Column J:</strong> Company/Organization Name</li>
                <li><strong>Column K:</strong> Start Work Date</li>
                <li><strong>Column L:</strong> Working Present</li>
                <li><strong>Column M:</strong> End Work Date</li>
              </ul>
              <p className="text-xs text-gray-500 mb-3">
                <strong>Note:</strong> Username will be auto-generated (first letters + last name). 
                Password will be set to the last name.
              </p>
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
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                }}
                disabled={importing}
                className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!importFile || importing}
                className="px-4 py-2 rounded bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
              >
                {importing ? "Importing..." : "Import"}
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
            <button
              type="button"
              className="px-3 py-1 rounded bg-primary hover:bg-primary/90 text-white flex items-center"
              onClick={() => setShowImportModal(true)}
              title="Import users from CSV"
            >
              Import Users
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
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
              {sortedUsers.filter(user => {
                const q = userSearch?.toLowerCase() || "";
                return (
                  user.name.toLowerCase().includes(q) ||
                  user.username.toLowerCase().includes(q) ||
                  user.email.toLowerCase().includes(q) ||
                  user.tuptId?.toLowerCase().includes(q)
                );
              }).map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
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
                        <a href={`/profile/${user.username}`} className="text-sm font-medium text-gray-900 truncate hover:underline">
                          {user.name}
                        </a>
                        <div
                          className="text-xs text-gray-500 truncate"
                          title={`@${user.username}`}
                        >
                          @{user.username}
                        </div>
                        <div className="absolute left-0 top-full mt-2 hidden group-hover:block z-10">
                          <div className="bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-normal" title={`${user.name} — ${user.email}`}>
                            <div className="font-semibold text-sm">{user.name}</div>
                            <div className="text-[11px] opacity-90">{user.email}</div>
                          </div>
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
                    <span className={`w-20 px-2 py-1 inline-flex justify-center text-xs leading-5 font-semibold rounded-full ${
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'N/A'}
                    </span>
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
                  <td className="px-6 py-4 text-sm font-medium w-1/12 text-center">
                    {user._id !== authUser._id && !(user.permission === 'superAdmin' && authUser?.permission !== 'superAdmin') && (
                      <div className="flex flex-col gap-1 items-center">
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