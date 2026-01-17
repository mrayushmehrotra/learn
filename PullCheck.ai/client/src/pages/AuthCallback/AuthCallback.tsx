import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores';
import './AuthCallback.css';

export function AuthCallback() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { login } = useAuthStore();

    useEffect(() => {
        const token = searchParams.get('token');
        const expiresIn = searchParams.get('expiresIn');

        console.log('Auth callback params:', {
            hasToken: !!token,
            expiresIn,
            time: new Date().toISOString()
        });

        if (token && expiresIn) {
            try {
                login(token, parseInt(expiresIn, 10));
                console.log('Login successful, navigating to dashboard...');
                navigate('/dashboard', { replace: true });
            } catch (err) {
                console.error('Login failed in callback:', err);
                navigate('/login', { replace: true });
            }
        } else {
            console.warn('Missing token or expiresIn in callback');
            navigate('/login', { replace: true });
        }
    }, [searchParams, login, navigate]);

    return (
        <div className="auth-callback">
            <div className="auth-callback__spinner" />
            <p className="auth-callback__text">Authenticating...</p>
        </div>
    );
}

export default AuthCallback;
