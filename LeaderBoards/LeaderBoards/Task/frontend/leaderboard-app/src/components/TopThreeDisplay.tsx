import React from 'react';
import type { User } from '../types';

interface TopThreeDisplayProps {
  users: User[];
}

const TopThreeDisplay: React.FC<TopThreeDisplayProps> = ({ users }) => {
  if (users.length < 3) return null;

  const medals = ['🥇', '🥈', '🥉'];
  
  // Ensure we have the top 3 users sorted by rank
  const sortedTop3 = [...users].sort((a, b) => a.rank - b.rank).slice(0, 3);
  const podiumOrder = [sortedTop3[1], sortedTop3[0], sortedTop3[2]]; // 2nd, 1st, 3rd for podium effect

  return (
    <div className="bg-yellow-100 p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-2xl font-bold text-blue-700 text-center mb-6">🏆 Top 3 Champions 🏆</h2>
      
      <div className="flex justify-center items-end space-x-4">
        {podiumOrder.map((user, index) => {
          if (!user) return null; // Handle case where we don't have 3 users yet
          
          const actualRank = user.rank;
          const podiumHeight = actualRank === 1 ? 'h-32' : actualRank === 2 ? 'h-24' : 'h-20';
          
          return (
            <div key={user._id} className="flex flex-col items-center">
              {/* User Card */}
              <div className={`bg-white p-4 rounded-lg shadow-lg mb-2 ${actualRank === 1 ? 'ring-4 ring-yellow-400' : ''}`}>
                <img
                  src={user.avatar || 'https://via.placeholder.com/80'}
                  alt={user.name}
                  className="w-12 h-12 object-cover rounded-full mx-auto mb-2"
                />
                <h3 className="font-bold text-blue-700 text-center text-sm">{user.name}</h3>
                <p className="text-center text-xs text-gray-600">{user.totalPoints.toLocaleString()} pts</p>
                <div className="text-center text-2xl mt-1">{medals[actualRank - 1]}</div>
              </div>
              
              {/* Podium */}
              <div className={`bg-gradient-to-t from-yellow-400 to-yellow-300 ${podiumHeight} w-16 rounded-t-lg flex items-end justify-center pb-2`}>
                <span className="text-white font-bold text-lg">#{actualRank}</span>
              </div>
            </div>
          );
        }).filter(Boolean)}
      </div>
    </div>
  );
};

export default TopThreeDisplay;