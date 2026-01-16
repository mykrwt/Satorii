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
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            if (isLogin) {
                const userCredential = await authService.login(email, password);
                if (!userCredential.user.emailVerified) {
                    setSuccess('Please verify your email address. A link has been sent to your inbox.');
                } else {
                    navigate('/');
                }
            } else {
                await authService.signup(email, password);
                setSuccess('Account created! Please check your email for a verification link.');
                setIsLogin(true);
            }
        } catch (err) {
            console.error('Auth error:', err);
            setError(err.message || 'Authentication failed');
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

                    {success && (
                        <div className="auth-success" style={{ color: 'var(--accent-secondary)', background: 'rgba(100, 255, 218, 0.1)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--accent-secondary)' }}>
                            <AlertCircle size={16} />
                            <span>{success}</span>
                        </div>
                    )}

                    <button type="submit" className="btn-premium filled login-submit" disabled={loading}>
                        {loading ? <Loader2 size={18} className="spin" /> : (isLogin ? <LogIn size={18} /> : <UserPlus size={18} />)}
                        {isLogin ? 'Sign In' : 'Create Account'}
                    </button>
                </form>

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
