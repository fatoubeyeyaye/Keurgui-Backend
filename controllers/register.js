const User = require('../models/register');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const { validationResult } = require('express-validator');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: "madjiguened835@gmail.com",
    pass: "htid ghwx jneo liqv",
  }
});
const sendConfirmationEmail = (email, confirmationLink) => {
  const mailOptions = {
    from: 'madjiguened835@gmail.com',
    to: email,
    subject: 'Confirmation d\'inscription',
    html: `
          <div style="text-align:center">
            <p style="font-size:17px;color:black;"> Merci de vous être inscrit ! Veuillez confirmer votre adresse email .</p>
            <a href="${confirmationLink}" 
               style="
                 display: inline-block; 
                 padding: 10px 20px; 
                 background-color:black; 
                 color: white; 
                 text-align: center; 
                 text-decoration: none; 
                 font-size: 16px;
                 font-weight: bold;">
               Confirmer votre email
            </a>
          </div>
    `
  };

  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.error('Erreur lors de l\'envoi de l\'email de confirmation:', error);
    } else {
      console.log('Email de confirmation envoyé: ' + info.response);
    }
  });
};

//Inscription (POST)
exports.register = async (req, res) => {
   const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(403).json({ errors: errors.array() });
    }
  try {
    const { id, role, nom, prenom, email, password,telephone } = req.body;

    if (!id) return res.status(400).json({ message: "L'ID est obligatoire" });

    // Vérification de l'existence de l'utilisateur
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "Email déjà utilisé" });

    const idExists = await User.findOne({ id });
    if (idExists) return res.status(400).json({ message: "Cet ID est déjà pris" });

    // Vérifier si le rôle est valide
    const validRoles = ["medecin", "patient"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Rôle invalide" });
    }

    // Empêcher un utilisateur de créer un admin 
    if (role === "medecin" && !req.user?.isAdmin) {
      return res.status(403).json({ message: "Vous n'avez pas l'autorisation de créer un admin" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // Création de l'utilisateur
    const user = new User({ id, role, nom, prenom, email,telephone, password: hashedPassword });

    await user.save();
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      "your_jwt_secret",
      { expiresIn: '1h' } 
    );

    const confirmationLink = `http://localhost:5000/api/confirm-email?token=${token}`;

    sendConfirmationEmail(user.email, confirmationLink);

    return res.status(201).json({ msg: 'Inscription réussie. Un email de confirmation a été envoyé à votre adresse.' });

  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Erreur du serveur');
  }
};
//Confirmer un email aprés l'inscription
exports.confirmEmail = async (req, res) => {
  const { token } = req.query;

  try {
    const decoded = jwt.verify(token, "your_jwt_secret");

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    if (user.isVerified) {
      return res.status(200).send(`
          <html>
              <body>
                  <p style="font-size:20px">Email déjà confirmé</p>
              </body>
          </html>
      `);
    }

    user.isVerified = true; 
    await user.save();

    return res.status(200).send(`
      <html>
          <body>
              <h1>Confirmation d'Email</h1>
              <p style="font-size:25px">Email confirmé avec succès ! Vous pouvez maintenant accéder à votre compte.</p>
          </body>
      </html>
    `);
  } catch (error) {
    console.error(error);
    return res.status(200).send(`
      <html>
          <body>
              <p style="font-size:25px">Lien de confirmation invalide ou expiré</p>
          </body>
      </html>
    `);
  }
};

// Route pour connextion patient et medecin
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    //Définition des informations de connexion pour les admins (médecins)
    const adminEmail = "admin@health.com";
    const adminPassword = "admin123"; 

    if (email === adminEmail) {
      if (password !== adminPassword) {
        return res.status(400).json({ message: "Mot de passe incorrect pour l'admin" });
      }
      //Générer un token pour l'admin
      const token = jwt.sign(
        { role: "medecin" }, 
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      return res.status(200).json({
        message: "Connexion réussie (Admin)",
        admin: {
          role: "medecin",
          email: adminEmail
        },
        token
      });
    }

    //Vérifier si l'utilisateur est un patient
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Utilisateur non trouvé" });
    }

    //Vérifier le mot de passe du patient
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Mot de passe incorrect" });
    }

    //Générer un token pour le patient
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: "Connexion réussie",
      user: {
        id: user.id,
        role: user.role,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        telephone:user.telephone
      },
      token
    });
  } catch (error) {
    console.error("Erreur lors de la connexion :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

//Récupérer tous les utilisateurs 
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

//Modifier un utilisateur 
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, nom, prenom, email, password,telephone } = req.body;

    const user = await User.findOne({ id });
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    if (role) user.role = role;
    if (nom) user.nom = nom;
    if (prenom) user.prenom = prenom;
    if (telephone) user.telephone = telephone;
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

//Supprimer un utilisateur 
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
