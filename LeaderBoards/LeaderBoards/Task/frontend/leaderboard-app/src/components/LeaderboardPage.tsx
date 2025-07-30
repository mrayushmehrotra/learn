import React, { useMemo, useState } from "react";
import Tabs from "./Tabs";
import Countdown from "./Countdown";
import RewardButton from "./RewardButton";
import TopThree from "./TopThree";
import RankList from "./RankList";
import UserDropdown from "./UserDropdown";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useLeaderboard } from "../hooks/useLeaderboard";
import type { User } from "../types";


const LeaderboardPage: React.FC = () => {
  const { users, isLoading, error, claimPoints } = useLeaderboard();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 7; // Show 7 users per page (after top 3)

  const handleClaim = async () => {
    if (selectedUser?._id) {
      try {
        const result = await claimPoints(selectedUser._id);
        toast.success(`🎉 ${selectedUser.name} claimed ${result.claimedPoints} points!`);
      } catch (err) {
        console.error("Failed to claim points:", err);
        toast.error("Failed to claim points. Please try again.");
      }
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  // Sort users by rank ascending (1,2,3...)
  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => a.rank - b.rank),
    [users]
  );
  
  const top3Users = sortedUsers.slice(0, 3);
  const remainingUsers = sortedUsers.slice(3);
  
  // Pagination for remaining users
  const totalPages = Math.ceil(remainingUsers.length / usersPerPage);
  const currentUsers = remainingUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-100 via-yellow-50 to-white px-4 sm:px-8 py-4 relative flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <Tabs />
        
        <UserDropdown
          onUserSelect={setSelectedUser}
          selectedUser={selectedUser}
        />

        <div className="mt-2 flex justify-between items-center">
          <Countdown />
          <RewardButton userId={selectedUser?._id} onClaim={handleClaim} />
        </div>
        
        {isLoading && (
          <div className="text-center py-8 text-lg">Loading leaderboard...</div>
        )}
        
        {error && <div className="text-center py-8 text-red-500">{error}</div>}
        
        {!isLoading && !error && (
          <>
            {top3Users.length >= 3 && <TopThree users={top3Users} />}
            
            {currentUsers.length > 0 && <RankList users={currentUsers} />}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between px-4">
                <p className="text-sm text-gray-600">
                  Showing{" "}
                  {Math.min(currentPage * usersPerPage, remainingUsers.length)} of{" "}
                  {remainingUsers.length} users
                </p>
                <div className="flex gap-2">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => handlePageChange(i + 1)}
                      className={`px-3 py-1 rounded ${
                        currentPage === i + 1
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 hover:bg-gray-300"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
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

export default LeaderboardPage;
