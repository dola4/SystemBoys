const mongoose = require('mongoose');
children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Child' }]

const actionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  value: { type: Number, required: true },
  children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Child' }] // <--- tableau d'enfants!
});

module.exports = mongoose.model('Action', actionSchema);
