const mongoose = require('mongoose');

const pointageSchema = new mongoose.Schema({
  child: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Child',
    required: true
  },
  action: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Action',
    required: true
  },
  actionValue: { // AJOUTÉ
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Pointage', pointageSchema);
