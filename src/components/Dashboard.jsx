import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useGrants } from '../hooks/useGrants';
import { Timeline } from './Timeline';
import { GrantModal } from './GrantModal';
import './Dashboard.css';

export const Dashboard = () => {
    const { currentUser, userProfile, logout } = useAuth();
    const { grants, loading } = useGrants();
    const [showModal, setShowModal] = useState(false);
    const [editingGrant, setEditingGrant] = useState(null);

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const handleEditGrant = (grant) => {
        setEditingGrant(grant);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingGrant(null);
    };

    // Calculate stats
    const totalGrants = grants.length;
    const activeGrants = grants.filter(g => {
        const now = new Date();
        const start = g.startDate.toDate();
        const end = g.endDate.toDate();
        return now >= start && now <= end;
    }).length;
    const completedGrants = grants.filter(g => {
        const now = new Date();
        const end = g.endDate.toDate();
        return now > end;
    }).length;

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p style={{ fontWeight: 700, fontSize: '1.25rem' }}>LOADING GRANTS...</p>
            </div>
        );
    }

    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <div className="header-content">
                    <h1>📊 Grant Tracker</h1>
                    <div className="header-actions">
                        <span className="user-info">
                            👤 {userProfile?.displayName || currentUser?.email}
                        </span>
                        <button onClick={() => setShowModal(true)} className="btn btn-success">
                            + Add Grant
                        </button>
                        <button onClick={handleLogout} className="btn btn-secondary">
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="dashboard-main">
                {/* Stats Cards */}
                <div className="dashboard-stats">
                    <div className="stat-card">
                        <div className="stat-label">Total Grants</div>
                        <div className="stat-value">{totalGrants}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Active</div>
                        <div className="stat-value" style={{ color: 'var(--color-success)' }}>{activeGrants}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Completed</div>
                        <div className="stat-value" style={{ color: 'var(--color-info)' }}>{completedGrants}</div>
                    </div>
                </div>

                <Timeline grants={grants} onEditGrant={handleEditGrant} />
            </main>

            {showModal && (
                <GrantModal
                    grant={editingGrant}
                    onClose={handleCloseModal}
                />
            )}
        </div>
    );
};
