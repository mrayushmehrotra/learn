import React from "react";
import type { User } from "../types";


interface RankListProps {
  users: User[];
}

const AVATAR_CARD_SIZE = "48px";
const AVATAR_CARD_HEIGHT = "48px";

const RankList: React.FC<RankListProps> = ({ users }) => {
  if (!users || users.length === 0) {
    return (
      <div className="mt-4 text-center text-gray-500">
        No users to display
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-2 overflow-hidden">
      {users.map((user) => (
        <div
          key={user._id}
          className="flex flex-row items-center gap-4 py-3 px-4 bg-white rounded-lg shadow-sm border hover:bg-yellow-50 transition duration-300"
        >
          {/* Rank */}
          <span className="w-8 text-center text-lg font-bold text-gray-800 flex-shrink-0">
            {user.rank}
          </span>
          {/* Avatar Card */}
          <div
            className="flex items-center justify-center rounded-lg overflow-hidden bg-gray-100 border border-gray-300 shadow-md flex-shrink-0"
            style={{ width: AVATAR_CARD_SIZE, height: AVATAR_CARD_HEIGHT }}
          >
            <img
              src={
                user.avatarUrl ||
                "https://indianmemetemplates.com/wp-content/uploads/bhulaa.jpg"
              }
              alt={user.name}
              className="object-cover w-full h-full"
              style={{ width: "100%", height: "100%" }}
            />
          </div>
          {/* Name */}
          <div className="flex-1 min-w-0 font-medium text-gray-800 truncate max-w-[140px]">
            {user.name}
          </div>
          {/* Points */}
          <div className="flex items-center gap-1 text-yellow-600 font-semibold flex-shrink-0">
            {user.totalPoints ? user.totalPoints.toLocaleString() : ""}{" "}
            <span className="ml-1">🏆</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RankList;
