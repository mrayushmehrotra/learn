import { Link } from 'react-router-dom';
import { useAuth, useReviews } from '@/hooks';
import { Card, CardBody, Badge, Button } from '@/components/common';
import type { Review, ReviewStatus, Severity } from '@/types';
import './Dashboard.css';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | Severity;

const statusColors: Record<ReviewStatus, BadgeVariant> = {
    pending: 'warning',
    in_progress: 'info',
    completed: 'success',
    failed: 'danger',
    overridden: 'default',
};

const statusLabels: Record<ReviewStatus, string> = {
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed',
    failed: 'Failed',
    overridden: 'Overridden',
};

export function Dashboard() {
    const { user } = useAuth();
    const { data: reviewsData, isLoading } = useReviews({ limit: 10 });

    const reviews = reviewsData?.data ?? [];
    const stats = {
        totalReviews: reviewsData?.pagination.totalItems ?? 0,
        completedToday: reviews.filter(r => {
            const today = new Date().toDateString();
            return new Date(r.createdAt).toDateString() === today && r.status === 'completed';
        }).length,
        connectedRepos: user?.connectedRepos?.length ?? 0,
        issuesCaught: reviews.reduce((acc, r) => acc + (r.metrics?.criticalCount ?? 0), 0),
    };

    return (
        <div className="dashboard">
            <div className="dashboard__header">
                <div>
                    <h1 className="dashboard__title">Welcome back, {user?.username}!</h1>
                    <p className="dashboard__subtitle">Here's an overview of your code reviews</p>
                </div>
                <Link to="/settings">
                    <Button variant="outline">Manage Repositories</Button>
                </Link>
            </div>

            <div className="dashboard__stats">
                <Card variant="bordered" padding="lg">
                    <div className="dashboard__stat">
                        <span className="dashboard__stat-value">{stats.totalReviews}</span>
                        <span className="dashboard__stat-label">Total Reviews</span>
                    </div>
                </Card>
                <Card variant="bordered" padding="lg">
                    <div className="dashboard__stat">
                        <span className="dashboard__stat-value">{stats.completedToday}</span>
                        <span className="dashboard__stat-label">Completed Today</span>
                    </div>
                </Card>
                <Card variant="bordered" padding="lg">
                    <div className="dashboard__stat">
                        <span className="dashboard__stat-value">{stats.connectedRepos}</span>
                        <span className="dashboard__stat-label">Connected Repos</span>
                    </div>
                </Card>
                <Card variant="bordered" padding="lg">
                    <div className="dashboard__stat">
                        <span className="dashboard__stat-value dashboard__stat-value--danger">{stats.issuesCaught}</span>
                        <span className="dashboard__stat-label">Critical Issues</span>
                    </div>
                </Card>
            </div>

            <div className="dashboard__section">
                <div className="dashboard__section-header">
                    <h2 className="dashboard__section-title">Recent Reviews</h2>
                    <Link to="/reviews">
                        <Button variant="ghost" size="sm">View All</Button>
                    </Link>
                </div>

                {isLoading ? (
                    <div className="dashboard__loading">Loading reviews...</div>
                ) : reviews.length === 0 ? (
                    <Card variant="bordered" padding="lg">
                        <div className="dashboard__empty">
                            {user?.connectedRepos?.length ?? 0 > 0 ? (
                                <>
                                    <p>No reviews yet, but you're all set up! 🚀</p>
                                    <p className="mt-2 text-sm text-gray-500">
                                        Open a pull request in one of your connected repositories to see AI feedback here.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p>No reviews yet. Connect a repository to get started!</p>
                                    <Link to="/settings">
                                        <Button className="mt-4">Connect Repository</Button>
                                    </Link>
                                </>
                            )}
                        </div>
                    </Card>
                ) : (
                    <div className="dashboard__reviews">
                        {reviews.map((review) => (
                            <ReviewCard key={review.id} review={review} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function ReviewCard({ review }: { review: Review }) {
    return (
        <Link to={`/reviews/${review.id}`} className="review-card">
            <Card variant="bordered" hoverable padding="md">
                <CardBody>
                    <div className="review-card__header">
                        <h3 className="review-card__title">{review.prTitle}</h3>
                        <Badge variant={statusColors[review.status]}>{statusLabels[review.status]}</Badge>
                    </div>
                    <div className="review-card__meta">
                        <span className="review-card__repo">{review.repoFullName}</span>
                        <span className="review-card__pr">#{review.prNumber}</span>
                        <span className="review-card__date">
                            {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                    {review.summary && (
                        <p className="review-card__summary">{review.summary}</p>
                    )}
                    <div className="review-card__metrics">
                        {(review.metrics?.criticalCount ?? 0) > 0 && (
                            <Badge variant="critical" size="sm">
                                {review.metrics?.criticalCount} critical
                            </Badge>
                        )}
                        {(review.metrics?.warningCount ?? 0) > 0 && (
                            <Badge variant="warning" size="sm">
                                {review.metrics?.warningCount} warnings
                            </Badge>
                        )}
                        {(review.metrics?.infoCount ?? 0) > 0 && (
                            <Badge variant="info" size="sm">
                                {review.metrics?.infoCount} info
                            </Badge>
                        )}
                    </div>
                </CardBody>
            </Card>
        </Link>
    );
}

export default Dashboard;
