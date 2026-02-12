import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { Pedometer } from 'expo-sensors';
import { UserContext } from './UserContext';
import { loadStepData, saveSteps } from '../api/steps';
import { useNotifications } from "./NotificationContext";
import { setNotificationFlag } from "../api/notifications";

export const StepContext = createContext();

export const StepProvider = ({ children }) => {
    const { user, setUser } = useContext(UserContext);
    const [pedometerAvailability, setPedometerAvailability] = useState(null);
    const [stepCount, setStepCount] = useState(0);
    const stepOffset = useRef(0);
    const [stepCounter, setStepCounter] = useState(null);
    const prevUserId = useRef(null);
    const prevUserSteps = useRef(null);
    const saveInterval = useRef(null);
    const latestStepsToSave = useRef(0);
    const { addUserNotification } = useNotifications();

    const requestPedometerPermission = async () => {
        if (Platform.OS === 'android') {
            const result = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION
            );
            return result === PermissionsAndroid.RESULTS.GRANTED;
        }
        return true;
    };

    const startSaveInterval = (userId) => {
        saveInterval.current = setInterval(async () => {
            if (latestStepsToSave.current > 0) {
                try {
                    await saveSteps(userId, latestStepsToSave.current);
                    latestStepsToSave.current = 0;
                } catch (error) {
                    console.error('Błąd podczas zapisu kroków:', error);
                }
            }
        }, 60000); // 60 sekund
    };

    useEffect(() => {
        if (!user) {
            if (stepCounter) {
                stepCounter.remove();
                setStepCounter(null);
            }
            if (saveInterval.current) {
                clearInterval(saveInterval.current);
                saveInterval.current = null;
            }
            return;
        }

        if (user.id === prevUserId.current && user.stepsGoal === prevUserSteps.current) {
            return;
        }

        prevUserId.current = user.id;
        prevUserSteps.current = user.stepsGoal;

        const startPedometer = async () => {
            const permission = await requestPedometerPermission();
            if (!permission) {
                setPedometerAvailability('Permission not granted');
                return;
            }

            const initialSteps = await loadStepData(user.id);
            stepOffset.current = initialSteps;
            setStepCount(initialSteps);
            latestStepsToSave.current = initialSteps;

            startSaveInterval(user.id);

            const newStepCounter = Pedometer.watchStepCount(result => {
                const newStepCount = stepOffset.current + result.steps;
                setStepCount(newStepCount);
                latestStepsToSave.current = newStepCount;
            });

            setStepCounter(newStepCounter);

            Pedometer.isAvailableAsync().then(
                result => setPedometerAvailability(result ? 'Available' : 'Not available'),
                error => setPedometerAvailability('Error: ' + error)
            );
        };

        startPedometer();

        return () => {
            if (stepCounter) {
                stepCounter.remove();
                setStepCounter(null);
            }
            if (saveInterval.current) {
                clearInterval(saveInterval.current);
                saveInterval.current = null;
            }
        };
    }, [user?.id, user?.stepsGoal]);

    useEffect(() => {
        if (!user || !user.stepsGoal) return;

        const checkStepsGoal = async () => {
            if (stepCount >= user.stepsGoal && !user.notificationFlags?.stepsGoalSent) {
                try {
                    const stepNotification = {
                        id: new Date().getTime(),
                        title: "Gratulacje! 😀",
                        message: "Osiągnąłeś swój cel kroków 👟!!!"
                    };
                    addUserNotification(user.id, stepNotification);
                    setUser({
                        ...user,
                        notificationFlags: {
                            ...user.notificationFlags,
                            stepsGoalSent: true
                        }
                    });
                    await setNotificationFlag(user.id, 'stepsGoalSent', true);
                } catch (error) {
                    console.error('Błąd podczas wysyłania powiadomienia o celu kroków:', error);
                }
            }
        };

        checkStepsGoal();
    }, [user, stepCount, addUserNotification, setUser]);

    return (
        <StepContext.Provider value={{ stepCount, pedometerAvailability }}>
            {children}
        </StepContext.Provider>
    );
};