import React, { useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useLeaderboard } from '../hooks/useLeaderboard';
import UserSelection from './UserSelection';
import ClaimButton from './ClaimButton';
import TopThreeDisplay from './TopThreeDisplay';
import UsersList from './UsersList';
import Pagination from './Pagination';
import ClaimHistory from './ClaimHistory';
import type { User } from '../types';

const LeaderboardApp: React.FC = () => {
  const {
    users,
    allUsers,
    isLoading,
    error,
    pagination,
    claimPoints,
    createUser,
    fetchLeaderboard
  } = useLeaderboard();

  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const handleClaim = async () => {
    if (!selectedUser) return;

    try {
      const result = await claimPoints(selectedUser._id);
      toast.success(`🎉 ${selectedUser.name} claimed ${result.pointsClaimed} points!`);
      
      // Update selected user with new data from leaderboard
      const updatedUser = result.leaderboard?.find(u => u._id === selectedUser._id);
      if (updatedUser) {
        setSelectedUser(updatedUser);
      }
    } catch (error) {
      toast.error('Failed to claim points. Please try again.');
    }
  };

  const handleAddUser = async (name: string, avatar: string) => {
    try {
      const newUser = await createUser(name, avatar);
      toast.success(`User "${newUser.name}" added successfully!`);
      
      // Automatically select the new user
      setSelectedUser(newUser);
    } catch (error) {
      toast.error('Failed to add user. Please try again.');
    }
  };

  const handlePageChange = (page: number) => {
    fetchLeaderboard(page);
  };

  if (error && users.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  const topThree = users.slice(0, 3);
  const remainingUsers = users.slice(3);

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🏆 Leaderboard</h1>
          <p className="text-gray-600">Claim points and climb the rankings!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Controls */}
          <div className="lg:col-span-1">
            <UserSelection
              users={allUsers}
              selectedUser={selectedUser}
              onUserSelect={setSelectedUser}
              onAddUser={handleAddUser}
              isLoading={isLoading}
            />
            
            <ClaimButton
              selectedUser={selectedUser}
              onClaim={handleClaim}
              isLoading={isLoading}
            />

            <ClaimHistory userId={selectedUser?._id} />
          </div>

          {/* Right Column - Leaderboard */}
          <div className="lg:col-span-2">
            {isLoading && users.length === 0 ? (
              <div className="bg-white p-8 rounded-lg shadow-md text-center">
                <p className="text-gray-500">Loading leaderboard...</p>
              </div>
            ) : (
              <>
                {/* Top 3 Display */}
                {topThree.length >= 3 && <TopThreeDisplay users={topThree} />}

                {/* Remaining Users List */}
                {remainingUsers.length > 0 && (
                  <div className="mb-6">
                    <UsersList users={remainingUsers} />
                  </div>
                )}

                {/* Pagination */}
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  totalUsers={pagination.totalUsers}
                  onPageChange={handlePageChange}
                  isLoading={isLoading}
                />
              </>
            )}
          </div>
        </div>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

export default LeaderboardApp;