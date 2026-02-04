import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createGrant, updateGrant, getAllUsers, addMilestone, deleteMilestone, updateMilestone } from '../services/database';
import { colorGenerator } from '../services/colorGenerator';
import { useTheme } from '../hooks/useTheme';
import { useMilestones } from '../hooks/useMilestones';
import './GrantModal.css';

export const GrantModal = ({ onClose, grant = null }) => {
    const { currentUser } = useAuth();
    const isDark = useTheme();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const { milestones: existingMilestones } = useMilestones(grant?.id);

    const [formData, setFormData] = useState({
        name: grant?.name || '',
        startDate: grant?.startDate ? grant.startDate.toDate().toISOString().split('T')[0] : '',
        endDate: grant?.endDate ? grant.endDate.toDate().toISOString().split('T')[0] : '',
        assignedUsers: grant?.assignedUsers || [currentUser?.uid],
    });
    const [milestones, setMilestones] = useState([]);

    useEffect(() => {
        const fetchUsers = async () => {
            const allUsers = await getAllUsers();
            setUsers(allUsers);
        };
        fetchUsers();
    }, []);

    useEffect(() => {
        if (grant && existingMilestones.length > 0) {
            setMilestones(existingMilestones.map(m => ({
                id: m.id,
                number: m.number,
                targetDate: m.targetDate.toDate().toISOString().split('T')[0],
                label: m.label || ''
            })));
        }
    }, [grant, existingMilestones]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleUserToggle = (userId) => {
        setFormData(prev => ({
            ...prev,
            assignedUsers: prev.assignedUsers.includes(userId)
                ? prev.assignedUsers.filter(id => id !== userId)
                : [...prev.assignedUsers, userId]
        }));
    };

    const addMilestoneField = () => {
        setMilestones([...milestones, { number: milestones.length + 1, targetDate: '', label: '' }]);
    };

    const updateMilestoneField = (index, field, value) => {
        const updated = [...milestones];
        updated[index][field] = value;
        setMilestones(updated);
    };

    const removeMilestoneField = async (index) => {
        const milestone = milestones[index];
        if (grant && milestone.id) {
            await deleteMilestone(grant.id, milestone.id);
        }
        setMilestones(milestones.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!formData.name || !formData.startDate || !formData.endDate) {
                throw new Error('Please fill in all required fields');
            }

            const startDate = new Date(formData.startDate);
            const endDate = new Date(formData.endDate);

            if (endDate <= startDate) {
                throw new Error('End date must be after start date');
            }

            if (grant) {
                // Update existing grant
                await updateGrant(grant.id, {
                    name: formData.name,
                    startDate,
                    endDate,
                    assignedUsers: formData.assignedUsers
                });

                // Update milestones
                for (const milestone of milestones) {
                    if (milestone.targetDate) {
                        if (milestone.id) {
                            await updateMilestone(grant.id, milestone.id, {
                                number: milestone.number,
                                targetDate: new Date(milestone.targetDate),
                                label: milestone.label
                            });
                        } else {
                            await addMilestone(grant.id, {
                                number: milestone.number,
                                targetDate: new Date(milestone.targetDate),
                                label: milestone.label
                            });
                        }
                    }
                }
            } else {
                // Create new grant
                const color = colorGenerator.getColorForGrant(Date.now().toString(), isDark);
                const grantData = {
                    name: formData.name,
                    startDate,
                    endDate,
                    color,
                    assignedUsers: formData.assignedUsers,
                    progressDate: startDate
                };

                const grantId = await createGrant(grantData, currentUser.uid);

                // Add milestones
                for (const milestone of milestones) {
                    if (milestone.targetDate) {
                        await addMilestone(grantId, {
                            number: milestone.number,
                            targetDate: new Date(milestone.targetDate),
                            label: milestone.label
                        });
                    }
                }
            }

            onClose();
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{grant ? '✏️ EDIT GRANT' : '➕ CREATE NEW GRANT'}</h2>
                    <button onClick={onClose} className="modal-close">&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label htmlFor="name">Grant Name *</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g., Research Grant 2026"
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="startDate">Start Date *</label>
                            <input
                                type="date"
                                id="startDate"
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="endDate">End Date *</label>
                            <input
                                type="date"
                                id="endDate"
                                name="endDate"
                                value={formData.endDate}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Assigned Users</label>
                        <div className="user-list">
                            {users.map(user => (
                                <label key={user.id} className="user-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={formData.assignedUsers.includes(user.id)}
                                        onChange={() => handleUserToggle(user.id)}
                                    />
                                    <span>{user.displayName || user.email}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <div className="milestones-header">
                            <label>Milestones</label>
                            <button type="button" onClick={addMilestoneField} className="btn btn-small btn-success">
                                + Add Milestone
                            </button>
                        </div>
                        <div className="milestones-list">
                            {milestones.map((milestone, index) => (
                                <div key={index} className="milestone-item">
                                    <span className="milestone-number">{milestone.number}</span>
                                    <input
                                        type="date"
                                        value={milestone.targetDate}
                                        onChange={(e) => updateMilestoneField(index, 'targetDate', e.target.value)}
                                        placeholder="Target Date"
                                    />
                                    <input
                                        type="text"
                                        value={milestone.label}
                                        onChange={(e) => updateMilestoneField(index, 'label', e.target.value)}
                                        placeholder="Label (optional)"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeMilestoneField(index)}
                                        className="btn-remove"
                                    >
                                        &times;
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'SAVING...' : (grant ? 'UPDATE GRANT' : 'CREATE GRANT')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
