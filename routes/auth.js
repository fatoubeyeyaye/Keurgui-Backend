const express = require('express');
const { register, getUsers, updateUser, deleteUser } = require('../controllers/authController');

const router = express.Router();

// Routes CRUD pour l'inscription
router.post('/register', register); // Créer un utilisateur
router.get('/users', getUsers); // Récupérer tous les utilisateurs
router.put('/users/:id', updateUser); // Modifier un utilisateur
router.delete('/users/:id', deleteUser); // Supprimer un utilisateur

module.exports = router;
