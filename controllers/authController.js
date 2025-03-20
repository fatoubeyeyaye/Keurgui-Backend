const User = require('../models/User');
const bcrypt = require('bcryptjs');

// 📌 Inscription (POST)
exports.register = async (req, res) => {
  try {
    const { id, role, nom, prenom, email, password } = req.body;

    if (!id) return res.status(400).json({ message: "L'ID est obligatoire" });

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "Email déjà utilisé" });

    const idExists = await User.findOne({ id });
    if (idExists) return res.status(400).json({ message: "Cet ID est déjà pris" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ id, role, nom, prenom, email, password: hashedPassword });

    await user.save();
    res.status(201).json({ message: "Utilisateur créé avec succès", user });
  } catch (error) {
    console.error("Erreur dans l'inscription :", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// 📌 Récupérer tous les utilisateurs (GET)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// 📌 Modifier un utilisateur (PUT)
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, nom, prenom, email, password } = req.body;

    const user = await User.findOne({ id });
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    if (role) user.role = role;
    if (nom) user.nom = nom;
    if (prenom) user.prenom = prenom;
    if (email) {
      const emailExists = await User.findOne({ email });
      if (emailExists && emailExists.id !== user.id) {
        return res.status(400).json({ message: "Cet email est déjà utilisé" });
      }
      user.email = email;
    }
    if (password) user.password = await bcrypt.hash(password, 10);

    await user.save();
    res.status(200).json({ message: "Utilisateur mis à jour avec succès", user });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// 📌 Supprimer un utilisateur (DELETE)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOneAndDelete({ id });

    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    res.status(200).json({ message: "Utilisateur supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};
