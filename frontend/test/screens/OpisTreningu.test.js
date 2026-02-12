import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import OpisTreninguScreen from '../../src/screens/OpisTreningu';
import WorkoutData from '../../src/screens/Trening/workoutData';
import { ProductContext } from '../../src/context/ProductContext';

jest.mock('react-native-vector-icons/Ionicons', () => {
    const { View, Text } = require('react-native');
    return {
        __esModule: true,
        default: (props) => {
            const { name, size, color, ...restProps } = props;
            return (
                <View testID={`icon-${name}`} {...restProps}>
                    <Text>{name}</Text>
                </View>
            );
        },
    };
});

jest.mock('../../src/screens/Trening/workoutData', () => ({
    getWorkoutByName: jest.fn(),
}));

jest.mock('expo-secure-store', () => ({
    getItemAsync: jest.fn(),
    setItemAsync: jest.fn(),
    deleteItemAsync: jest.fn(),
}));

jest.mock('expo-notifications', () => ({
    scheduleNotificationAsync: jest.fn(),
}));

jest.mock('react-native/Libraries/Alert/Alert', () => ({
    alert: jest.fn(),
}));

describe('OpisTreninguScreen', () => {
    const mockWorkoutDetails = {
        id: 1,
        name: 'Klatka Piersiowa Początkujący',
        image: { uri: 'mock_main_image' },
        details: {
            circles: 4,
            totalExercises: 6,
        },
        exercises: [
            {
                name: 'Pompki zwykłe',
                repetitions: 10,
                image: { uri: 'mock_exercise_image_1' },
            },
            {
                name: 'Pompki diamentowe',
                repetitions: 8,
                image: { uri: 'mock_exercise_image_2' },
            },
        ],
    };

    let mockAddProduct;
    let mockAlert;

    beforeEach(() => {
        mockAddProduct = jest.fn();
        mockAlert = jest.fn();

        jest.spyOn(require('react-native/Libraries/Alert/Alert'), 'alert').mockImplementation(mockAlert);

        WorkoutData.getWorkoutByName.mockReturnValue(mockWorkoutDetails);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    const renderWithContext = (component) => {
        return render(
            <ProductContext.Provider value={{ addProduct: mockAddProduct }}>
                {component}
            </ProductContext.Provider>
        );
    };


    it('powinien obsługiwać trening bez wartości kalorii', () => {
        const routeWithoutCalories = {
            params: {
                workout: 'Klatka Piersiowa Początkujący',
                time: '15 MIN',
                calories: undefined,
            },
        };

        const { getByText } = renderWithContext(
            <OpisTreninguScreen route={routeWithoutCalories} />
        );

        const addButton = getByText('+');
        fireEvent.press(addButton);

        expect(mockAddProduct).toHaveBeenCalledWith({
            name: 'Trening: Klatka Piersiowa Początkujący',
            calories: -0,
            fat: 0,
            sugar: 0,
            proteins: 0,
        });
    });
});