const User = require('../models/User');
const bcrypt = require('bcryptjs');

const initialUsers = [
  {
    login: "Test",
    password: "Test",
    name: "TestImię",
    lastName: "TestNaz",
    weight: 101,
    height: 200,
    stepsGoal: 20,
    stepsTaken: 0,
    objective: "Przybieranie na wadze",
    exercises: 5,
    gender: "Mężczyzna",
    dateOfBirth: "14.03.2025",
    imageUri: "",
    history: [],
    notifications: [],
    eatenProducts: [],
    notificationFlags: {
      birthdaySent: false,
      stepsGoalSent: false,
      caloriesGoalSent: false
    }
  }
];

const initializeData = async () => {
  try {
    const count = await User.countDocuments();
    if (count === 0) {
      const usersWithHashedPasswords = await Promise.all(
          initialUsers.map(async (user) => {
            const hashedPassword = await bcrypt.hash(user.password, 12);
            return {
              ...user,
                password: hashedPassword
            };
          })
      );

      await User.insertMany(usersWithHashedPasswords);
      console.log('Wprowadzono podstawowe dane');
    }
  } catch (error) {
    console.error('Error podczas wprowadzania podstawowych danych:', error);
  }
};

module.exports = { initializeData };