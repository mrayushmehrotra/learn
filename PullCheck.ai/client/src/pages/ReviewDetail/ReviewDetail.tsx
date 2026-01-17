import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useReview, useOverrideReview, useRerunReview } from '@/hooks';
import { Card, CardBody, Badge, Button } from '@/components/common';
import type { ReviewComment, Severity } from '@/types';
import './ReviewDetail.css';

export function ReviewDetail() {
    const { id } = useParams<{ id: string }>();
    const { data: review, isLoading, error } = useReview(id!);
    const overrideMutation = useOverrideReview();
    const rerunMutation = useRerunReview();

    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editMessage, setEditMessage] = useState('');

    if (isLoading) {
        return <div className="review-detail"><p>Loading review...</p></div>;
    }

    if (error || !review) {
        return (
            <div className="review-detail">
                <Card variant="bordered">
                    <CardBody>
                        <p>Error loading review. It might not exist or you don't have access.</p>
                        <Link to="/dashboard">
                            <Button variant="outline" className="mt-4">Back to Dashboard</Button>
                        </Link>
                    </CardBody>
                </Card>
            </div>
        );
    }

    const handleRerun = () => {
        if (window.confirm('Are you sure you want to rerun this review? This will fetch the latest code and use a new AI analysis.')) {
            rerunMutation.mutate(review.id);
        }
    };

    const startEdit = (comment: ReviewComment) => {
        setEditingCommentId(comment.id);
        setEditMessage(comment.overriddenMessage || comment.message);
    };

    const cancelEdit = () => {
        setEditingCommentId(null);
        setEditMessage('');
    };

    const saveOverride = (commentId: string) => {
        overrideMutation.mutate({
            id: review.id,
            input: {
                comments: [{ commentId, message: editMessage }],
                postToGitHub: true
            }
        }, {
            onSuccess: () => {
                setEditingCommentId(null);
                setEditMessage('');
            }
        });
    };

    return (
        <div className="review-detail">
            <div className="review-detail__header">
                <div>
                    <h1 className="review-detail__title">{review.prTitle}</h1>
                    <div className="review-detail__meta">
                        <span>{review.repoFullName}</span>
                        <span>•</span>
                        <span>PR #{review.prNumber}</span>
                        <span>•</span>
                        <Badge variant={review.status === 'completed' ? 'success' : 'warning'}>
                            {review.status.replace('_', ' ')}
                        </Badge>
                    </div>
                </div>
                <div className="review-detail__actions">
                    <Button
                        variant="outline"
                        onClick={handleRerun}
                        loading={rerunMutation.isPending}
                    >
                        Rerun Review
                    </Button>
                    <a href={review.prUrl} target="_blank" rel="noopener noreferrer">
                        <Button>View on GitHub</Button>
                    </a>
                </div>
            </div>

            <div className="review-detail__grid">
                <div className="review-detail__main">
                    <section className="review-detail__section">
                        <h2 className="review-detail__section-title">AI Summary</h2>
                        <Card variant="bordered">
                            <CardBody>
                                <div className="review-detail__summary">
                                    {review.summary || 'No summary generated yet.'}
                                </div>
                            </CardBody>
                        </Card>
                    </section>

                    <section className="review-detail__comments">
                        <h2 className="review-detail__section-title">AI Comments ({review.comments.length})</h2>
                        {review.comments.length === 0 ? (
                            <div className="review-detail__empty">
                                <p>No specific issues found. Great job!</p>
                            </div>
                        ) : (
                            review.comments.map(comment => (
                                <CommentCard
                                    key={comment.id}
                                    comment={comment}
                                    isEditing={editingCommentId === comment.id}
                                    editMessage={editMessage}
                                    setEditMessage={setEditMessage}
                                    onEdit={() => startEdit(comment)}
                                    onCancel={cancelEdit}
                                    onSave={() => saveOverride(comment.id)}
                                    isSaving={overrideMutation.isPending}
                                />
                            ))
                        )}
                    </section>
                </div>

                <aside className="review-detail__sidebar">
                    <section className="review-detail__section">
                        <h2 className="review-detail__section-title">Metrics</h2>
                        <Card variant="bordered">
                            <CardBody>
                                <div className="review-detail__metrics">
                                    <MetricItem label="Overall Rating" value={review.overallRating.toUpperCase()} />
                                    <MetricItem label="Files Reviewed" value={review.metrics.filesReviewed} />
                                    <MetricItem label="Critical Issues" value={review.metrics.criticalCount} highlight={review.metrics.criticalCount > 0} />
                                    <MetricItem label="Warnings" value={review.metrics.warningCount} />
                                    <MetricItem label="Suggestions" value={review.metrics.suggestionCount} />
                                    <MetricItem label="Processing Time" value={`${(review.metrics.processingTimeMs / 1000).toFixed(2)}s`} />
                                </div>
                            </CardBody>
                        </Card>
                    </section>

                    {review.githubReviewId && (
                        <div className="mt-6 text-center text-sm text-gray-500">
                            Posted to GitHub as review #{review.githubReviewId}
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
}

function CommentCard({
    comment,
    isEditing,
    editMessage,
    setEditMessage,
    onEdit,
    onCancel,
    onSave,
    isSaving
}: {
    comment: ReviewComment;
    isEditing: boolean;
    editMessage: string;
    setEditMessage: (val: string) => void;
    onEdit: () => void;
    onCancel: () => void;
    onSave: () => void;
    isSaving: boolean;
}) {
    const severityVariants: Record<Severity, 'danger' | 'warning' | 'info' | 'success'> = {
        critical: 'danger',
        warning: 'warning',
        info: 'info',
        suggestion: 'success'
    };

    return (
        <div className="review-comment">
            <Card variant="bordered">
                <CardBody>
                    <div className="review-comment__header">
                        <span className="review-comment__path">{comment.filePath}:L{comment.lineNumber}</span>
                        <div className="flex gap-2">
                            {comment.isOverridden && <Badge variant="default">Overridden</Badge>}
                            <Badge variant={severityVariants[comment.severity as Severity]}>{comment.severity}</Badge>
                        </div>
                    </div>

                    <div className={`review-comment__body review-comment__body--${comment.severity}`}>
                        {isEditing ? (
                            <div>
                                <textarea
                                    className="review-comment__edit-area"
                                    value={editMessage}
                                    onChange={(e) => setEditMessage(e.target.value)}
                                />
                                <div className="review-comment__edit-actions">
                                    <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
                                    <Button size="sm" onClick={onSave} loading={isSaving}>Post to GitHub</Button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <p className="review-comment__message">
                                    {comment.isOverridden ? comment.overriddenMessage : comment.message}
                                </p>
                                {comment.codeSnippet && (
                                    <pre className="review-comment__snippet">
                                        <code>{comment.codeSnippet}</code>
                                    </pre>
                                )}
                                <div className="review-comment__edit-actions">
                                    <Button size="sm" variant="ghost" onClick={onEdit}>Edit Feedback</Button>
                                </div>
                            </div>
                        )}
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}

function MetricItem({ label, value, highlight = false }: { label: string, value: string | number, highlight?: boolean }) {
    return (
        <div className="review-detail__metric">
            <span className="text-gray-500">{label}</span>
            <span className={`font-semibold ${highlight ? 'text-red-500' : ''}`}>{value}</span>
        </div>
    );
}

export default ReviewDetail;
