import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

export const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        displayName: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, signup } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await login(formData.email, formData.password);
                navigate('/');
            } else {
                // Validation
                if (!formData.displayName.trim()) {
                    throw new Error('Please enter your name');
                }
                if (formData.password.length < 6) {
                    throw new Error('Password must be at least 6 characters');
                }
                if (formData.password !== formData.confirmPassword) {
                    throw new Error('Passwords do not match');
                }

                await signup(formData.email, formData.password, formData.displayName);
                navigate('/');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    <h1 className="auth-title">Grant Tracker</h1>
                    <p className="auth-subtitle">Visualize project timelines and track progress</p>

                    <form onSubmit={handleSubmit} className="auth-form">
                        <h2>{isLogin ? 'Sign In' : 'Create Account'}</h2>

                        {!isLogin && (
                            <>
                                <p className="invite-notice">⚠️ Signup is invite-only. Your email must be pre-approved.</p>
                                <div className="form-group">
                                    <label htmlFor="displayName">Display Name</label>
                                    <input
                                        type="text"
                                        id="displayName"
                                        name="displayName"
                                        value={formData.displayName}
                                        onChange={handleChange}
                                        placeholder="Your Name"
                                        required
                                    />
                                </div>
                            </>
                        )}

                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="your.email@organization.com"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder={isLogin ? 'Enter your password' : 'Create a password (min 6 characters)'}
                                required
                            />
                        </div>

                        {!isLogin && (
                            <div className="form-group">
                                <label htmlFor="confirmPassword">Confirm Password</label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Confirm your password"
                                    required
                                />
                            </div>
                        )}

                        {error && <div className="error-message">{error}</div>}

                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Create Account')}
                        </button>

                        <p className="auth-toggle">
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <button
                                type="button"
                                onClick={() => {
                                    setIsLogin(!isLogin);
                                    setError('');
                                }}
                                className="link-button"
                            >
                                {isLogin ? 'Sign up' : 'Sign in'}
                            </button>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};
