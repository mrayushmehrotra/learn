import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { Button } from '@/components/common';
import './Header.css';

export function Header() {
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <header className="header">
            <div className="header__container">
                <Link to="/" className="header__logo">
                    <svg className="header__logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="header__logo-text">PullCheck</span>
                </Link>

                <nav className="header__nav">
                    {isAuthenticated ? (
                        <>
                            <Link to="/dashboard" className="header__link">Dashboard</Link>
                            <Link to="/reviews" className="header__link">Reviews</Link>
                            <Link to="/settings" className="header__link">Settings</Link>
                        </>
                    ) : (
                        <>
                            <Link to="/features" className="header__link">Features</Link>
                            <Link to="/pricing" className="header__link">Pricing</Link>
                            <Link to="/docs" className="header__link">Docs</Link>
                        </>
                    )}
                </nav>

                <div className="header__actions">
                    {isAuthenticated && user ? (
                        <div className="header__user">
                            <img
                                src={user.avatarUrl}
                                alt={user.username}
                                className="header__avatar"
                            />
                            <span className="header__username">{user.username}</span>
                            <Button variant="ghost" size="sm" onClick={handleLogout}>
                                Logout
                            </Button>
                        </div>
                    ) : (
                        <Link to="/login">
                            <Button>Sign in with GitHub</Button>
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}

export default Header;
