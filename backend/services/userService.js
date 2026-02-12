const User = require('../models/User');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

exports.getUser = async (userId) => {
    const user = await User.findById(userId).select('-password');
    if (!user) {
        throw new Error('Uzytkownik nie znaleziony');
    }

    if (user.imageUri && user.imageUri.startsWith('/uploads/')) {
        const imagePath = path.join(__dirname, '../public', user.imageUri);
        try {
            if (fs.existsSync(imagePath)) {
                const imageBuffer = fs.readFileSync(imagePath);
                const base64Image = imageBuffer.toString('base64');
                const mimeType = path.extname(imagePath).toLowerCase();
                const mimeTypes = {
                    '.jpg': 'image/jpeg',
                    '.jpeg': 'image/jpeg',
                    '.png': 'image/png',
                    '.gif': 'image/gif'
                };

                user.imageUri = `data:${mimeTypes[mimeType] || 'image/jpeg'};base64,${base64Image}`;
            } else {
                user.imageUri = null;
            }
        } catch (error) {
            console.error('Błąd podczas odczytu obrazu:', error);
            user.imageUri = null;
        }
    }

    return user;
};

exports.createUser = async (userData) => {
    const existingUser = await User.findOne({ login: userData.login });
    if (existingUser) {
        throw new Error('Login juz istnieje');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 12);
    const newUser = new User({
        ...userData,
        password: hashedPassword
    });

    await newUser.save();
    return User.findById(newUser._id).select('-password');
};

exports.updateUser = async (userId, updateData) => {
    const currentUser = await User.findById(userId);

    if (updateData.imageUri && updateData.imageUri.startsWith('data:image')) {
        const matches = updateData.imageUri.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
            if (currentUser.imageUri) {
                const oldImagePath = path.join(__dirname, '../public', currentUser.imageUri);
                try {
                    if (fs.existsSync(oldImagePath)) {
                        fs.unlinkSync(oldImagePath);
                        console.log('Poprzednie zdjęcie zostało usunięte:', oldImagePath);
                    }
                } catch (err) {
                    console.error('Błąd podczas usuwania poprzedniego zdjęcia:', err);
                }
            }

            const imageBuffer = Buffer.from(matches[2], 'base64');
            const imageName = `user_${userId}_${Date.now()}.${matches[1].split('/')[1] || 'jpg'}`;
            const imagePath = path.join(__dirname, '../public/uploads', imageName);

            fs.writeFileSync(imagePath, imageBuffer);
            updateData.imageUri = `/uploads/${imageName}`;
            console.log('Nowe zdjęcie zostało zapisane:', imagePath);
        }
    }

    const user = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
        throw new Error('Użytkownik nie znaleziony');
    }

    return user;
};

exports.resetDaily = async (userId) => {
    const today = new Date().toISOString().split('T')[0];

    const currentUser = await User.findById(userId);
    if (!currentUser) {
        throw new Error('Użytkownik nie znaleziony');
    }

    const sumOfCalories = currentUser.eatenProducts.reduce((sum, product) => sum + product.calories, 0);

    const historyEntry = {
        weight: currentUser.weight,
        height: currentUser.height,
        sumOfCalories: sumOfCalories,
        numberOfExercises: currentUser.exercises,
        numberOfSteps: currentUser.stepsTaken,
        date: new Date(currentUser.lastSyncDate)
    };

    const user = await User.findByIdAndUpdate(
        userId,
        {
            $push: { history: historyEntry },
            $set: {
                stepsTaken: 0,
                eatenProducts: [],
                lastSyncDate: today,
                'notificationFlags.birthdaySent': false,
                'notificationFlags.stepsGoalSent': false,
                'notificationFlags.caloriesGoalSent': false
            }
        },
        { new: true }
    ).select('-password');

    return {
        message: 'Dzienne dane zostały zresetowane i dodano wpis do historii',
        user: user
    };
};