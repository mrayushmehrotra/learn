import React from 'react';
import type { User } from '../types';

interface UsersListProps {
  users: User[];
  startRank?: number;
}

const UsersList: React.FC<UsersListProps> = ({ users, startRank = 4 }) => {
  if (users.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-500">
        No users to display
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-gray-50 p-4 border-b border-gray-200">
        <h3 className="font-bold text-gray-800">Leaderboard Rankings</h3>
      </div>
      
      <div className="divide-y divide-gray-200">
        {users.map((user) => (
          <div key={user._id} className="flex items-center justify-between p-4 border-b hover:bg-gray-50 transition-colors">
            {/* Rank */}
            <div className="flex items-center space-x-4">
              <span className="text-2xl font-bold text-gray-800 w-8">#{user.rank}</span>
              
              {/* Avatar */}
              <img
                src={user.avatarUrl || 'https://indianmemetemplates.com/wp-content/uploads/bhulaa.jpg'}
                alt={user.name}
                className="w-12 h-12 object-cover rounded-full"
              />
              
              {/* Name */}
              <div>
                <h4 className="font-semibold text-gray-800">{user.name}</h4>
                <p className="text-sm text-gray-600">Rank #{user.rank}</p>
              </div>
            </div>
            
            {/* Points */}
            <div className="text-right">
              <p className="text-xl font-bold text-blue-600">{user.totalPoints.toLocaleString()}</p>
              <p className="text-sm text-gray-500">points</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UsersList;