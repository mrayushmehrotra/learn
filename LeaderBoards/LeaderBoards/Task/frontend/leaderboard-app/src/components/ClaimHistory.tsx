import React, { useState, useEffect } from 'react';
import api from '../services/api';
import type { ClaimHistory as ClaimHistoryType } from '../types';

interface ClaimHistoryProps {
  userId?: string;
}

const ClaimHistory: React.FC<ClaimHistoryProps> = ({ userId }) => {
  const [history, setHistory] = useState<ClaimHistoryType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return; // Only fetch if userId is provided
    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params = `/${userId}`;
        const response = await api.get<ClaimHistoryType[]>(`/history${params}`);
        setHistory(response.data);
      } catch (err) {
        setError('Failed to fetch claim history');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [userId]);

  if (!userId) {
    return null; // Or show a message like: return <div>Select a user to view claim history.</div>
  }

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Claim History</h3>
        <p className="text-center text-gray-500">Loading history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Claim History</h3>
        <p className="text-center text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-bold text-gray-800 mb-4">
        Recent Claims {userId ? '(Filtered)' : '(All Users)'}
      </h3>
      
      {history.length === 0 ? (
        <p className="text-center text-gray-500">No claims yet</p>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {history.map((claim) => (
            <div key={claim._id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center space-x-3">
                <img
                  src={claim.userId.avatarUrl || 'https://indianmemetemplates.com/wp-content/uploads/bhulaa.jpg'}
                  alt={claim.userId.name}
                  className="w-8 h-8 object-cover rounded-full"
                />
                <div>
                  <p className="font-medium text-gray-800">{claim.userId.name}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(claim.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              <span className="font-bold text-green-600">+{claim.pointsClaimed}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClaimHistory;