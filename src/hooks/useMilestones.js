import { useState, useEffect } from 'react';
import { subscribeToMilestones } from '../services/database';

export const useMilestones = (grantId) => {
    const [milestones, setMilestones] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!grantId) {
            setMilestones([]);
            setLoading(false);
            return;
        }

        const unsubscribe = subscribeToMilestones(grantId, (milestonesData) => {
            setMilestones(milestonesData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [grantId]);

    return { milestones, loading };
};
