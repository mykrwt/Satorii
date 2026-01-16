import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '@services/firebase';
import { LogIn, UserPlus, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await authService.login(email, password);
            } else {
                await authService.signup(email, password);
            }
            navigate('/');
        } catch (err) {
            console.error('Auth error:', err);
            setError(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        setLoading(true);
        try {
            await authService.loginWithGoogle();
            navigate('/');
        } catch (err) {
            setError('Google sign-in failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page animate-fade">
            <div className="login-card">
                <div className="login-header">
                    <img src="/satorii.png" alt="Satorii" className="login-logo" />
                    <h1>{isLogin ? 'Welcome Back' : 'Join Satorii'}</h1>
                    <p>{isLogin ? 'Enter your details to continue your journey' : 'Create an account to save your favorite rituals'}</p>
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Email Address</label>
                        <div className="input-field">
                            <Mail size={18} className="field-icon" />
                            <input
                                type="email"
                                placeholder="forest@noir.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Password</label>
                        <div className="input-field">
                            <Lock size={18} className="field-icon" />
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="auth-error">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <button type="submit" className="btn-premium filled login-submit" disabled={loading}>
                        {loading ? <Loader2 size={18} className="spin" /> : (isLogin ? <LogIn size={18} /> : <UserPlus size={18} />)}
                        {isLogin ? 'Sign In' : 'Create Account'}
                    </button>
                </form>

                <div className="login-divider">
                    <span>OR</span>
                </div>

                <button className="btn-google" onClick={handleGoogleLogin} disabled={loading}>
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/layout/google.svg" alt="Google" />
                    Continue with Google
                </button>

                <div className="login-footer">
                    <span>{isLogin ? "Don't have an account?" : "Already have an account?"}</span>
                    <button className="toggle-auth" onClick={() => setIsLogin(!isLogin)}>
                        {isLogin ? 'Sign Up' : 'Sign In'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
