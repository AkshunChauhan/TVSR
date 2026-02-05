import { useState, useEffect } from 'react';
import { createBoard, updateBoard, getAllUsers } from '../services/database';
import './BoardModal.css';

export const BoardModal = ({ currentUserId, onClose, board = null, onBoardCreated }) => {
    const [formData, setFormData] = useState({
        name: board?.name || '',
        type: board?.type || 'personal',
        collaborators: board?.collaborators || [],
    });

    useEffect(() => {
        if (board) {
            setFormData({
                name: board.name || '',
                type: board.type || 'personal',
                collaborators: board.collaborators || [],
            });
        }
    }, [board]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchUsers = async () => {
            const allUsers = await getAllUsers();
            setUsers(allUsers.filter(u => u.id !== currentUserId));
        };
        fetchUsers();
    }, [currentUserId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (board) {
                await updateBoard(board.id, formData);
            } else {
                const newBoardId = await createBoard(formData, currentUserId);
                if (onBoardCreated) onBoardCreated(newBoardId);
            }
            onClose();
        } catch (error) {
            alert('Error saving board: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleCollaborator = (userId) => {
        setFormData(prev => ({
            ...prev,
            collaborators: prev.collaborators.includes(userId)
                ? prev.collaborators.filter(id => id !== userId)
                : [...prev.collaborators, userId]
        }));
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{board ? 'Edit Workspace' : 'New Workspace'}</h2>
                    <button onClick={onClose} className="modal-close">&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label>Workspace Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Q1 Research Grants"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Type</label>
                        <div className="type-toggle">
                            <button
                                type="button"
                                className={`type-btn ${formData.type === 'personal' ? 'active' : ''}`}
                                onClick={() => setFormData({ ...formData, type: 'personal' })}
                            >
                                📁 Private
                            </button>
                            <button
                                type="button"
                                className={`type-btn ${formData.type === 'shared' ? 'active' : ''}`}
                                onClick={() => setFormData({ ...formData, type: 'shared' })}
                            >
                                👥 Collaborative
                            </button>
                        </div>
                    </div>

                    {formData.type === 'shared' && (
                        <div className="form-group">
                            <label>Collaborators</label>
                            <div className="user-list">
                                {users.map(user => (
                                    <label key={user.id} className="user-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={formData.collaborators.includes(user.id)}
                                            onChange={() => toggleCollaborator(user.id)}
                                        />
                                        <span>{user.displayName || user.email}</span>
                                    </label>
                                ))}
                                {users.length === 0 && <p className="empty-text">No other users found.</p>}
                            </div>
                        </div>
                    )}

                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : (board ? 'Update Workspace' : 'Create Workspace')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
