const jwt = require('jsonwebtoken');

exports.authMiddleware = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) {
    return res.status(401).json({ message: "Accès refusé, aucun token fourni" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Token invalide" });
  }
};

// Vérifier si l'utilisateur est un médecin (admin)
exports.medecinMiddleware = (req, res, next) => {
  if (req.user.role !== "medecin") {
    return res.status(403).json({ message: "Accès refusé, autorisation requise" });
  }
  next();
};
