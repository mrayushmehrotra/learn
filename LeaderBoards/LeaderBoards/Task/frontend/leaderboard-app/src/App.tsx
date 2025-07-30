import ErrorBoundary from './components/ErrorBoundary';
import LeaderboardPage from './pages/LeaderboardPage';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <LeaderboardPage />
    </ErrorBoundary>
  );
}

export default App;
