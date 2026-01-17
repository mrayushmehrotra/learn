import { useState, useMemo } from 'react';
import { useAuth, useGitHubRepos, useConnectRepo, useDisconnectRepo } from '@/hooks';
import { Card, CardBody, Button, Badge } from '@/components/common';
import './Settings.css';
import type { Repository } from '@/types';

type SettingsTab = 'repositories' | 'preferences' | 'profile';

export function Settings() {
    const { user, updateSettings } = useAuth();
    const { data: githubRepos, isLoading: loadingRepos, error: reposError, refetch: refetchRepos } = useGitHubRepos();
    const connectMutation = useConnectRepo();
    const disconnectMutation = useDisconnectRepo();

    const [activeTab, setActiveTab] = useState<SettingsTab>('repositories');
    const [searchQuery, setSearchQuery] = useState('');

    // Filter repos based on search
    const filteredRepos = useMemo(() => {
        if (!githubRepos) return [];
        const query = searchQuery.toLowerCase().trim();
        if (!query) return githubRepos;

        return githubRepos.filter(repo =>
            (repo.fullName || '').toLowerCase().includes(query) ||
            (repo.name || '').toLowerCase().includes(query)
        );
    }, [githubRepos, searchQuery]);

    const isConnected = (repoId: number) => {
        return user?.connectedRepos?.some(r => r.repoId === repoId);
    };

    const handleToggleRepo = async (repo: Repository) => {
        try {
            if (isConnected(repo.id)) {
                if (window.confirm(`Are you sure you want to disconnect ${repo.fullName}? Webhooks will be removed.`)) {
                    await disconnectMutation.mutateAsync(repo.id);
                }
            } else {
                await connectMutation.mutateAsync({ repoId: repo.id, fullName: repo.fullName });
            }
        } catch (error) {
            console.error('Failed to toggle repository connection:', error);
        }
    };

    const handleUpdatePref = async (key: string, value: boolean) => {
        try {
            await updateSettings({ [key]: value });
        } catch (error) {
            console.error('Failed to update settings:', error);
        }
    };

    return (
        <div className="settings">
            <header className="settings__header">
                <h1 className="settings__title">Settings</h1>
                <p className="settings__subtitle">Customize your experience, manage your repository integrations and control how AI interacts with your codebase.</p>
            </header>

            <div className="settings__grid">
                <aside className="settings__nav">
                    <button
                        className={`settings__nav-item ${activeTab === 'repositories' ? 'settings__nav-item--active' : ''}`}
                        onClick={() => setActiveTab('repositories')}
                    >
                        Repositories
                    </button>
                    <button
                        className={`settings__nav-item ${activeTab === 'preferences' ? 'settings__nav-item--active' : ''}`}
                        onClick={() => setActiveTab('preferences')}
                    >
                        Automation
                    </button>
                    <button
                        className={`settings__nav-item ${activeTab === 'profile' ? 'settings__nav-item--active' : ''}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        Profile
                    </button>

                    {activeTab === 'repositories' && (
                        <div className="mt-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => refetchRepos()}
                                loading={loadingRepos}
                            >
                                🔄 Refresh List
                            </Button>
                        </div>
                    )}
                </aside>

                <main className="settings__content">
                    {activeTab === 'repositories' && (
                        <section className="settings__section">
                            <h2 className="settings__section-title">GitHub Integrations</h2>

                            <div className="settings__repo-controls">
                                <div className="settings__repo-search-wrapper">
                                    <span className="settings__search-icon">🔍</span>
                                    <input
                                        type="text"
                                        className="settings__repo-search"
                                        placeholder="Search for a repository..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>

                            {reposError ? (
                                <div className="settings__empty-state">
                                    <div className="settings__empty-icon">⚠️</div>
                                    <h3 className="settings__empty-title">Connection Error</h3>
                                    <p className="settings__empty-subtitle">{(reposError as any)?.message || 'We encountered an error while fetching your repositories. Please try again.'}</p>
                                    <Button onClick={() => refetchRepos()}>Retry Connection</Button>
                                </div>
                            ) : loadingRepos ? (
                                <div className="settings__repo-list">
                                    {[1, 2, 3, 4, 5, 6].map(i => (
                                        <Card key={i} variant="bordered" style={{ opacity: 0.5 }}>
                                            <CardBody>
                                                <div style={{ height: '100px' }} />
                                            </CardBody>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="settings__repo-list">
                                    {filteredRepos.map(repo => (
                                        <div key={repo.id} className="settings__repo-item">
                                            <div className="settings__repo-info">
                                                <div className="settings__repo-header">
                                                    <span className="settings__repo-name">{repo.fullName}</span>
                                                    <Badge variant={repo.private ? 'warning' : 'success'} size="sm">
                                                        {repo.private ? 'Private' : 'Public'}
                                                    </Badge>
                                                </div>
                                                <p className="settings__repo-desc">
                                                    {repo.description || 'No description found for this repository.'}
                                                </p>
                                            </div>
                                            <div className="settings__repo-footer">
                                                <span className="settings__repo-meta">
                                                    branch: {repo.defaultBranch}
                                                </span>
                                                <Button
                                                    variant={isConnected(repo.id) ? 'outline' : 'primary'}
                                                    size="sm"
                                                    onClick={() => handleToggleRepo(repo)}
                                                    loading={
                                                        (connectMutation.isPending && connectMutation.variables?.repoId === repo.id) ||
                                                        (disconnectMutation.isPending && disconnectMutation.variables === repo.id)
                                                    }
                                                >
                                                    {isConnected(repo.id) ? 'Disconnect' : 'Connect'}
                                                </Button>
                                            </div>
                                        </div>
                                    ))}

                                    {githubRepos && githubRepos.length > 0 && filteredRepos.length === 0 && (
                                        <div className="settings__empty-state">
                                            <div className="settings__empty-icon">📂</div>
                                            <h3 className="settings__empty-title">No search results</h3>
                                            <p className="settings__empty-subtitle">We couldn't find any repositories matching "{searchQuery}". Try a different search term.</p>
                                            <Button variant="ghost" onClick={() => setSearchQuery('')}>Clear search</Button>
                                        </div>
                                    )}

                                    {githubRepos && githubRepos.length === 0 && (
                                        <div className="settings__empty-state">
                                            <div className="settings__empty-icon">🔭</div>
                                            <h3 className="settings__empty-title">No repositories found</h3>
                                            <p className="settings__empty-subtitle">We couldn't find any repositories in your GitHub account. Make sure you have repositories or have granted the necessary permissions.</p>
                                            <Button onClick={() => refetchRepos()}>Refresh GitHub Access</Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </section>
                    )}

                    {activeTab === 'preferences' && (
                        <section className="settings__section">
                            <h2 className="settings__section-title">Review Automation</h2>
                            <div className="settings__automation-list">
                                <div className="settings__toggle-group">
                                    <div className="settings__toggle-info">
                                        <span className="settings__toggle-label">Automatic Reviews</span>
                                        <span className="settings__toggle-desc">Trigger AI reviews automatically when a pull request is opened.</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={user?.settings?.autoReview}
                                        onChange={(e) => handleUpdatePref('autoReview', e.target.checked)}
                                    />
                                </div>

                                <div className="settings__toggle-group">
                                    <div className="settings__toggle-info">
                                        <span className="settings__toggle-label">Draft Support</span>
                                        <span className="settings__toggle-desc">Enable AI analysis for PRs that are still in draft state.</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={user?.settings?.reviewOnDraft}
                                        onChange={(e) => handleUpdatePref('reviewOnDraft', e.target.checked)}
                                    />
                                </div>

                                <div className="settings__toggle-group">
                                    <div className="settings__toggle-info">
                                        <span className="settings__toggle-label">Status Notifications</span>
                                        <span className="settings__toggle-desc">Receive internal updates upon completion of the analysis cycle.</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={user?.settings?.notifyOnComplete}
                                        onChange={(e) => handleUpdatePref('notifyOnComplete', e.target.checked)}
                                    />
                                </div>
                            </div>
                        </section>
                    )}

                    {activeTab === 'profile' && (
                        <section className="settings__section">
                            <h2 className="settings__section-title">User Profile</h2>
                            <Card variant="bordered">
                                <CardBody>
                                    <div className="settings__form">
                                        <div className="settings__form-group">
                                            <label className="settings__form-label">GitHub Username</label>
                                            <input type="text" className="settings__form-control" value={user?.username} disabled />
                                        </div>
                                        <div className="settings__form-group">
                                            <label className="settings__form-label">Primary Email</label>
                                            <input type="text" className="settings__form-control" value={user?.email} disabled />
                                        </div>
                                        <div className="settings__form-group">
                                            <label className="settings__form-label">Member Since</label>
                                            <p style={{ color: 'var(--color-text-secondary)', padding: 'var(--space-2) 0' }}>
                                                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                }) : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </section>
                    )}
                </main>
            </div>
        </div>
    );
}

export default Settings;
