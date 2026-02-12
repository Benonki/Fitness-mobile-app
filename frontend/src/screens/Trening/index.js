import React, { useContext } from 'react';
import {Text, View, Image, TouchableOpacity, ScrollView, Linking} from 'react-native';
import styles from './StyleSheet.js';
import Icon from 'react-native-vector-icons/Ionicons';
import { UserContext } from '../../context/UserContext';
import WorkoutData from './workoutData';

const TreningScreen = ({ navigation }) => {
    const { user } = useContext(UserContext);
    const userGoal = user?.objective || 'Utrzymanie wagi';

    const sortedWorkouts = WorkoutData.getWorkoutsByGoal(userGoal);

    const navigateToOpisTreningu = (workout) => {
        navigation.navigate('Opis Treningu', {
            workout: workout.name,
            time: workout.time,
            calories: `${workout.calories} KCAL`
        });
    };

    const handleFreepikPress = () => {
        Linking.openURL('https://www.freepik.com/');
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.dietTitleContainer}>
                    <Text style={styles.dietTitle}>Propozycje dla celu: {userGoal}</Text>
                </View>

                {sortedWorkouts.map(workout => (
                    <TouchableOpacity
                        key={workout.id}
                        style={styles.workoutItem}
                        onPress={() => navigateToOpisTreningu(workout)}
                    >
                        <Image source={workout.image} style={styles.image} />
                        <Text style={styles.title}>{workout.muscleGroup.toUpperCase()}</Text>
                        <Text style={styles.subtitle}>{workout.difficulty.toUpperCase()}</Text>
                        <View style={styles.detailsContainer}>
                            <View style={styles.iconTextContainer}>
                                <Icon name="time-outline" size={20} color="black" />
                                <Text style={styles.time}>{workout.time}</Text>
                            </View>
                            <View style={styles.iconTextContainer}>
                                <Icon name="flame-outline" size={20} color="black" />
                                <Text style={styles.calories}>{workout.calories} KCAL</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}

                <TouchableOpacity onPress={handleFreepikPress} style={styles.freepikContainer}>
                    <Text style={styles.freepikText}>
                        Designed by <Text style={styles.freepikBlue}>Freepik</Text>
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

export default TreningScreen;