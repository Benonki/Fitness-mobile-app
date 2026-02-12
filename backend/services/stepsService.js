const User = require('../models/User');

exports.getSteps = async (userId) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('Uzytkownik nie znaleziony');
    }
    return user.stepsTaken;
};

exports.updateSteps = async (userId, stepsTaken) => {
    const user = await User.findByIdAndUpdate(
        userId,
        { stepsTaken },
        { new: true }
    );

    if (!user) {
        throw new Error('Uzytkownik nie znaleziony');
    }

    return user.stepsTaken;
};