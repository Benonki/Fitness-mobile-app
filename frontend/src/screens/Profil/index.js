import React, { useState, useEffect, useContext } from 'react';
import { Text, View, TextInput, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';
import { UserContext } from '../../context/UserContext';
import styles from './StyleSheet.js';
import * as FileSystem from 'expo-file-system';
import { getUserData, updateUserData } from '../../api/accounts';
import { handleLogout } from '../../api/auth'

const ProfilScreen = ({ navigation }) => {
    const { user, setUser } = useContext(UserContext);
    const [userData, setUserData] = useState(null);
    const [bmi, setBmi] = useState(0);
    const [gender, setGender] = useState('');
    const [goal, setGoal] = useState('');
    const [image, setImage] = useState(null);
    const [visibilityDatePicker, setVisibilityDatePicker] = useState(false);

    const showDatePicker = () => { setVisibilityDatePicker(true); };
    const hideDatePicker = () => { setVisibilityDatePicker(false); };

    const handleDateConfirm = (date) => {
        const formattedDate = date.toLocaleDateString('pl-PL');
        handleChange('dateOfBirth', formattedDate);
        hideDatePicker();
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert('Nie przyznano uprawnień', 'Proszę uruchomić uprawnienia do zdjęć');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            try {
                const base64Image = await FileSystem.readAsStringAsync(result.assets[0].uri, {
                    encoding: FileSystem.EncodingType.Base64,
                });

                setImage(`data:image/jpeg;base64,${base64Image}`);
                handleChange('imageUri', `data:image/jpeg;base64,${base64Image}`);
            } catch (error) {
                console.error('Błąd podczas przetwarzania obrazu:', error);
                Alert.alert('Błąd', 'Nie udało się załadować obrazu');
            }
        }
    };

    const calculateBmi = (weight, height) => {
        const bmiValue = (weight / ((height / 100) ** 2)).toFixed(2);
        setBmi(bmiValue);
    };

    useEffect(() => {
        if(!user) return;
        const fetchData = async () => {
            try {
                const userData = await getUserData(user.id);
                setUserData(userData);
                setGender(userData.gender);
                setImage(userData.imageUri);
                setGoal(userData.objective);
                calculateBmi(userData.weight, userData.height);
            } catch (error) {
                Alert.alert('Błąd', 'Nie udało się załadować danych użytkownika');
            }
        };

        fetchData();
    }, [user]);

    const handleChange = (key, value) => {
        if (userData) {
            if (key === 'weight' || key === 'height') {
                if (value < 0) {
                    Alert.alert('Błąd', 'Waga i wzrost nie mogą być ujemne');
                    return;
                }
                calculateBmi(
                    key === 'weight' ? value : userData.weight,
                    key === 'height' ? value : userData.height
                );
            }

            if (key === 'exercises' || key === 'stepsGoal') {
                if (value < 0) {
                    Alert.alert('Błąd', 'Kroki i ilość treningów nie mogą być ujemne');
                    return;
                }
            }

            const updatedData = { ...userData, [key]: value };
            setUserData(updatedData);
        }
    };

    const updateUser = async () => {
        try {
            const updatedData = await updateUserData(user.id, userData);
            setUser(updatedData);
            Alert.alert('Sukces', 'Dane zostały zaktualizowane');
        } catch (error) {
            Alert.alert('Błąd', 'Nie udało się zaktualizować danych');
        }
    };

    const handleLogoutPress = () => {
        handleLogout(setUser, navigation);
    };

    if (!userData) {
        return (
            <View style={styles.container}>
                <Text style={styles.header}>Ładowanie danych...</Text>
                <TouchableOpacity style={styles.button} onPress={handleLogout}>
                    <Text style={styles.buttonText}>Wyloguj się</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
            <ScrollView contentContainerStyle>
                <Text style={styles.header}>Cele związane z aktywnością</Text>

                <View style={styles.formGroup}>
                    <Text>Kroki:</Text>
                    <TextInput
                        style={styles.inputCele}
                        keyboardType="numeric"
                        value={String(userData.stepsGoal)}
                        onChangeText={(text) => handleChange('stepsGoal', parseInt(text) || 0)}
                    />
                </View>

                <View>
                    <TouchableOpacity onPress={pickImage} style={styles.touchable}>
                        {image ?(<Image
                                    source={{uri:image}}
                                    style={styles.image}
                                    resizeMode="cover"
                                    />)
                                :(<Image
                                    source={require('../../../assets/personImage.png')}
                                    style={styles.image}
                                    resizeMode="cover"
                                    />)}
                    </TouchableOpacity>
                </View>

                <View style={styles.formGroup}>
                    <Text>Liczba treningów w tygodniu:</Text>
                    <TextInput
                        style={styles.inputCele}
                        keyboardType="numeric"
                        value={String(userData.exercises)}
                        onChangeText={(text) => handleChange('exercises', parseInt(text) || 0)}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text>Cel treningowy:</Text>
                    <View style={styles.pickerWrapperCele}>
                        <Picker
                            selectedValue={goal}
                            style={styles.pickerInput}
                            onValueChange={(itemValue) => {
                                setGoal(itemValue);
                                handleChange('objective', itemValue);
                            }}
                        >
                            <Picker.Item label="Przybieranie na wadze" value="Przybieranie na wadze" />
                            <Picker.Item label="Utrata wagi" value="Utrata wagi" />
                            <Picker.Item label="Utrzymanie wagi" value="Utrzymanie wagi" />
                        </Picker>
                    </View>
                </View>

                <Text style={styles.header}>Informacje o Tobie</Text>

                <View style={styles.inputRow}>
                    <View style={styles.inputWrapper}>
                        <Text>Imię:</Text>
                        <TextInput
                            style={styles.inputInfo}
                            value={userData.name}
                            onChangeText={(text) => handleChange('name', text)}
                        />
                    </View>

                    <View style={styles.inputWrapper}>
                        <Text>Nazwisko:</Text>
                        <TextInput
                            style={styles.inputInfo}
                            value={userData.lastName}
                            onChangeText={(text) => handleChange('lastName', text)}
                        />
                    </View>
                </View>

                <View style={styles.inputRow}>
                    <View style={styles.inputWrapper}>
                        <Text>Waga (kg):</Text>
                        <TextInput
                            style={styles.inputInfo}
                            keyboardType="numeric"
                            value={String(userData.weight)}
                            onChangeText={(text) => handleChange('weight', parseFloat(text) || 0)}
                        />
                    </View>

                    <View style={styles.inputWrapper}>
                        <Text>Wzrost (cm):</Text>
                        <TextInput
                            style={styles.inputInfo}
                            keyboardType="numeric"
                            value={String(userData.height)}
                            onChangeText={(text) => handleChange('height', parseFloat(text) || 0)}
                        />
                    </View>
                </View>

                <View style={styles.inputRow}>
                    <View style={styles.inputWrapper}>
                        <Text>Płeć:</Text>
                        <View style={styles.pickerWrapperInfo}>
                            <Picker
                                selectedValue={gender}
                                style={styles.pickerInput}
                                onValueChange={(itemValue) => {
                                    setGender(itemValue);
                                    handleChange('gender', itemValue);
                                }}
                            >
                                <Picker.Item label="Mężczyzna" value="Mężczyzna" />
                                <Picker.Item label="Kobieta" value="Kobieta" />
                            </Picker>
                        </View>
                    </View>

                    <View style={styles.inputWrapper}>
                    <Text>Data urodzenia:</Text>
                    <TouchableOpacity onPress={showDatePicker} style={styles.inputInfo}>
                        <Text>
                            {userData.dateOfBirth ? userData.dateOfBirth : 'Wybierz datę'}
                        </Text>
                    </TouchableOpacity>
                    <DateTimePickerModal
                        isVisible={visibilityDatePicker}
                        mode="date"
                        onConfirm={(date) => {
                            handleDateConfirm(date);
                        }}
                        onCancel={hideDatePicker}
                    />
                </View>

                </View>

                <View style={styles.bmiContainer}>
                    <Text>Twój wskaźnik masy ciała (BMI) wynosi:</Text>
                    <Text style={styles.bmiValue}>{bmi}</Text>
                    <Text>
                        Twoje BMI wskazuje: {bmi < 18.5 ? 'Niedowaga' : bmi <= 24.9 ? 'Waga prawidłowa' : bmi <= 29.9 ? 'Nadwaga': 'Otylość'}
                    </Text>
                </View>

                <TouchableOpacity style={styles.button} onPress={updateUser}>
                    <Text style={styles.buttonText}>Zapisz zmiany</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={handleLogoutPress}>
                    <Text style={styles.buttonText}>Wyloguj się</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default ProfilScreen;
