import axiosInstance from './axiosInstance';

export const loadStepData = async (userId) => {
    try {
        const response = await axiosInstance.get(`/steps/${userId}`);
        return response.data?.stepsTaken || 0;
    } catch (error) {
        console.error('Error fetching step data:', error);
        return 0;
    }
};

export const saveSteps = async (userId, newSteps) => {
    try {
        await axiosInstance.patch(`/steps/${userId}/update`, { stepsTaken: newSteps });
        return newSteps;
    } catch (error) {
        console.error('Error saving step count:', error);
        return lastSavedStep;
    }
};
