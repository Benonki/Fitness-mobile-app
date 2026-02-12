import axiosInstance from './axiosInstance';

export const isLoginAvailable = async (login) => {
    try {
        const response = await axiosInstance.get('/auth/check-login', {
            params: { login }
        });
        return response.data.available;
    } catch (error) {
        console.error('Błąd podczas sprawdzania dostępności loginu:', error);
        return false;
    }
}

export const registerUser = async (userData, acceptedTerms, setMessage, setVisible, navigation) => {
    if (!userData.login || !userData.password || !userData.confirmPassword || !userData.name || !userData.lastName || !userData.weight || !userData.height || !userData.stepsGoal || !userData.dateOfBirth || !userData.exercises) {
        setMessage('Wszystkie pola muszą być wypełnione');
        setVisible(true);
        return;
    }

    if (userData.password !== userData.confirmPassword) {
        setMessage('Hasła nie pasują');
        setVisible(true);
        return;
    }

    const loginAvailable = await isLoginAvailable(userData.login);
    if (!loginAvailable) {
        setMessage('Login jest już zajęty');
        setVisible(true);
        return;
    }

    if (!acceptedTerms) {
        setMessage('Musisz zaakceptować warunki użytkowania');
        setVisible(true);
        return;
    }

    if (parseFloat(userData.weight) <= 0 || parseFloat(userData.height) <= 0) {
        setMessage('Waga, wzrost muszą być większe niż 0');
        setVisible(true);
        return false;
    }

    if (parseInt(userData.stepsGoal) < 0 || parseInt(userData.exercises) < 0) {
        setMessage('Liczba kroków i liczba treningów nie mogą być ujemne');
        setVisible(true);
        return false;
    }

    const newUser = {
        login: userData.login,
        password: userData.password,
        name: userData.name,
        lastName: userData.lastName,
        weight: parseFloat(userData.weight),
        height: parseFloat(userData.height),
        stepsGoal: parseInt(userData.stepsGoal),
        stepsTaken: 0,
        objective: userData.objective,
        exercises: parseInt(userData.exercises),
        gender: userData.gender,
        dateOfBirth: userData.dateOfBirth,
        imageUri: userData.imageUri || "",
        history: [],
        notifications: [],
        eatenProducts: [],
        notificationFlags: {
            birthdaySent: false,
            stepsGoalSent: false,
            caloriesGoalSent: false
        }
    };

    try {
        await axiosInstance.post('/users', newUser);
        setMessage('Rejestracja zakończona sukcesem');
        setVisible(true);
        navigation.navigate('Login');
    } catch (error) {
        console.error('Błąd podczas zapisywania danych logowania:', error);
        console.error('Pełny błąd:', error.response?.data || error.message);
        setMessage('Wystąpił błąd podczas rejestracji');
        setVisible(true);
    }
};