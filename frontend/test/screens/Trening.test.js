import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import TreningScreen from '../../src/screens/Trening';
import { UserContext } from '../../src/context/UserContext';
import WorkoutData from '../../src/screens/Trening/workoutData';

jest.mock('react-native-vector-icons/Ionicons', () => {
    const { View } = require('react-native');
    return (props) => <View testID="icon-mock" {...props} />;
});

jest.mock('../../src/screens/Trening/workoutData', () => ({
    getWorkoutsByGoal: jest.fn(),
}));

describe('TreningScreen', () => {
    const mockNavigation = {
        navigate: jest.fn(),
    };

    const mockUser = {
        objective: 'Utrata wagi',
    };

    const mockWorkouts = [
        {
            id: 1,
            name: 'Trening A',
            muscleGroup: 'Nogi',
            difficulty: 'Trudny',
            time: '30 MIN',
            calories: 300,
            image: { uri: 'test-image' },
        },
        {
            id: 2,
            name: 'Trening B',
            muscleGroup: 'Ręce',
            difficulty: 'Łatwy',
            time: '15 MIN',
            calories: 100,
            image: { uri: 'test-image' },
        }
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        WorkoutData.getWorkoutsByGoal.mockReturnValue(mockWorkouts);
    });

    it('powinien użyć domyślnego celu, jeśli user nie ma celu', () => {
        const userWithoutGoal = {};

        const { getByText } = render(
            <UserContext.Provider value={{ user: userWithoutGoal }}>
                <TreningScreen navigation={mockNavigation} />
            </UserContext.Provider>
        );

        expect(getByText('Propozycje dla celu: Utrzymanie wagi')).toBeTruthy();
        expect(WorkoutData.getWorkoutsByGoal).toHaveBeenCalledWith('Utrzymanie wagi');
    });

    it('powinien nawigować do "Opis Treningu" po kliknięciu w element listy', () => {
        const { getByText } = render(
            <UserContext.Provider value={{ user: mockUser }}>
                <TreningScreen navigation={mockNavigation} />
            </UserContext.Provider>
        );

        const workoutButton = getByText('NOGI');
        fireEvent.press(workoutButton);

        expect(mockNavigation.navigate).toHaveBeenCalledWith('Opis Treningu', {
            workout: 'Trening A',
            time: '30 MIN',
            calories: '300 KCAL'
        });
    });
});