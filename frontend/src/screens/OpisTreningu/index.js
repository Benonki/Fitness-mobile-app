import React, { useContext, useState, useEffect } from 'react';
import {Text, View, FlatList, Image, TouchableOpacity, Alert} from 'react-native';
import styles from './StyleSheet.js';
import Icon from 'react-native-vector-icons/Ionicons';
import WorkoutData from '../Trening/workoutData';
import { ProductContext } from '../../context/ProductContext';

const OpisTreninguScreen = ({ route }) => {
    const { workout, time, calories } = route.params;
    const workoutDetails = WorkoutData.getWorkoutByName(workout);
    const { addProduct } = useContext(ProductContext);
    const [isAdded, setIsAdded] = useState(false);

    useEffect(() => {
        setIsAdded(false);
    }, []);

    if (!workoutDetails) {
        return (
            <View style={styles.container}>
                <Text>Trening nie znaleziony</Text>
            </View>
        );
    }

    const handleAddTraining = () => {
        if (isAdded) return;

        const trainingProduct = {
            name: `Trening: ${workout}`,
            calories: -Math.abs(parseFloat(calories) || 0),
            fat: 0,
            sugar: 0,
            proteins: 0,
        };

        addProduct(trainingProduct);
        setIsAdded(true);
        Alert.alert('Sukces', `Dodano trening: ${workout}`);
    };

    return (
        <View style={styles.container}>
            <View style={styles.imageContainer}>
                <Image source={workoutDetails.image} style={styles.headerImage} />
                <Text style={styles.title}>{workout.toUpperCase()}</Text>
            </View>
            <View style={styles.timeContainer}>
                <Icon name="time-outline" size={30} color="white" />
                <Text style={styles.timeText}>{time}</Text>
            </View>
            <View style={styles.caloriesContainer}>
                <Icon name="flame-outline" size={30} color="white" />
                <Text style={styles.caloriesText}>{calories}</Text>
            </View>
            <View style={styles.infoContainer}>
                <Text style={styles.infoText}>
                    Ilość obwodów: {workoutDetails.details.circles}
                </Text>
                <Text style={styles.infoText}>
                    Ilość ćwiczeń: {workoutDetails.details.totalExercises}
                </Text>
            </View>
            <FlatList
                data={workoutDetails.exercises}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                    <View style={styles.exerciseItem}>
                        <Image source={item.image} style={styles.exerciseImage} resizeMode="contain" />
                        <View style={styles.exerciseTextContainer}>
                            <Text style={styles.exerciseName}>{item.name}</Text>
                            <Text style={styles.exerciseReps}>
                                Liczba powtórzeń: {item.repetitions}
                            </Text>
                        </View>
                    </View>
                )}
            />

            <TouchableOpacity
                style={[styles.addTrainingButton, isAdded && styles.addTrainingButtonAdded]}
                onPress={handleAddTraining}
                disabled={isAdded}
            >
                {isAdded ? (
                    <Icon name="checkmark-circle" size={30} color="#4CAF50" />
                ) : (
                    <Text style={styles.addTrainingButtonText}>+</Text>
                )}
            </TouchableOpacity>
        </View>
    );
};

export default OpisTreninguScreen;