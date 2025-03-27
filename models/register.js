const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  id: { type: Number, unique: true, required: true }, // L'utilisateur doit fournir l'ID
  role: { type: String, enum: ['medecin', 'patient'], required: true },
  nom: { type: String, required: true },
  prenom: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  telephone: { type: Number, required: true },

  isVerified: {type: Boolean,default: false,
  },
}, { timestamps: true });


module.exports = mongoose.model('User', userSchema);
