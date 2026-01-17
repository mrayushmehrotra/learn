import { Outlet } from 'react-router-dom';
import { Header } from '../Header';
import './Layout.css';

export function Layout() {
    return (
        <div className="layout">
            <Header />
            <main className="layout__main">
                <Outlet />
            </main>
            <footer className="layout__footer">
                <div className="layout__footer-container">
                    <p className="layout__copyright">
                        © {new Date().getFullYear()} PullCheck. Automated code review powered by AI.
                    </p>
                    <nav className="layout__footer-links">
                        <a href="/privacy">Privacy</a>
                        <a href="/terms">Terms</a>
                        <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>
                    </nav>
                </div>
            </footer>
        </div>
    );
}

export default Layout;
