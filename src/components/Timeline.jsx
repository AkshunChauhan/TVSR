import { useRef, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useMilestones } from '../hooks/useMilestones';
import { updateGrant, deleteGrant } from '../services/database';
import './Timeline.css';

export const Timeline = ({ grants, onEditGrant }) => {
    const svgRef = useRef(null);
    const timelineRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [dragState, setDragState] = useState({ isDragging: false, grantId: null });
    const [selectedGrant, setSelectedGrant] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [viewMode, setViewMode] = useState('monthly'); // weekly, monthly, 6months, yearly
    const [hoveredDate, setHoveredDate] = useState(null);
    const { currentUser } = useAuth();

    const labelWidth = 250;
    // Adjust timeline width based on view mode for better zoom
    const getTimelineWidth = () => {
        switch (viewMode) {
            case 'weekly':
                return 3000; // Very wide for weekly detail
            case 'monthly':
                return 2400; // Wide for monthly detail
            case '6months':
                return 1800;
            case 'yearly':
                return 1400;
            default:
                return 1400;
        }
    };
    const timelineWidth = getTimelineWidth();
    const padding = { left: 20, right: 100, top: 60, bottom: 20 };
    const rowHeight = 50;
    const rowGap = 0; // No gaps - tight layout

    useEffect(() => {
        const updateDimensions = () => {
            const height = (rowHeight + rowGap) * grants.length + padding.top + padding.bottom;
            setDimensions({ width: timelineWidth, height });
        };
        updateDimensions();
    }, [grants.length]);

    useEffect(() => {
        const interval = setInterval(() => {
            setDimensions(prev => ({ ...prev }));
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    const calculateScale = () => {
        if (grants.length === 0) {
            const now = new Date();
            return {
                minDate: new Date(now.getFullYear(), 0, 1),
                maxDate: new Date(now.getFullYear(), 11, 31),
                totalDays: 365
            };
        }

        let minDate = null;
        let maxDate = null;

        grants.forEach(grant => {
            const start = grant.startDate.toDate();
            const end = grant.endDate.toDate();
            if (!minDate || start < minDate) minDate = start;
            if (!maxDate || end > maxDate) maxDate = end;
        });

        // Adjust padding based on view mode
        const totalMs = maxDate - minDate;
        let paddingMs;
        switch (viewMode) {
            case 'weekly':
                paddingMs = 7 * 24 * 60 * 60 * 1000; // 1 week
                break;
            case 'monthly':
                paddingMs = totalMs * 0.1;
                break;
            case '6months':
                paddingMs = 30 * 24 * 60 * 60 * 1000; // 1 month
                break;
            case 'yearly':
                paddingMs = 60 * 24 * 60 * 60 * 1000; // 2 months
                break;
            default:
                paddingMs = totalMs * 0.1;
        }

        minDate = new Date(minDate.getTime() - paddingMs);
        maxDate = new Date(maxDate.getTime() + paddingMs);
        const totalDays = (maxDate - minDate) / (1000 * 60 * 60 * 24);

        return { minDate, maxDate, totalDays };
    };

    const dateToX = (date, scale) => {
        const availableWidth = timelineWidth - padding.left - padding.right;
        const daysSinceMin = (date - scale.minDate) / (1000 * 60 * 60 * 24);
        const ratio = daysSinceMin / scale.totalDays;
        return padding.left + (ratio * availableWidth);
    };

    const xToDate = (x, scale) => {
        const availableWidth = timelineWidth - padding.left - padding.right;
        const ratio = (x - padding.left) / availableWidth;
        const daysSinceMin = ratio * scale.totalDays;
        return new Date(scale.minDate.getTime() + (daysSinceMin * 24 * 60 * 60 * 1000));
    };

    const canEditGrant = (grant) => {
        return currentUser && grant.assignedUsers.includes(currentUser.uid);
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const handleMouseDown = (e, grantId) => {
        if (e.target.classList.contains('progress-marker-draggable')) {
            setDragState({ isDragging: true, grantId });
            e.preventDefault();
            e.stopPropagation();
        }
    };

    const handleMouseMove = (e) => {
        if (dragState.isDragging && svgRef.current) {
            const grant = grants.find(g => g.id === dragState.grantId);
            if (!grant) return;

            const rect = svgRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const scale = calculateScale();
            const newDate = xToDate(x, scale);

            const minDate = grant.startDate.toDate();
            const maxDate = grant.endDate.toDate();
            const constrainedDate = new Date(Math.max(minDate, Math.min(maxDate, newDate)));

            updateGrant(grant.id, { progressDate: constrainedDate }).catch(err => {
                console.error('Failed to update progress:', err);
            });
        } else if (svgRef.current && !dragState.isDragging) {
            // Show date on hover
            const rect = svgRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const scale = calculateScale();
            const date = xToDate(x, scale);
            setHoveredDate(date);
        }
    };

    const handleMouseUp = () => {
        setDragState({ isDragging: false, grantId: null });
    };

    const handleDeleteGrant = async (grantId) => {
        try {
            await deleteGrant(grantId);
            setShowDeleteConfirm(null);
            setSelectedGrant(null);
        } catch (error) {
            alert('Failed to delete grant: ' + error.message);
        }
    };

    useEffect(() => {
        if (dragState.isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [dragState.isDragging, dragState.grantId]);

    if (grants.length === 0) {
        return (
            <div className="timeline-empty">
                <p>🎯 NO GRANTS YET!</p>
                <p style={{ fontSize: '1rem', marginTop: '1rem', fontWeight: 600 }}>
                    Click "Add Grant" to create your first grant
                </p>
            </div>
        );
    }

    const scale = calculateScale();
    const today = new Date();
    const todayX = dateToX(today, scale);

    // Generate calendar grid lines
    const generateCalendarGrid = () => {
        const lines = [];
        const labels = [];
        let currentDate = new Date(scale.minDate);
        let interval, labelFormat;

        switch (viewMode) {
            case 'weekly':
                interval = 7; // days
                labelFormat = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                break;
            case 'monthly':
                interval = 30; // days
                labelFormat = (d) => d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                break;
            case '6months':
                interval = 30; // days
                labelFormat = (d) => d.toLocaleDateString('en-US', { month: 'short' });
                break;
            case 'yearly':
                interval = 90; // days (quarterly)
                labelFormat = (d) => d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                break;
            default:
                interval = 30;
                labelFormat = (d) => d.toLocaleDateString('en-US', { month: 'short' });
        }

        while (currentDate <= scale.maxDate) {
            const x = dateToX(currentDate, scale);
            lines.push(
                <line
                    key={`grid-${currentDate.getTime()}`}
                    x1={x}
                    y1={padding.top}
                    x2={x}
                    y2={dimensions.height}
                    className="calendar-grid-line"
                />
            );
            labels.push(
                <text
                    key={`label-${currentDate.getTime()}`}
                    x={x}
                    y={padding.top - 10}
                    textAnchor="middle"
                    className="calendar-label"
                >
                    {labelFormat(currentDate)}
                </text>
            );
            currentDate = new Date(currentDate.getTime() + interval * 24 * 60 * 60 * 1000);
        }

        return { lines, labels };
    };

    const { lines: gridLines, labels: gridLabels } = generateCalendarGrid();

    return (
        <div className="timeline-wrapper">
            {/* View Controls */}
            <div className="view-controls">
                <button
                    className={`view-btn ${viewMode === 'weekly' ? 'active' : ''}`}
                    onClick={() => setViewMode('weekly')}
                >
                    WEEKLY
                </button>
                <button
                    className={`view-btn ${viewMode === 'monthly' ? 'active' : ''}`}
                    onClick={() => setViewMode('monthly')}
                >
                    MONTHLY
                </button>
                <button
                    className={`view-btn ${viewMode === '6months' ? 'active' : ''}`}
                    onClick={() => setViewMode('6months')}
                >
                    6 MONTHS
                </button>
                <button
                    className={`view-btn ${viewMode === 'yearly' ? 'active' : ''}`}
                    onClick={() => setViewMode('yearly')}
                >
                    YEARLY
                </button>
            </div>

            <div className="timeline-content">
                {/* Grant Names - Fixed Column */}
                <div className="grant-names-column">
                    <div style={{ height: `${padding.top}px` }}></div>
                    {grants.map((grant, index) => (
                        <div
                            key={grant.id}
                            className="grant-name-item"
                            style={{ height: `${rowHeight}px`, marginBottom: `${rowGap}px` }}
                            onClick={() => setSelectedGrant(grant)}
                        >
                            <span className="grant-name-text">{grant.name}</span>
                        </div>
                    ))}
                </div>

                {/* Timeline - Scrollable */}
                <div
                    className="timeline-scroll-container"
                    ref={timelineRef}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={() => setHoveredDate(null)}
                >
                    <svg
                        ref={svgRef}
                        width={dimensions.width}
                        height={dimensions.height}
                        className="timeline-svg"
                    >
                        {/* Calendar Grid */}
                        {gridLines}
                        {gridLabels}

                        {/* Today Line */}
                        <line
                            x1={todayX}
                            y1={padding.top}
                            x2={todayX}
                            y2={dimensions.height}
                            className="today-line"
                            strokeDasharray="8,8"
                        />
                        <text
                            x={todayX}
                            y={padding.top - 30}
                            textAnchor="middle"
                            className="today-label"
                        >
                            TODAY
                        </text>

                        {/* Grants */}
                        {grants.map((grant, index) => (
                            <GrantRow
                                key={grant.id}
                                grant={grant}
                                y={padding.top + (index * (rowHeight + rowGap))}
                                scale={scale}
                                dateToX={dateToX}
                                formatDate={formatDate}
                                canEdit={canEditGrant(grant)}
                                onMouseDown={handleMouseDown}
                                rowHeight={rowHeight}
                            />
                        ))}
                    </svg>

                    {/* Hover Date Tooltip */}
                    {hoveredDate && !dragState.isDragging && (
                        <div
                            className="date-tooltip"
                            style={{
                                left: `${dateToX(hoveredDate, scale)}px`,
                                top: '10px'
                            }}
                        >
                            {formatDate(hoveredDate)}
                        </div>
                    )}
                </div>
            </div>

            {/* Grant Details Popup */}
            {selectedGrant && (
                <div className="grant-details-overlay" onClick={() => setSelectedGrant(null)}>
                    <div className="grant-details-popup" onClick={(e) => e.stopPropagation()}>
                        <button className="popup-close" onClick={() => setSelectedGrant(null)}>&times;</button>
                        <h3>{selectedGrant.name}</h3>
                        {selectedGrant.description && (
                            <p className="grant-description">{selectedGrant.description}</p>
                        )}
                        <div className="grant-info">
                            <p><strong>Start:</strong> {formatDate(selectedGrant.startDate.toDate())}</p>
                            <p><strong>End:</strong> {formatDate(selectedGrant.endDate.toDate())}</p>
                            <p><strong>Progress:</strong> {formatDate(selectedGrant.progressDate.toDate())}</p>
                        </div>
                        {canEditGrant(selectedGrant) && (
                            <div className="grant-actions">
                                <button
                                    className="btn btn-primary"
                                    onClick={() => {
                                        onEditGrant(selectedGrant);
                                        setSelectedGrant(null);
                                    }}
                                >
                                    ✏️ Edit Grant
                                </button>
                                <button
                                    className="btn btn-danger"
                                    onClick={() => setShowDeleteConfirm(selectedGrant.id)}
                                >
                                    🗑️ Delete Grant
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Delete Confirmation Popup */}
            {showDeleteConfirm && (
                <div className="grant-details-overlay" onClick={() => setShowDeleteConfirm(null)}>
                    <div className="delete-confirm-popup" onClick={(e) => e.stopPropagation()}>
                        <h3>⚠️ Confirm Delete</h3>
                        <p>Are you sure you want to delete this grant?</p>
                        <p className="warning-text">This action cannot be undone!</p>
                        <div className="confirm-actions">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowDeleteConfirm(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={() => handleDeleteGrant(showDeleteConfirm)}
                            >
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const GrantRow = ({ grant, y, scale, dateToX, formatDate, canEdit, onMouseDown, rowHeight }) => {
    const { milestones } = useMilestones(grant.id);

    const startX = dateToX(grant.startDate.toDate(), scale);
    const endX = dateToX(grant.endDate.toDate(), scale);
    const progressX = dateToX(grant.progressDate.toDate(), scale);
    const barY = y + 10;
    const barHeight = rowHeight - 20;

    return (
        <g className="grant-row">
            {/* Solid color bar - background */}
            <rect
                x={startX}
                y={barY}
                width={endX - startX}
                height={barHeight}
                fill={grant.color}
                opacity="0.3"
                rx="0"
                stroke="var(--color-border)"
                strokeWidth="2"
                className="timeline-bar-bg"
            />

            {/* Solid color bar - progress */}
            {progressX > startX && (
                <rect
                    x={startX}
                    y={barY}
                    width={progressX - startX}
                    height={barHeight}
                    fill={grant.color}
                    opacity="1"
                    rx="0"
                    stroke="var(--color-border)"
                    strokeWidth="2"
                    className="timeline-bar-progress"
                />
            )}

            {/* Milestones - Target Markers */}
            {milestones.map(milestone => {
                const x = dateToX(milestone.targetDate.toDate(), scale);
                const cy = barY + barHeight / 2;

                return (
                    <g key={milestone.id} className="milestone">
                        {/* Vertical line to show target date */}
                        <line
                            x1={x}
                            y1={barY - 5}
                            x2={x}
                            y2={barY + barHeight + 5}
                            stroke={grant.color}
                            strokeWidth="2"
                            strokeDasharray="4,2"
                            opacity="0.6"
                        />
                        {/* Circle marker */}
                        <circle
                            cx={x}
                            cy={cy}
                            r="10"
                            className="milestone-circle"
                            stroke={grant.color}
                            fill="var(--color-bg-secondary)"
                        />
                        {/* Milestone number */}
                        <text
                            x={x}
                            y={cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="milestone-number"
                        >
                            {milestone.number}
                        </text>
                        {/* Label above */}
                        <text
                            x={x}
                            y={barY - 10}
                            textAnchor="middle"
                            className="milestone-label"
                        >
                            M{milestone.number}
                        </text>
                        {milestone.label && <title>{`Milestone ${milestone.number}: ${milestone.label}\nTarget: ${formatDate(milestone.targetDate.toDate())}`}</title>}
                    </g>
                );
            })}

            {/* Progress Marker */}
            <polygon
                points={`${progressX},${barY + barHeight / 2 - 10} ${progressX + 10},${barY + barHeight / 2} ${progressX},${barY + barHeight / 2 + 10} ${progressX - 10},${barY + barHeight / 2}`}
                className={`progress-marker ${canEdit ? 'progress-marker-draggable' : ''}`}
                onMouseDown={(e) => canEdit && onMouseDown(e, grant.id)}
                style={{ cursor: canEdit ? 'ew-resize' : 'default', pointerEvents: 'all' }}
            />
        </g>
    );
};
