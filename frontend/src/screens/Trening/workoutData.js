const WorkoutData = {
    workouts: [
        {
            id: 1,
            name: 'Klatka Piersiowa Początkujący',
            difficulty: 'Początkujący',
            time: '15 MIN',
            calories: 200,
            muscleGroup: 'Klatka Piersiowa',
            image: require('../../../assets/TrZdj/Tr1/tr1.png'),
            exercises: [
                {
                    name: 'Pompki zwykłe',
                    repetitions: 10,
                    image: require('../../../assets/TrZdj/Tr1/tr1_ex1.png'),
                },
                {
                    name: 'Deska 30 sekund',
                    repetitions: 5,
                    image: require('../../../assets/TrZdj/Tr1/tr1_ex2.png'),
                },
                {
                    name: 'Wyciskanie hantlami',
                    repetitions: 12,
                    image: require('../../../assets/TrZdj/Tr1/tr1_ex3.png'),
                },
                {
                    name: 'Pompki na jednej ręce',
                    repetitions: 10,
                    image: require('../../../assets/TrZdj/Tr1/tr1_ex4.png'),
                },
            ],
            details: {
                circles: 4,
                totalExercises: 4,
            },
        },
        {
            id: 2,
            name: 'Plecy Początkujący',
            difficulty: 'Początkujący',
            time: '15 MIN',
            calories: 90,
            muscleGroup: 'Plecy',
            image: require('../../../assets/TrZdj/Tr2/tr2.png'),
            exercises: [
                {
                    name: 'Podciąganie nachwytem',
                    repetitions: 10,
                    image: require('../../../assets/TrZdj/Tr2/tr2_ex1.png'),
                },
                {
                    name: 'Przyciąganie linki wyciągu górnego',
                    repetitions: 12,
                    image: require('../../../assets/TrZdj/Tr2/tr2_ex2.png'),
                },
                {
                    name: 'Przyciąganie linki wyciągu dolnego',
                    repetitions: 10,
                    image: require('../../../assets/TrZdj/Tr2/tr2_ex3.png'),
                },
            ],
            details: {
                circles: 3,
                totalExercises: 3,
            },
        },
        {
            id: 3,
            name: 'Nogi Zaawansowany',
            difficulty: 'Zaawansowany',
            time: '25 MIN',
            calories: 150,
            muscleGroup: 'Nogi',
            image: require('../../../assets/TrZdj/Tr3/tr3.png'),
            exercises: [
                {
                    name: 'Przysiady ze sztangą',
                    repetitions: 15,
                    image: require('../../../assets/TrZdj/Tr3/tr3_ex1.png'),
                },
                {
                    name: 'Wykroki z hantlami',
                    repetitions: 10,
                    image: require('../../../assets/TrZdj/Tr3/tr3_ex2.png'),
                },
                {
                    name: 'Wypychanie nogami na suwnicy',
                    repetitions: 12,
                    image: require('../../../assets/TrZdj/Tr3/tr3_ex3.png'),
                },
            ],
            details: {
                circles: 4,
                totalExercises: 3,
            },
        },
        {
            id: 4,
            name: 'Brzuch Zaawansowany',
            difficulty: 'Zaawansowany',
            time: '20 MIN',
            calories: 110,
            muscleGroup: 'Brzuch',
            image: require('../../../assets/TrZdj/Tr4/tr4.png'),
            exercises: [
                {
                    name: 'Brzuszki',
                    repetitions: 20,
                    image: require('../../../assets/TrZdj/Tr4/tr4_ex1.png'),
                },
                {
                    name: 'Deska 30 sekund',
                    repetitions: 5,
                    image: require('../../../assets/TrZdj/Tr4/tr4_ex2.png'),
                },
                {
                    name: 'Deska bokiem 15 sekund',
                    repetitions: 10,
                    image: require('../../../assets/TrZdj/Tr4/tr4_ex3.png'),
                },
            ],
            details: {
                circles: 4,
                totalExercises: 3,
            },
        },
        {
            id: 5,
            name: 'Barki i Ramiona Średniozaawansowany',
            difficulty: 'Średniozaawansowany',
            time: '18 MIN',
            calories: 120,
            muscleGroup: 'Barki i Ramiona',
            image: require('../../../assets/TrZdj/Tr5/tr5.png'),
            exercises: [
                {
                    name: 'Unoszenie sztangi przodem',
                    repetitions: 12,
                    image: require('../../../assets/TrZdj/Tr5/tr5_ex1.png'),
                },
                {
                    name: 'Unoszenie talerza przodem',
                    repetitions: 15,
                    image: require('../../../assets/TrZdj/Tr5/tr5_ex2.png'),
                },
                {
                    name: 'Unoszenie hantli jednorącz przodem',
                    repetitions: 12,
                    image: require('../../../assets/TrZdj/Tr5/tr5_ex3.png'),
                },
                {
                    name: 'Ciągniecie linki wyciągu oburącz',
                    repetitions: 15,
                    image: require('../../../assets/TrZdj/Tr5/tr5_ex4.png'),
                },
            ],
            details: {
                circles: 3,
                totalExercises: 5,
            },
        },
    ],

    getWorkoutsByGoal: function(goal) {
        let sortedWorkouts = [...this.workouts];

        switch(goal) {
            case 'Utrata wagi':
                return sortedWorkouts.sort((a, b) => b.calories - a.calories);

            case 'Przybieranie na wadze':
                return sortedWorkouts.sort((a, b) => a.calories - b.calories);

            case 'Utrzymanie wagi':
                const highIntensity = sortedWorkouts.filter(w => w.calories >= 120);
                const lowIntensity = sortedWorkouts.filter(w => w.calories < 120);

                const mixedWorkouts = [];
                const maxLength = Math.max(highIntensity.length, lowIntensity.length);

                for (let i = 0; i < maxLength; i++) {
                    if (i < highIntensity.length) mixedWorkouts.push(highIntensity[i]);
                    if (i < lowIntensity.length) mixedWorkouts.push(lowIntensity[i]);
                }

                return mixedWorkouts;

            default:
                return sortedWorkouts;
        }
    },

    getWorkoutByName: function(workoutName) {
        return this.workouts.find(workout => workout.name === workoutName);
    }
};

export default WorkoutData;