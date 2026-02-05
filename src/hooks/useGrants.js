import { useState, useEffect } from 'react';
import { subscribeToGrants } from '../services/database';

export const useGrants = (boardId) => {
    const [grants, setGrants] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!boardId) {
            setGrants([]);
            setLoading(false);
            return;
        }

        const unsubscribe = subscribeToGrants(boardId, (grantsData) => {
            setGrants(grantsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [boardId]);

    return { grants, loading };
};
