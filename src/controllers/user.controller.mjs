import db from "../../db/models/index.js";
import { isAdminUser } from "../utilities/adminRoles.mjs";
import { sendPushNotification } from "../utilities/pushNotification.mjs";
const User = db.user;
import codeGenerator from "crypto-random-string";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

async function editUserInfo(req, res, next) {
  try {
    let selectedUser = await User.findByPk(req.body.id);
    if (!selectedUser) return res.status(404).send("Utilisateur non trouvé");
    if (req.body.nom) selectedUser.nom = req.body.nom;
    if (req.body.prenom) selectedUser.prenom = req.body.prenom;
    if (req.body.pseudo) selectedUser.username = req.body.pseudo;
    if (req.body.phone) selectedUser.phone = req.body.phone;
    if (req.body.email) selectedUser.email = req.body.email;
    if (req.body.adresse) selectedUser.adresse = req.body.adresse;
    if (req.body.profession) selectedUser.profession = req.body.profession;
    if (req.body.emploi) selectedUser.emploi = req.body.emploi;
    await selectedUser.save();
    const justUpdated = await User.findByPk(selectedUser.id, {
      attributes: { exclude: ["password"] },
    });
    return res.status(200).send(justUpdated);
  } catch (e) {
    next(e.message);
  }
}

async function editFund(req, res, next) {
  try {
    let selectedUser = await User.findByPk(req.body.id);
    if (!selectedUser) return res.status(404).send("Utilisateur non trouvé");
    selectedUser.wallet += Number(req.body.fonds);
    await selectedUser.save();
    return res.status(200).send(selectedUser);
  } catch (e) {
    next(e.message);
  }
}

async function updateImages(req, res, next) {
  try {
    let selectedUser = await User.findByPk(req.body.userId);
    if (!selectedUser)
      return res.status(404).send({ message: "utilisateur non trouvé" });
    if (req.body.avatarUrl) {
      selectedUser.avatar = req.body.avatarUrl;
    }
    if (req.body.pieces) {
      selectedUser.piece = req.body.pieces;
    }
    await selectedUser.save();
    const justUpdated = await User.findByPk(selectedUser.id, {
      attributes: { exclude: ["password"] },
    });
    return res.status(200).send(justUpdated);
  } catch (e) {
    next(e);
  }
}

async function getAllUser(req, res, next) {
  const token = req.headers["x-access-token"];
  const isAdmin = isAdminUser(token);
  try {
    let allUser = [];
    if (isAdmin) {
      allUser = await User.findAll({
        attributes: { exclude: ["password"] },
      });
    }
    return res.status(200).send(allUser);
  } catch (e) {
    next(e);
  }
}

async function getUserData(req, res, next) {
  try {
    const selectedUser = await User.findByPk(req.body.userId, {
      attributes: { exclude: ["password"] },
    });
    if (!selectedUser)
      return res.status(404).send({ message: "utilisateur non trouvé." });
    return res.status(200).send(selectedUser);
  } catch (e) {
    next(e);
  }
}

async function updatePushNotifToken(req, res, next) {
  try {
    let selectedUser = await User.findByPk(req.body.userId, {
      attributes: { exclude: ["password"] },
    });
    if (!selectedUser)
      return res.status(404).send({ message: "utilisateur non trouvé" });
    selectedUser.pushNotificationToken = req.body.notificationToken;
    const userName = selectedUser.username
      ? selectedUser.username
      : selectedUser.nom
      ? selectedUser.nom
      : "";
    if (selectedUser.isFirstTimeConnect) {
      sendPushNotification(
        `Félicitation, nous sommes heureux de vous accueillir. SVP complétez votre profil pour qu'on puisse mieux se connaître.`,
        [selectedUser.pushNotificationToken],
        `Bienvenue ${userName}`,
        { notifType: "userCompte" }
      );
      selectedUser.isFirstTimeConnect = false;
    }
    await selectedUser.save();
    return res.status(200).send(selectedUser);
  } catch (e) {
    next(e);
  }
}

async function resetCredentials(req, res, next) {
  try {
    let selectedUser;
    if (req.body.email) {
      selectedUser = await User.findOne({
        where: {
          email: req.body.email,
        },
      });
    } else {
      selectedUser = await User.findOne({
        where: {
          phone: req.body.phone,
        },
      });
    }
    if (!selectedUser)
      return res.status(404).send({ message: "Utilisateur non trouvé." });
    const genCode = codeGenerator({ length: 4, type: "numeric" });
    const newPinToken = jwt.sign(genCode, process.env.JWT_SECRET);
    const newPassword = bcrypt.hashSync(genCode, 8);
    selectedUser.pinToken = newPinToken;
    selectedUser.password = newPassword;
    await selectedUser.save();
    const userName = selectedUser.username
      ? selectedUser.username
      : selectedUser.nom
      ? selectedUser.nom
      : "";
    sendPushNotification(
      `${userName} vos paramètres de connexion ont été reinitialisés, veuillez nous contacter pour avoir les nouveaux paramètres.`,
      [selectedUser.pushNotificationToken],
      "Reinitialisation paramètres de connexion.",
      { notifType: "param" }
    );
    return res.status(200).send({ randomCode: genCode });
  } catch (e) {
    next(e);
  }
}
async function changeCredentials(req, res, next) {
  try {
    const selectedUser = await User.findByPk(req.body.userId);
    if (!selectedUser)
      return res.status(404).send({ message: "Utilisateur non trouvé." });
    if (req.body.oldPin) {
      const pinToken = jwt.sign(req.body.oldPin, process.env.JWT_SECRET);
      const isCodeValid = selectedUser.pinToken === pinToken;
      if (!isCodeValid)
        return res.status(401).send({
          message: "Le code pin ne correspond pas a celui enregistré.",
        });
      const newToken = jwt.sign(req.body.newPin, process.env.JWT_SECRET);
      selectedUser.pinToken = newToken;
    }
    if (req.body.oldPass) {
      const isValidPass = bcrypt.compareSync(
        req.body.oldPass,
        selectedUser.password
      );
      if (!isValidPass)
        return res.status(401).send({
          message: "Le mot de passe ne correspond pas à celui enregistré",
        });
      selectedUser.password = bcrypt.hashSync(req.body.newPass, 8);
    }
    if (req.body.email) selectedUser.email = req.body.email;
    await selectedUser.save();
    const userName = selectedUser.username
      ? selectedUser.username
      : selectedUser.nom
      ? selectedUser.nom
      : "";
    sendPushNotification(
      `${userName} vos paramètres de connexion viennent d'être changés, si cela ne vient pas de vous, contactez-nous immediatement.`,
      [selectedUser.pushNotificationToken],
      "Reinitialisation paramètres de connexion.",
      { notifType: "param" }
    );
    return res
      .status(200)
      .send({ message: "Vos paramètres ont été mis à jour avec succès." });
  } catch (e) {
    next(e);
  }
}

async function deleteUser(req, res, next) {
  try {
    let selectedUser = await User.findByPk(req.body.userId);
    if (!selectedUser)
      return res.status(404).send({ message: "Utilisateur non trouvé" });
    if (selectedUser.wallet > 0)
      return res
        .status(401)
        .send({ message: "Vous ne pouvez pas supprimer cet utilisateur." });
    await selectedUser.destroy();
    return res.status(200).send({ userId: req.body.userId });
  } catch (e) {
    next(e);
  }
}

export {
  editUserInfo,
  editFund,
  updateImages,
  getAllUser,
  getUserData,
  updatePushNotifToken,
  resetCredentials,
  changeCredentials,
  deleteUser,
};
