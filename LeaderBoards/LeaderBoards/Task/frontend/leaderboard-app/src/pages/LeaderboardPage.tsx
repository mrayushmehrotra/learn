import React, { Suspense } from 'react';
import ErrorBoundary from '../components/ErrorBoundary';
import LoadingSpinner from '../components/ui/LoadingSpinner';

// Lazy load components for better performance
const LeaderboardApp = React.lazy(() => import('../components/LeaderboardApp'));

const LeaderboardPage: React.FC = () => {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        <LeaderboardApp />
      </Suspense>
    </ErrorBoundary>
  );
};

export default LeaderboardPage;