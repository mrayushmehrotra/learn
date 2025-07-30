import React, { useState } from 'react';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { toast } from 'react-toastify';
import type { User } from '../types';
import AddUserModal from './AddUserModal';

interface UserDropdownProps {
  onUserSelect: (user: User) => void;
  selectedUser: User | null;
}

const UserDropdown: React.FC<UserDropdownProps> = ({ onUserSelect, selectedUser }) => {
  const { users, createUser, isLoading } = useLeaderboard();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreateUser = async (name: string, avatarUrl: string) => {
    try {
      await createUser(name, avatarUrl);
      toast.success(`User "${name}" created successfully!`);
      setIsModalOpen(false);
    } catch {
      toast.error('Failed to create user. Please try again.');
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Select a User</h2>
      <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
        {users.map((user) => (
          <div
            key={user._id}
            className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
              selectedUser?._id === user._id
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
            onClick={() => onUserSelect(user)}
          >
            <img
              src={user.avatarUrl || 'https://via.placeholder.com/40'}
              alt={user.name}
              className="w-10 h-10 rounded-full mr-4"
            />
            <div className="flex-1">
              <p className="font-semibold">{user.name}</p>
              <p className="text-sm">{user.totalPoints.toLocaleString()} points</p>
            </div>
            <span className="text-lg font-bold">#{user.rank}</span>
          </div>
        ))}
      </div>
      <button
        onClick={() => setIsModalOpen(true)}
        className="mt-4 w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors"
        disabled={isLoading}
      >
        {isLoading ? 'Creating...' : '➕ Add New User'}
      </button>
      <AddUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateUser}
      />
    </div>
  );
};

export default UserDropdown; 