import React from 'react';
import type { User } from '../types';

interface TopThreeProps {
  users: User[];
}

const medalIcons = ["🥇", "🥈", "🥉"];

const TopThree: React.FC<TopThreeProps> = ({ users }) => {
  // Order: 2nd, 1st, 3rd for podium effect
  const podiumOrder = [1, 0, 2];
  if (!users || users.length < 3) return null;
  
  return (
    <div className="flex justify-around mt-6 items-end gap-2 px-2">
      {podiumOrder.map((i, idx) => (
        <div
          key={i}
          className={`flex flex-col items-center px-3 py-3 shadow-xl border-2 border-yellow-400 bg-white rounded-lg transition duration-300 ease-in-out ${
            i === 0 ? "scale-110 z-10 bg-gradient-to-b from-yellow-50 to-white" : ""
          } hover:scale-105 min-w-[100px]`}
        >
          <div className={`relative ${i === 0 ? "mb-2" : "mb-3"}`}>
            {i === 0 && (
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-3xl">👑</span>
            )}
            <img
              src={users[i].avatarUrl || 'https://via.placeholder.com/64'}
              className={`rounded-full border-4 border-yellow-400 bg-white object-cover ${
                i === 0 ? "w-18 h-18" : "w-14 h-14"
              }`}
              alt={users[i].name}
            />
          </div>
          <div className="mt-1 font-semibold text-center max-w-[80px] truncate text-sm">
            {users[i].name}
          </div>
          <div className="text-yellow-600 font-bold text-xs">
            {users[i].totalPoints.toLocaleString()}
          </div>
          <div className="text-xl mt-1">{medalIcons[i]}</div>
        </div>
      ))}
    </div>
  );
};

export default TopThree; 