const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
    weight: { type: Number, required: true },
    height: { type: Number, required: true },
    sumOfCalories: { type: Number, default: 0 },
    numberOfExercises: { type: Number, default: 0 },
    numberOfSteps: { type: Number, default: 0 },
    date: { type: Date, required: true }
}, { _id: true });

module.exports = historySchema;