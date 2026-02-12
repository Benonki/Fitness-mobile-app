import WorkoutData from '../../src/screens/Trening/workoutData';

describe('WorkoutData Logic', () => {

    const originalWorkouts = [...WorkoutData.workouts];

    afterEach(() => {
        WorkoutData.workouts = [...originalWorkouts];
    });

    describe('getWorkoutByName', () => {
        it('powinien zwrócić poprawny trening na podstawie nazwy', () => {
            const result = WorkoutData.getWorkoutByName('Klatka Piersiowa Początkujący');
            expect(result).toBeDefined();
            expect(result.id).toBe(1);
        });

        it('powinien zwrócić undefined dla nieistniejącej nazwy', () => {
            const result = WorkoutData.getWorkoutByName('Nieistniejący Trening');
            expect(result).toBeUndefined();
        });
    });

    describe('getWorkoutsByGoal', () => {
        it('powinien sortować malejąco po kaloriach dla celu "Utrata wagi"', () => {
            const result = WorkoutData.getWorkoutsByGoal('Utrata wagi');
            expect(result[0].calories).toBeGreaterThanOrEqual(result[1].calories);
            expect(result[result.length - 1].calories).toBeLessThanOrEqual(result[0].calories);
        });

        it('powinien przeplatać treningi High i Low intensity dla "Utrzymanie wagi" (gdy High >= Low)', () => {
            const result = WorkoutData.getWorkoutsByGoal('Utrzymanie wagi');

            expect(result[0].calories).toBeGreaterThanOrEqual(120);
            expect(result[1].calories).toBeLessThan(120);
            expect(result[4].calories).toBeGreaterThanOrEqual(120);
        });

        it('powinien przeplatać treningi i obsłużyć nadmiarowe Low intensity (gdy Low > High)', () => {
            WorkoutData.workouts = [
                { id: 101, calories: 200, name: 'High1' },
                { id: 102, calories: 50, name: 'Low1' },
                { id: 103, calories: 60, name: 'Low2' },
            ];

            const result = WorkoutData.getWorkoutsByGoal('Utrzymanie wagi');


            expect(result).toHaveLength(3);
            expect(result[0].calories).toBe(200);
            expect(result[1].calories).toBe(50);
            expect(result[2].calories).toBe(60);
        });

        it('powinien zwrócić domyślną listę dla nieznanego celu', () => {
            const result = WorkoutData.getWorkoutsByGoal('Nieznany cel');
            expect(result).toHaveLength(originalWorkouts.length);
        });
    });
});