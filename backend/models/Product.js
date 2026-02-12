const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  calories: { type: Number, required: true },
  fat: { type: Number, min: 0, required: false, default: null },
  sugar: { type: Number, min: 0, required: false, default: null },
  proteins: { type: Number, min: 0, required: false, default: null }
}, { _id: false });

module.exports = productSchema;