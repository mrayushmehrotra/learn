import React, { useState } from 'react';
import type { User } from '../types';

interface UserSelectionProps {
  users: User[];
  selectedUser: User | null;
  onUserSelect: (user: User) => void;
  onAddUser: (name: string, avatar: string) => void;
  isLoading: boolean;
}

const UserSelection: React.FC<UserSelectionProps> = ({
  users,
  selectedUser,
  onUserSelect,
  onAddUser,
  isLoading
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserAvatar, setNewUserAvatar] = useState('');

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newUserName.trim()) {
      try {
        await onAddUser(newUserName.trim(), newUserAvatar.trim());
        setNewUserName('');
        setNewUserAvatar('');
        setShowAddForm(false);
      } catch (error) {
        console.error('Failed to add user:', error);
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Select User</h2>
      
      {/* User Dropdown */}
      <div className="mb-4">
        <select
          value={selectedUser?._id || ''}
          onChange={(e) => {
            const user = users.find(u => u._id === e.target.value);
            if (user) onUserSelect(user);
          }}
          className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        >
          <option value="">Choose a user...</option>
          {users.map((user) => (
            <option key={user._id} value={user._id}>
              {user.name} ({user.totalPoints} points)
            </option>
          ))}
        </select>
      </div>

      {/* Selected User Display */}
      {selectedUser && (
        <div className="flex items-center p-4 bg-blue-50 rounded-lg mb-4">
          <img
            src={selectedUser.avatarUrl || 'https://indianmemetemplates.com/wp-content/uploads/bhulaa.jpg'}
            alt={selectedUser.name}
            className="w-12 h-12 object-cover rounded-full mr-4"
          />
          <div>
            <h3 className="font-semibold text-gray-800">{selectedUser.name}</h3>
            <p className="text-sm text-gray-600">{selectedUser.totalPoints} points</p>
          </div>
        </div>
      )}

      {/* Add User Button */}
      <button
        onClick={() => setShowAddForm(!showAddForm)}
        className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors"
        disabled={isLoading}
      >
        {showAddForm ? 'Cancel' : '+ Add New User'}
      </button>

      {/* Add User Form */}
      {showAddForm && (
        <form onSubmit={handleAddUser} className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              className="w-full p-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              required
              disabled={isLoading}
            />
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Avatar URL (optional)
            </label>
            <input
              type="url"
              value={newUserAvatar}
              onChange={(e) => setNewUserAvatar(e.target.value)}
              className="w-full p-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition-colors"
            disabled={isLoading || !newUserName.trim()}
          >
            {isLoading ? 'Adding...' : 'Add User'}
          </button>
        </form>
      )}
    </div>
  );
};

export default UserSelection;