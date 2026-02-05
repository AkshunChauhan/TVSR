import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useGrants } from '../hooks/useGrants';
import { Timeline } from './Timeline';
import { GrantModal } from './GrantModal';
import { BoardSidebar } from './BoardSidebar';
import { BoardModal } from './BoardModal';
import { ensureDefaultBoard } from '../services/database';
import './Dashboard.css';

export const Dashboard = () => {
    const { currentUser, userProfile, logout } = useAuth();
    const [activeBoardId, setActiveBoardId] = useState(null);
    const { grants, loading } = useGrants(activeBoardId);
    const [showModal, setShowModal] = useState(false);
    const [showBoardModal, setShowBoardModal] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [editingGrant, setEditingGrant] = useState(null);
    const [editingBoard, setEditingBoard] = useState(null);

    // Ensure user has at least one board
    useEffect(() => {
        const initBoard = async () => {
            if (currentUser?.uid && !activeBoardId) {
                const boardId = await ensureDefaultBoard(currentUser.uid);
                setActiveBoardId(boardId);
            }
        };
        initBoard();
    }, [currentUser, activeBoardId]);

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

    const handleEditBoard = (board) => {
        setEditingBoard(board);
        setShowBoardModal(true);
    };

    const handleCloseBoardModal = () => {
        setShowBoardModal(false);
        setEditingBoard(null);
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

    const behindGrants = grants.filter(g => {
        const prog = g.progressDate.toDate();
        prog.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return prog < today;
    }).length;

    const aheadGrants = grants.filter(g => {
        const prog = g.progressDate.toDate();
        prog.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return prog > today;
    }).length;

    const onTimeGrants = grants.filter(g => {
        const prog = g.progressDate.toDate();
        prog.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return prog.getTime() === today.getTime();
    }).length;

    if (loading && !activeBoardId) {
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
                    <h1>TVSR</h1>
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

            <div className={`dashboard-layout ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
                <BoardSidebar
                    currentUserId={currentUser?.uid}
                    activeBoardId={activeBoardId}
                    onBoardSelect={setActiveBoardId}
                    onCreateBoard={() => setShowBoardModal(true)}
                    onEditBoard={handleEditBoard}
                    isOpen={sidebarOpen}
                    onToggle={() => setSidebarOpen(!sidebarOpen)}
                />

                <main className="dashboard-main">
                    {/* Stats Cards */}
                    <div className="dashboard-stats">
                        <div className="stat-card">
                            <div className="stat-label">Total</div>
                            <div className="stat-value">{totalGrants}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Active</div>
                            <div className="stat-value">{activeGrants}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Completed</div>
                            <div className="stat-value">{completedGrants}</div>
                        </div>
                        <div className="stat-card status-behind">
                            <div className="stat-label">Behind</div>
                            <div className="stat-value">{behindGrants}</div>
                        </div>
                        <div className="stat-card status-ontime">
                            <div className="stat-label">On Time</div>
                            <div className="stat-value">{onTimeGrants}</div>
                        </div>
                        <div className="stat-card status-ahead">
                            <div className="stat-label">Ahead</div>
                            <div className="stat-value">{aheadGrants}</div>
                        </div>
                    </div>

                    <Timeline grants={grants} onEditGrant={handleEditGrant} />
                </main>
            </div>

            {showModal && (
                <GrantModal
                    grant={editingGrant}
                    boardId={activeBoardId}
                    onClose={handleCloseModal}
                />
            )}

            {showBoardModal && (
                <BoardModal
                    currentUserId={currentUser?.uid}
                    onClose={handleCloseBoardModal}
                    board={editingBoard}
                    onBoardCreated={setActiveBoardId}
                />
            )}
        </div>
    );
};
