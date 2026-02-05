import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    Timestamp,
    where,
    limit
} from 'firebase/firestore';
import { db } from './firebase';

// ============ INVITE OPERATIONS ============

export const isEmailInvited = async (email) => {
    try {
        const inviteDoc = await getDoc(doc(db, 'invites', email.toLowerCase()));
        return inviteDoc.exists() && !inviteDoc.data().used;
    } catch (error) {
        console.error('Error checking invite:', error);
        return false;
    }
};

export const markInviteUsed = async (email) => {
    try {
        await updateDoc(doc(db, 'invites', email.toLowerCase()), {
            used: true,
            usedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Error marking invite as used:', error);
    }
};

export const createInvite = async (email, invitedBy) => {
    try {
        await setDoc(doc(db, 'invites', email.toLowerCase()), {
            email: email.toLowerCase(),
            invitedBy,
            invitedAt: serverTimestamp(),
            used: false,
            usedAt: null
        });
        return true;
    } catch (error) {
        console.error('Error creating invite:', error);
        return false;
    }
};

// ============ USER OPERATIONS ============

export const createUserProfile = async (userId, email, displayName, isAdmin = false) => {
    try {
        await setDoc(doc(db, 'users', userId), {
            email,
            displayName,
            isAdmin,
            createdAt: serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error('Error creating user profile:', error);
        return false;
    }
};

export const getUserProfile = async (userId) => {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        return userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } : null;
    } catch (error) {
        console.error('Error getting user profile:', error);
        return null;
    }
};

export const getAllUsers = async () => {
    try {
        const snapshot = await getDocs(collection(db, 'users'));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error getting users:', error);
        return [];
    }
};

// ============ GRANT OPERATIONS ============

export const subscribeToGrants = (boardId, callback) => {
    if (!boardId) return () => { };

    const q = query(
        collection(db, 'grants'),
        where('boardId', '==', boardId),
        orderBy('startDate', 'asc')
    );

    return onSnapshot(q,
        (snapshot) => {
            const grants = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(grants);
        },
        (error) => {
            console.error('Error subscribing to grants:', error);
            callback([]);
        }
    );
};

export const createGrant = async (grantData, currentUserId) => {
    try {
        if (!grantData.boardId) throw new Error('Board ID is required');

        const docRef = await addDoc(collection(db, 'grants'), {
            boardId: grantData.boardId,
            name: grantData.name,
            description: grantData.description || '',
            status: grantData.status || 'Active',
            extendedEndDate: grantData.extendedEndDate ? Timestamp.fromDate(grantData.extendedEndDate) : null,
            startDate: Timestamp.fromDate(grantData.startDate),
            endDate: Timestamp.fromDate(grantData.endDate),
            color: grantData.color,
            assignedUsers: grantData.assignedUsers || [currentUserId],
            progressDate: Timestamp.fromDate(grantData.progressDate || grantData.startDate),
            createdBy: currentUserId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error creating grant:', error);
        throw error;
    }
};

export const updateGrant = async (grantId, updates) => {
    try {
        const updateData = { ...updates, updatedAt: serverTimestamp() };

        if (updates.name) {
            updateData.name = updates.name;
        }
        if (updates.description !== undefined) {
            updateData.description = updates.description;
        }
        if (updates.status) {
            updateData.status = updates.status;
        }
        if (updates.extendedEndDate !== undefined) {
            updateData.extendedEndDate = updates.extendedEndDate ? Timestamp.fromDate(updates.extendedEndDate) : null;
        }
        if (updates.startDate) {
            updateData.startDate = Timestamp.fromDate(updates.startDate);
        }
        if (updates.endDate) {
            updateData.endDate = Timestamp.fromDate(updates.endDate);
        }
        if (updates.progressDate) {
            updateData.progressDate = Timestamp.fromDate(updates.progressDate);
        }

        await updateDoc(doc(db, 'grants', grantId), updateData);
        return true;
    } catch (error) {
        console.error('Error updating grant:', error);
        throw error;
    }
};

export const deleteGrant = async (grantId) => {
    try {
        // Delete milestones first
        const milestonesSnapshot = await getDocs(
            collection(db, 'grants', grantId, 'milestones')
        );

        const deletePromises = milestonesSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);

        // Delete grant
        await deleteDoc(doc(db, 'grants', grantId));
        return true;
    } catch (error) {
        console.error('Error deleting grant:', error);
        throw error;
    }
};

// ============ MILESTONE OPERATIONS ============

export const subscribeToMilestones = (grantId, callback) => {
    const q = query(
        collection(db, 'grants', grantId, 'milestones'),
        orderBy('number', 'asc')
    );

    return onSnapshot(q,
        (snapshot) => {
            const milestones = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(milestones);
        },
        (error) => {
            console.error('Error subscribing to milestones:', error);
            callback([]);
        }
    );
};

export const addMilestone = async (grantId, milestoneData) => {
    try {
        const docRef = await addDoc(
            collection(db, 'grants', grantId, 'milestones'),
            {
                number: milestoneData.number,
                targetDate: Timestamp.fromDate(milestoneData.targetDate),
                label: milestoneData.label || '',
                createdAt: serverTimestamp()
            }
        );
        return docRef.id;
    } catch (error) {
        console.error('Error adding milestone:', error);
        throw error;
    }
};

export const updateMilestone = async (grantId, milestoneId, updates) => {
    try {
        const updateData = { ...updates };

        if (updates.targetDate) {
            updateData.targetDate = Timestamp.fromDate(updates.targetDate);
        }

        await updateDoc(
            doc(db, 'grants', grantId, 'milestones', milestoneId),
            updateData
        );
        return true;
    } catch (error) {
        console.error('Error updating milestone:', error);
        throw error;
    }
};

export const deleteMilestone = async (grantId, milestoneId) => {
    try {
        await deleteDoc(doc(db, 'grants', grantId, 'milestones', milestoneId));
        return true;
    } catch (error) {
        console.error('Error deleting milestone:', error);
        throw error;
    }
};

// ============ BOARD OPERATIONS ============

export const subscribeToBoards = (currentUserId, callback) => {
    const personalQuery = query(
        collection(db, 'boards'),
        where('ownerId', '==', currentUserId)
    );

    const sharedQuery = query(
        collection(db, 'boards'),
        where('collaborators', 'array-contains', currentUserId)
    );

    let personalBoards = [];
    let sharedBoards = [];

    const updateCallback = () => {
        callback([...personalBoards, ...sharedBoards]);
    };

    const unsubPersonal = onSnapshot(personalQuery, (snapshot) => {
        personalBoards = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        updateCallback();
    });

    const unsubShared = onSnapshot(sharedQuery, (snapshot) => {
        sharedBoards = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        updateCallback();
    });

    return () => {
        unsubPersonal();
        unsubShared();
    };
};

export const createBoard = async (boardData, currentUserId) => {
    try {
        const docRef = await addDoc(collection(db, 'boards'), {
            name: boardData.name,
            type: boardData.type || 'personal', // 'personal' or 'shared'
            ownerId: currentUserId,
            collaborators: boardData.type === 'shared' ? (boardData.collaborators || []) : [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error creating board:', error);
        throw error;
    }
};

export const updateBoard = async (boardId, updates) => {
    try {
        await updateDoc(doc(db, 'boards', boardId), {
            ...updates,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Error updating board:', error);
        throw error;
    }
};

export const deleteBoard = async (boardId) => {
    try {
        // Delete all grants on this board first
        const grantsQuery = query(collection(db, 'grants'), where('boardId', '==', boardId));
        const grantsSnapshot = await getDocs(grantsQuery);
        const deletePromises = grantsSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);

        await deleteDoc(doc(db, 'boards', boardId));
    } catch (error) {
        console.error('Error deleting board:', error);
        throw error;
    }
};

// Migration Helper & Default Board
export const ensureDefaultBoard = async (currentUserId) => {
    const q = query(
        collection(db, 'boards'),
        where('ownerId', '==', currentUserId),
        limit(1)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        // Create first board
        const boardId = await createBoard({
            name: 'My Workspace',
            type: 'personal'
        }, currentUserId);

        // Migrate orphans (grants without boardId)
        const orphanQuery = query(collection(db, 'grants'), where('createdBy', '==', currentUserId));
        const orphanSnapshot = await getDocs(orphanQuery);
        const migratePromises = orphanSnapshot.docs
            .filter(d => !d.data().boardId)
            .map(d => updateDoc(d.ref, { boardId }));
        await Promise.all(migratePromises);

        return boardId;
    }
    return snapshot.docs[0].id;
};
