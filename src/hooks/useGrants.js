import { useState, useEffect } from 'react';
import { subscribeToGrants } from '../services/database';

export const useGrants = () => {
    const [grants, setGrants] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = subscribeToGrants((grantsData) => {
            setGrants(grantsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { grants, loading };
};
