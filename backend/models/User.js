const mongoose = require('mongoose');
const notificationSchema = require('./Notification');
const productSchema = require('./Product');
const historySchema = require('./History');

const userSchema = new mongoose.Schema({
  login: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  lastName: { type: String, required: true },
  weight: { type: Number, required: true, min: 0 },
  height: { type: Number, required: true, min: 0 },
  stepsGoal: { type: Number, default: 0, min: 0 },
  stepsTaken: { type: Number, default: 0, min: 0 },
  objective: {
    type: String,
    required: true,
    enum: ['Utrata wagi', 'Przybieranie na wadze', 'Utrzymanie wagi']
  },
  exercises: { type: Number, default: 0, min: 0 },
  gender: { type: String, required: true, enum: ['Mężczyzna', 'Kobieta'] },
  dateOfBirth: { type: String, required: true },
  imageUri: { type: String, default: '' },
  history: [historySchema],
  notifications: [notificationSchema],
  eatenProducts: [productSchema],
  lastSyncDate: { type: Date, default: new Date().toISOString().split('T')[0] },
  notificationFlags: {
    birthdaySent: { type: Boolean, default: false },
    stepsGoalSent: { type: Boolean, default: false },
    caloriesGoalSent: { type: Boolean, default: false }
  }
});

module.exports = mongoose.model('User', userSchema);