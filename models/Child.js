const mongoose = require('mongoose');

const childSchema = new mongoose.Schema({
  name: { type: String, required: true }
});

module.exports = mongoose.model('Child', childSchema);
