import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalUsers: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalUsers,
  onPageChange,
  isLoading
}) => {
  if (totalPages <= 1) return null;

  const startUser = (currentPage - 1) * 10 + 1;
  const endUser = Math.min(currentPage * 10, totalUsers);

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mt-6">
      <div className="flex items-center justify-between">
        {/* Info */}
        <p className="text-sm text-gray-600">
          Showing {startUser} to {endUser} of {totalUsers} users
        </p>
        
        {/* Pagination Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          {/* Page Numbers */}
          {[...Array(totalPages)].map((_, index) => {
            const page = index + 1;
            const isActive = page === currentPage;
            
            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                disabled={isLoading}
                className={`px-3 py-1 rounded ${
                  isActive
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 hover:bg-gray-300'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {page}
              </button>
            );
          })}
          
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading}
            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;