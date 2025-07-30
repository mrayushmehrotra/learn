import React from 'react';
import type { User } from '../types';

interface ClaimButtonProps {
  selectedUser: User | null;
  onClaim: () => void;
  isLoading: boolean;
}

const ClaimButton: React.FC<ClaimButtonProps> = ({ selectedUser, onClaim, isLoading }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <button
        onClick={onClaim}
        disabled={!selectedUser || isLoading}
        className={`w-full py-4 px-6 rounded-lg font-bold text-lg transition-colors ${
          selectedUser && !isLoading
            ? 'bg-blue-500 text-white hover:bg-blue-600'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {isLoading ? 'Claiming...' : selectedUser ? `Claim Points for ${selectedUser.name}` : 'Select a User First'}
      </button>
      
      {selectedUser && (
        <p className="text-center text-sm text-gray-600 mt-2">
          Click to award random points (1-10) to {selectedUser.name}
        </p>
      )}
    </div>
  );
};

export default ClaimButton;