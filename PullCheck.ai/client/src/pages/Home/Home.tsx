import { Link } from 'react-router-dom';
import { Button } from '@/components/common';
import { useAuth } from '@/hooks';
import './Home.css';

export function Home() {
    const { isAuthenticated } = useAuth();

    return (
        <div className="home">
            <section className="home__hero">
                <div className="home__hero-content">
                    <span className="home__badge">🤖 AI-Powered Code Review</span>
                    <h1 className="home__title">
                        Automated Code Reviews
                        <br />
                        <span className="home__title-gradient">Powered by Claude AI</span>
                    </h1>
                    <p className="home__subtitle">
                        Get intelligent, actionable feedback on your pull requests instantly.
                        Catch bugs, security issues, and code quality problems before they reach production.
                    </p>
                    <div className="home__cta">
                        {isAuthenticated ? (
                            <Link to="/dashboard">
                                <Button size="lg">Go to Dashboard</Button>
                            </Link>
                        ) : (
                            <Link to="/login">
                                <Button size="lg">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                                    </svg>
                                    Sign in with GitHub
                                </Button>
                            </Link>
                        )}
                        <a href="#features">
                            <Button variant="outline" size="lg">Learn More</Button>
                        </a>
                    </div>
                </div>
                <div className="home__hero-visual">
                    <div className="home__code-preview">
                        <div className="home__code-header">
                            <div className="home__code-dots">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                            <span className="home__code-filename">review-example.tsx</span>
                        </div>
                        <pre className="home__code-content">
                            {`// 🤖 PullCheck Review

⚠️ Warning: Potential memory leak
   Line 42: Event listener not removed

🔴 Critical: SQL Injection vulnerability  
   Line 87: Use parameterized queries

✅ Good: Proper error handling
   Lines 15-28: Try-catch implemented

💡 Suggestion: Consider memoization
   Line 63: Heavy computation in render`}
                        </pre>
                    </div>
                </div>
            </section>

            <section id="features" className="home__features">
                <h2 className="home__section-title">Why PullCheck?</h2>
                <div className="home__features-grid">
                    <div className="home__feature">
                        <div className="home__feature-icon home__feature-icon--security">🔒</div>
                        <h3>Security First</h3>
                        <p>Automatically detect security vulnerabilities, injection risks, and authentication issues.</p>
                    </div>
                    <div className="home__feature">
                        <div className="home__feature-icon home__feature-icon--speed">⚡</div>
                        <h3>Instant Feedback</h3>
                        <p>Get review comments within seconds of opening a PR. No more waiting for human reviewers.</p>
                    </div>
                    <div className="home__feature">
                        <div className="home__feature-icon home__feature-icon--quality">✨</div>
                        <h3>Code Quality</h3>
                        <p>Maintain high code standards with suggestions for readability, performance, and best practices.</p>
                    </div>
                    <div className="home__feature">
                        <div className="home__feature-icon home__feature-icon--github">🔗</div>
                        <h3>GitHub Integration</h3>
                        <p>Seamlessly integrates with your GitHub workflow. Comments appear right in your PR.</p>
                    </div>
                </div>
            </section>

            <section className="home__stats">
                <div className="home__stats-grid">
                    <div className="home__stat">
                        <span className="home__stat-value">95%</span>
                        <span className="home__stat-label">Bugs Caught</span>
                    </div>
                    <div className="home__stat">
                        <span className="home__stat-value">&lt;30s</span>
                        <span className="home__stat-label">Review Time</span>
                    </div>
                    <div className="home__stat">
                        <span className="home__stat-value">10k+</span>
                        <span className="home__stat-label">PRs Reviewed</span>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Home;
