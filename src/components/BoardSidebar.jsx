import { useState, useEffect } from 'react';
import { subscribeToBoards, deleteBoard } from '../services/database';
import './BoardSidebar.css';

export const BoardSidebar = ({ currentUserId, activeBoardId, onBoardSelect, onCreateBoard, onEditBoard, isOpen, onToggle }) => {
    const [boards, setBoards] = useState([]);

    useEffect(() => {
        if (!currentUserId) return;
        const unsubscribe = subscribeToBoards(currentUserId, (boardsData) => {
            setBoards(boardsData);
        });
        return () => unsubscribe();
    }, [currentUserId]);

    const handleDelete = async (e, boardId) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this workspace and all its grants?')) {
            await deleteBoard(boardId);
            if (activeBoardId === boardId) {
                onBoardSelect(null);
            }
        }
    };

    const handleEdit = (e, board) => {
        e.stopPropagation();
        onEditBoard(board);
    };

    const personalBoards = boards.filter(b => b.ownerId === currentUserId);
    const sharedBoards = boards.filter(b => b.ownerId !== currentUserId);

    return (
        <aside className={`board-sidebar ${isOpen ? 'open' : 'collapsed'}`}>
            <button className="sidebar-toggle" onClick={onToggle}>
                {isOpen ? '◀' : '▶'}
            </button>

            {isOpen && (
                <div className="sidebar-content">
                    <div className="sidebar-header">
                        <h2>Workspaces</h2>
                        <button className="btn-add-board" onClick={onCreateBoard} title="New Workspace">+</button>
                    </div>

                    <div className="board-section">
                        <h3>Private</h3>
                        {personalBoards.map(board => (
                            <div
                                key={board.id}
                                className={`board-item ${activeBoardId === board.id ? 'active' : ''}`}
                                onClick={() => onBoardSelect(board.id)}
                            >
                                <span className="board-name">
                                    <span className="board-icon">📁</span> {board.name}
                                </span>
                                <div className="board-actions">
                                    <button className="board-settings" onClick={(e) => handleEdit(e, board)} title="Board Settings">⚙️</button>
                                    <button className="board-delete" onClick={(e) => handleDelete(e, board.id)} title="Delete Board">&times;</button>
                                </div>
                            </div>
                        ))}
                        {personalBoards.length === 0 && <p className="empty-text">No private workspaces yet.</p>}
                    </div>

                    <div className="board-section">
                        <h3>Shared</h3>
                        {sharedBoards.map(board => (
                            <div
                                key={board.id}
                                className={`board-item ${activeBoardId === board.id ? 'active' : ''}`}
                                onClick={() => onBoardSelect(board.id)}
                            >
                                <span className="board-name">
                                    <span className="board-icon">👥</span> {board.name}
                                </span>
                            </div>
                        ))}
                        {sharedBoards.length === 0 && <p className="empty-text">No shared workspaces yet.</p>}
                    </div>
                </div>
            )}
        </aside>
    );
};
