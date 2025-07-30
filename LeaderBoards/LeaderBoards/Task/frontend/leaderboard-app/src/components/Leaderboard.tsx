import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { toast } from 'react-toastify';
import TopThree from './TopThree';
import RankList from './RankList';

interface LeaderboardProps {}

const Leaderboard: React.FC<LeaderboardProps> = () => {
  const { users, isLoading, error } = useLeaderboard();
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;
  const leaderboardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Sort users by rank ascending (1,2,3...)
  const sortedUsers = useMemo(() =>
    [...users].sort((a, b) => a.rank - b.rank),
    [users]
  );

  // Users for RankList (4th onward)
  const rankListUsers = useMemo(() => sortedUsers.slice(3), [sortedUsers]);

  // Only paginate users beyond top 3
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * usersPerPage;
    return rankListUsers.slice(startIndex, startIndex + usersPerPage);
  }, [rankListUsers, currentPage]);

  const totalPages = Math.ceil(rankListUsers.length / usersPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    leaderboardRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (isLoading && !users.length) {
    return <div className="p-4 text-center">Loading leaderboard...</div>;
  }

  if (error && !users.length) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  return (
    <div ref={leaderboardRef} className="p-4 bg-white rounded-lg shadow-md w-full max-w-lg">
      {/* Top 3 Podium */}
      {sortedUsers.length >= 3 && <TopThree users={sortedUsers.slice(0, 3)} />}
      {/* Rank List for 4th+ */}
      {rankListUsers.length > 0 && <RankList users={paginatedUsers} />}
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-center items-center space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
          >
            Previous
          </button>
          {[...Array(totalPages).keys()].map(num => (
            <button
              key={num + 1}
              onClick={() => handlePageChange(num + 1)}
              className={`px-3 py-1 rounded-md ${currentPage === num + 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              {num + 1}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Leaderboard; 