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
    Timestamp
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

export const subscribeToGrants = (callback) => {
    const q = query(collection(db, 'grants'), orderBy('startDate', 'asc'));

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
        const docRef = await addDoc(collection(db, 'grants'), {
            name: grantData.name,
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
