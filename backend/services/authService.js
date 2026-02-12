const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.verifyToken = async (token) => {
    if (!token) {
        throw new Error('Brak tokena autoryzacyjnego');
    }

    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Token wygasł');
        }
        throw new Error('Nieprawidłowy token');
    }
};

exports.getUserInfo = async (userLogin, token) => {
    if (!userLogin) {
        throw new Error('Login użytkownika jest wymagany');
    }

    await this.verifyToken(token);

    const user = await User.findOne({ login: userLogin });
    if (!user) {
        throw new Error('Użytkownik nie znaleziony');
    }

    return {
        id: user._id,
        login: user.login,
        name: user.name,
        lastName: user.lastName,
        weight: user.weight,
        height: user.height,
        stepsGoal: user.stepsGoal,
        stepsTaken: user.stepsTaken,
        objective: user.objective,
        exercises: user.exercises,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        imageUri: user.imageUri,
        lastSyncDate: user.lastSyncDate,
        history: user.history || [],
        notifications: user.notifications || [],
        eatenProducts: user.eatenProducts || [],
        notificationFlags: user.notificationFlags || {
            birthdaySent: false,
            stepsGoalSent: false,
            caloriesGoalSent: false
        }
    };
};

exports.login = async (login, password) => {
    if (!login || !password) {
        throw new Error('Wszystkie pola muszą być wypełnione');
    }

    const user = await User.findOne({ login });
    if (!user) {
        throw new Error('Nieprawidłowy login lub hasło');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new Error('Nieprawidłowy login lub hasło');
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

    return {
        success: true,
        token,
        user: {
            id: user._id,
            login: user.login,
            name: user.name,
            lastName: user.lastName,
            weight: user.weight,
            height: user.height,
            stepsGoal: user.stepsGoal,
            stepsTaken: user.stepsTaken,
            objective: user.objective,
            exercises: user.exercises,
            gender: user.gender,
            dateOfBirth: user.dateOfBirth,
            imageUri: user.imageUri,
            lastSyncDate: user.lastSyncDate,
            history: user.history || [],
            notifications: user.notifications || [],
            eatenProducts: user.eatenProducts || [],
            notificationFlags: user.notificationFlags || {
                birthdaySent: false,
                stepsGoalSent: false,
                caloriesGoalSent: false
            }
        }
    };
};

exports.checkLoginAvailability = async (login) => {
    if (!login) {
        throw new Error('Login jest wymagany');
    }

    const user = await User.findOne({ login });
    return {
        success: true,
        available: !user
    };
};