import db from "../../db/models/index.js";
import decoder from "jwt-decode";
import genCode from "crypto-random-string";
const Op = db.Sequelize.Op;
const User = db.user;
const Member = db.member;
const Transaction = db.transaction;
import {
  sendPushNotification,
  getUsersTokens,
} from "../utilities/pushNotification.mjs";
import { isAdminUser } from "../utilities/adminRoles.mjs";

async function addTransaction(req, res, next) {
  const data = {
    libelle: req.body.libelle,
    montant: req.body.montant,
    reseau: req.body.reseau,
    typeTransac: req.body.type,
    numero: req.body.numero,
    statut: req.body.statut ? req.body.statut : "processing",
  };
  const transaction = await db.sequelize.transaction();
  try {
    // mobile money transaction or credit card transaction her
    let creator = await User.findByPk(req.body.creatorId, { transaction });
    if (!creator)
      return res
        .status(404)
        .send({ message: "Utilisateur ou membre non trouvé" });
    const transactionNumber = genCode({ length: 8, type: "numeric" });
    let newTransaction = await creator.createTransaction(
      { ...data, number: transactionNumber },
      { transaction }
    );
    let newWallet;
    if (req.body.type === "rechargement") {
      newWallet = creator.wallet + req.body.montant;
    } else newWallet = creator.wallet - req.body.montant;
    creator.wallet = newWallet;
    await creator.save({ transaction });
    newTransaction.statut = "succeeded";
    await newTransaction.save({ transaction });
    const justAdded = await Transaction.findByPk(newTransaction.id, {
      include: User,
      transaction,
    });
    const allUsers = await User.findAll();
    const adminUsers = [];
    for (let i = 0; i < allUsers.length; i++) {
      const currentUser = allUsers[i];
      const userRoles = await currentUser.getRoles();
      userRoles.forEach((userRole) => {
        if (userRole.name === "admin") adminUsers.push(currentUser);
      });
    }
    const usersTokens = adminUsers.map((user) => user.pushNotificationToken);
    if (usersTokens.length > 0) {
      sendPushNotification(
        `${justAdded.number} nouvelle transacton en cours`,
        usersTokens,
        newTransaction.typeTransac,
        {
          notifType: "transaction",
          mode: newTransaction.typeTransac,
          transactionId: newTransaction.id,
        }
      );
    }
    await transaction.commit();
    return res.status(200).send(justAdded);
  } catch (e) {
    await transaction.rollback();
    next(e);
  }
}

async function updateTransaction(req, res, next) {
  const montant = Number(req.body.montant);
  const transaction = await db.sequelize.transaction();
  try {
    let selectedTransaction = await Transaction.findByPk(
      req.body.transactionId,
      { transaction }
    );
    if (!selectedTransaction)
      return res.status(200).send("transaction non trouvée");
    if (req.body.typeTransac)
      selectedTransaction.typeTransac = req.body.typeTransac;
    if (req.body.libelle) selectedTransaction.libelle = req.body.libelle;
    if (req.body.reseau) selectedTransaction.reseau = req.body.reseau;
    if (req.body.numero) selectedTransaction.numero = req.body.numero;
    let selectedUser = await User.findByPk(req.body.userId, { transaction });
    if (req.body.statut) {
      selectedTransaction.statut = req.body.statut;
      if (req.body.statut.toLowerCase() === "succeeded") {
        if (!selectedUser)
          return res.status(404).send({ message: "Utilisateur non trouvé" });
        if (req.body.typeTransac.toLowerCase() === "depot") {
          selectedUser.wallet += montant;
        } else {
          if (selectedUser.wallet < montant) {
            return res.status(403).send({ message: "fonds insuffisant" });
          }
          selectedUser.wallet -= montant;
        }
        await selectedUser.save({ transaction });
      }
    }
    await selectedTransaction.save({ transaction });
    await transaction.commit();
    const justUpdated = await Transaction.findByPk(selectedTransaction.id, {
      include: [{ model: User, attributes: { exclude: ["password"] } }],
    });
    const userToken = selectedUser.pushNotificationToken;
    if (userToken) {
      sendPushNotification(
        `Votre transaction ${justUpdated.number} a été traitée.`,
        [userToken],
        "Transaction traitée.",
        {
          notifType: "Transaction",
          mode: selectedTransaction.typeTransac,
          transactionId: selectedTransaction.id,
        }
      );
    }
    return res.status(200).send(justUpdated);
  } catch (e) {
    await transaction.rollback();
    next(e);
  }
}

async function getUserTransaction(req, res, next) {
  const token = req.headers["x-access-token"];
  const user = decoder(token);
  const idUser = req.body.userId || user.id;
  const isAdmin = isAdminUser(token);
  try {
    let userTransactions = [];
    if (isAdmin) {
      userTransactions = await Transaction.findAll({
        include: User,
      });
    } else {
      userTransactions = await Transaction.findAll({
        where: { userId: idUser },
        include: User,
      });
    }
    return res.status(200).send(userTransactions);
  } catch (e) {
    next(e);
  }
}

async function deleteOneTransaction(req, res, next) {
  try {
    let selectedTransaction = await Transaction.findByPk(
      req.body.transactionId
    );
    if (!selectedTransaction)
      return res.status(404).send({ message: "transaction non trouvée" });
    await selectedTransaction.destroy();
    return res.status(200).send({ transactionId: req.body.transactionId });
  } catch (e) {
    next(e);
  }
}

async function cancelTransaction(req, res, next) {
  try {
    let selectedTransaction = await Transaction.findByPk(req.body.id);
    if (!selectedTransaction)
      return res.status(404).send({ message: "Transaction non trouvée" });
    let selectedUser = await User.findByPk(req.body.userId);
    if (!selectedUser)
      return res.status(404).send({ message: "creator non trouvé" });
    if (selectedTransaction.statut.toLowerCase() === "succeeded") {
      selectedUser.wallet -= req.body.montant;
      selectedTransaction.statut = "failed";
    }
    await selectedTransaction.save();
    await selectedUser.save();
    const justUpdated = await Transaction.findByPk(req.body.id, {
      include: [{ model: User, attributes: { exclude: ["password"] } }],
    });
    return res.status(200).send(justUpdated);
  } catch (e) {
    next(e);
  }
}

export {
  addTransaction,
  updateTransaction,
  getUserTransaction,
  deleteOneTransaction,
  cancelTransaction,
};
