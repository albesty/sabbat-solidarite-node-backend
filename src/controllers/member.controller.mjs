import db from "../../db/models/index.js";
import decoder from "jwt-decode";
import { isAdminUser } from "../utilities/adminRoles.mjs";
const Member = db.member;
const User = db.user;
const Association = db.association;
const Cotisation = db.cotisation;
const Historique = db.historique;
const Engagement = db.engagement;
const Member_Info = db.member_info;
const Member_Cotisation = db.member_cotisation;
import {
  sendPushNotification,
  getUsersTokens,
} from "../utilities/pushNotification.mjs";

async function getSelectedAssociationMembers(req, res, next) {
  try {
    const selectedAssociation = await Association.findByPk(
      req.body.associationId
    );
    if (!selectedAssociation)
      return res.status(404).send({ message: "association non trouvée." });
    const members = await selectedAssociation.getUsers({
      attributes: { exclude: ["password"] },
    });
    return res.status(200).send(members);
  } catch (e) {
    next(e);
  }
}

async function respondToAdhesionMessage(req, res, next) {
  try {
    let associatedMember = await Member.findOne({
      where: {
        associationId: req.body.associationId,
        userId: req.body.userId,
      },
    });
    if (
      req.body.adminResponse.toLowerCase() === "rejected" &&
      associatedMember.relation.toLowerCase() !== "ondemand" &&
      associatedMember.fonds !== 0
    ) {
      return res.status(403).send({
        message: "Ce membre ne peut pas quitter l'association maintenant.",
      });
    }
    associatedMember.relation = req.body.adminResponse;
    associatedMember.adhesionDate = Date.now();
    if (
      req.body.adminResponse === "member" &&
      req.body.info.toLowerCase() === "new"
    ) {
      associatedMember.statut = req.body.statut ? req.body.statut : "ORDINAIRE";
      associatedMember.setRoles([1]);
    } else if (
      req.body.adminResponse === "rejected" &&
      req.body.info.toLowerCase() === "old"
    ) {
      associatedMember.statut = req.body.statut ? req.body.statut : "OLD";
    }
    await associatedMember.save();
    const selectedUser = await User.findByPk(req.body.userId);
    const selectedAssociation = await Association.findByPk(
      req.body.associationId
    );
    const associationMembers = await selectedAssociation.getUsers({
      attributes: { exclude: ["password"] },
    });
    const currentMember = associationMembers.find(
      (user) => user.id === req.body.userId
    );
    const tokenTab = [selectedUser.pushNotificationToken];
    let message = "";
    if (
      req.body.adminResponse.toLowerCase() === "member" &&
      req.body.info.toLowerCase() === "new"
    ) {
      message = `Votre demande d'adhésion à ${selectedAssociation.nom} a été acceptée.`;
    } else if (
      req.body.adminResponse.toLowerCase() === "rejected" &&
      req.body.info.toLowerCase() === "new"
    ) {
      message = `Votre demande d'adhésion à ${selectedAssociation.nom} a été refusée.`;
    } else if (
      req.body.adminResponse.toLowerCase() === "member" &&
      req.body.info.toLowerCase() === "old"
    ) {
      message = `Votre demande de quitter ${selectedAssociation.nom} a été refusée.`;
    } else {
      message = `Votre demande de quitter ${selectedAssociation.nom} a été acceptée.`;
    }
    if (tokenTab.length > 0) {
      sendPushNotification(
        message,
        tokenTab,
        `Reponse d'adhésion à ${selectedAssociation.nom} `,
        {
          notifType: "adhesion",
          statut: "response",
          associationId: req.body.associationId,
        }
      );
    }
    return res.status(200).send(currentMember);
  } catch (e) {
    next(e);
  }
}

async function updateMemberData(req, res, next) {
  try {
    let selected = await Member.findByPk(req.body.currentMemberId);
    if (!selected) return res.status(404).send("member not exist");
    if (req.body.statut) selected.statut = req.body.statut;
    if (req.body.fonds) selected.fonds += req.body.fonds;
    if (req.body.relation) selected.relation = req.body.relation;
    if (req.body.avatar) selected.avatar = req.body.avatar;
    if (req.body.adhesionDate) selected.adhesionDate = req.body.adhesionDate;
    if (req.body.backImage) selected.backImage = req.body.backImage;
    await selected.save();
    const memberAssociation = await Association.findByPk(
      selected.associationId
    );
    const associationMembers = await memberAssociation.getUsers({
      attributes: { exclude: ["password"] },
    });
    const currentMember = associationMembers.find(
      (member) => member.id === selected.userId
    );
    const memberName = currentMember.username
      ? currentMember.username
      : currentMember.nom;
    const memberToken = currentMember.pushNotificationToken;
    if (memberToken) {
      sendPushNotification(
        `Felicitation ${memberName}, vos infos ont été mises à jour avec succès dans ${memberAssociation.nom}.`,
        [memberToken],
        "Mise à jour information personnel",
        { notifType: "adhesion", associationId: memberAssociation.id }
      );
    }
    return res.status(200).send(currentMember);
  } catch (e) {
    next(e);
  }
}

async function getConnectedMemberUser(req, res, next) {
  const token = req.headers["x-access-token"];
  const user = decoder(token);
  try {
    const selectedAssociation = await Association.findByPk(
      req.body.associationId
    );
    if (!selectedAssociation)
      return res.status(404).send({ message: "association non trouvé." });
    const associationMembers = await selectedAssociation.getUsers({
      attributes: { exclude: ["password"] },
    });
    const connectedMember = associationMembers.find(
      (item) => item.id === user.id
    );
    return res.status(200).send(connectedMember);
  } catch (e) {
    next(e);
  }
}

async function getMemberInfos(req, res, next) {
  try {
    const selectedMember = await Member.findByPk(req.body.memberId);
    const selectedInfos = await selectedMember.getInformation();
    return res.status(200).send(selectedInfos);
  } catch (e) {
    next(e);
  }
}

async function readInfo(req, res, next) {
  try {
    let selectedInfo = await Member_Info.findOne({
      where: {
        memberId: req.body.memberId,
        informationId: req.body.informationId,
      },
    });
    selectedInfo.isRead = true;
    await selectedInfo.save();
    const selectedMember = await Member.findByPk(req.body.memberId);
    const currentInfos = await selectedMember.getInformation();
    return res.status(200).send(currentInfos);
  } catch (e) {
    next(e.message);
  }
}

async function sendMessageToAssociation(req, res, next) {
  try {
    let selectedAssociation = await Association.findByPk(
      req.body.associationId
    );
    if (!selectedAssociation)
      return res.status(404).send("association non trouvée");
    const connectedUser = await User.findByPk(req.body.userId);
    if (!connectedUser) return res.status(404).send("utilisateur non trouvé");
    await selectedAssociation.addUser(connectedUser, {
      through: {
        relation: req.body.relation ? req.body.relation : "onDemand",
        statut: req.body.statut ? req.body.statut : "new",
      },
    });
    const userAssociationState = await connectedUser.getAssociations();
    const membersNotifTokens = await getUsersTokens(selectedAssociation);
    if (membersNotifTokens.length > 0) {
      const userName = connectedUser.username
        ? connectedUser.username
        : connectedUser.nom
        ? connectedUser.nom
        : connectedUser.email
        ? connectedUser.email
        : connectedUser.phone;
      sendPushNotification(
        `${userName} souhaiterais adhérer ${selectedAssociation.nom}.`,
        membersNotifTokens,
        `Demande d'adhesion à ${selectedAssociation.nom}`,
        {
          notifType: "adhesion",
          statut: "sending",
          associationId: selectedAssociation.id,
        }
      );
    }
    return res.status(200).send(userAssociationState);
  } catch (e) {
    next(e);
  }
}

async function leaveAssociation(req, res, next) {
  try {
    let selectedMember = await Member.findOne({
      where: {
        associationId: req.body.associationId,
        userId: req.body.userId,
      },
    });
    if (!selectedMember)
      return res.status(404).send({ message: "Membre non trouvé." });
    selectedMember.relation = "onLeave";
    await selectedMember.save();
    const selectedAssociation = await Association.findByPk(
      req.body.associationId
    );
    const connectedUser = await User.findByPk(req.body.userId);
    const associationMembers = await selectedAssociation.getUsers({
      attributes: { exclude: ["password"] },
    });
    const currentMember = associationMembers.find(
      (item) => item.id === req.body.userId
    );
    const membersNotifTokens = await getUsersTokens(selectedAssociation);
    const userName = connectedUser.username
      ? connectedUser.username
      : connectedUser.nom;
    if (membersNotifTokens.length > 0) {
      sendPushNotification(
        `${userName} souhaiterais quitter ${selectedAssociation.nom}.`,
        membersNotifTokens,
        `Demande de quitter ${selectedAssociation.nom}`,
        {
          notifType: "adhesion",
          statut: "leaving",
          associationId: selectedAssociation.id,
        }
      );
    }
    return res.status(200).send(currentMember);
  } catch (e) {
    next(e);
  }
}

async function editImages(req, res, next) {
  const avatarUrl = req.body.avatarUrl;
  const backImageUrl = req.body.backImageUrl;
  try {
    let selectedMember = await Member.findByPk(req.body.memberId);
    if (!selectedMember) return res.status(200).send("membre non trouvé");
    if (avatarUrl) selectedMember.avatar = req.body.avatarUrl;
    if (backImageUrl) selectedMember.backImage = req.body.backImageUrl;
    await selectedMember.save();
    const selectedAssociation = await Association.findByPk(
      selectedMember.associationId
    );
    const associationUsers = await selectedAssociation.getUsers({
      attributes: { exclude: ["password"] },
    });
    const currentUser = associationUsers.find(
      (user) => user.id === selectedMember.userId
    );
    return res.status(200).send(currentUser);
  } catch (e) {
    next(e.message);
  }
}

async function payCotisation(req, res, next) {
  const montantToPay = Number(req.body.montant);
  const transaction = await db.sequelize.transaction();
  try {
    let selectedMember = await Member.findByPk(req.body.memberId, {
      transaction,
    });
    if (!selectedMember)
      return res.status(404).send({ message: "Membre non trouvée" });
    let selectedUser = await User.findByPk(selectedMember.userId, {
      transaction,
    });
    if (!selectedUser)
      return res.status(404).send({ message: "L'utilisateur n'existe pas" });
    if (selectedUser.wallet < montantToPay + 100)
      return res.status(403).send({ message: "Fonds insuffisant" });
    let selectedCotisation = await Cotisation.findByPk(req.body.cotisationId, {
      transaction,
    });
    if (!selectedCotisation)
      return res.status(404).send({ message: "cette cotisation nexiste pas" });
    let selectedAssociation = await Association.findByPk(
      selectedCotisation.associationId,
      { transaction }
    );
    if (!selectedAssociation)
      return res.status(404).send({ message: "association non trouvée" });
    await selectedMember.addCotisation(selectedCotisation, {
      through: {
        montant: montantToPay,
        paymentDate: new Date(),
      },
      transaction,
    });
    let newPayed = await Member_Cotisation.findOne({
      where: {
        memberId: selectedMember.id,
        cotisationId: selectedCotisation.id,
      },
      transaction,
    });
    if (montantToPay >= selectedCotisation.montant) {
      newPayed.isPayed = true;
    }
    /*if(selectedCotisation.typeCotisation.toLowerCase() === 'mensuel') {
            selectedMember.fonds += montantToPay
        }*/
    selectedAssociation.solde += montantToPay;

    selectedUser.wallet -= montantToPay + 100;
    let mainAdmin = await User.findOne({
      where: {
        email: "sabbattech@gmail.com",
      },
      transaction,
    });
    if (!mainAdmin)
      res.status(404).send({ message: "Le compte administrateur non trouvé" });
    mainAdmin.wallet += 100;
    await mainAdmin.save({ transaction });
    await newPayed.save({ transaction });
    await selectedMember.save({ transaction });
    await selectedUser.save({ transaction });
    await selectedAssociation.save({ transaction });
    const memberCotisState = await selectedMember.getCotisations({
      transaction,
    });
    const memberName = selectedUser.username
      ? selectedUser.username
      : selectedUser.nom;
    const tokens = await getUsersTokens(selectedAssociation, { transaction });
    if (tokens.length > 0) {
      sendPushNotification(
        `${memberName} a payé une cotisation dans ${selectedAssociation.nom}`,
        tokens,
        "Payement cotisation",
        { notifType: "cotisation", associationId: selectedAssociation.id }
      );
    }
    const data = {
      memberId: selectedMember.id,
      cotisations: memberCotisState,
    };
    await transaction.commit();
    return res.status(200).send(data);
  } catch (e) {
    await transaction.rollback();
    next(e);
  }
}

async function getMembersCotisations(req, res, next) {
  try {
    const allMembers = await Member.findAll({
      where: {
        associationId: req.body.associationId,
      },
    });
    let membersCotisation = {};
    for (let i = 0; i < allMembers.length; i++) {
      const selectedMember = allMembers[i];
      const memberId = selectedMember.id;
      const selectedMemberCotisations = await selectedMember.getCotisations();
      membersCotisation[memberId] = selectedMemberCotisations;
    }
    return res.status(200).send(membersCotisation);
  } catch (e) {
    next(e);
  }
}

async function getConnectedUserAssociations(req, res, next) {
  const token = req.headers["x-access-token"];
  const user = decoder(token);
  try {
    const connectedUser = await User.findByPk(user.id);
    if (!connectedUser)
      return res.status(404).send({ message: "utilisateur non trouvé" });
    const userAssociations = await connectedUser.getAssociations();
    return res.status(200).send(userAssociations);
  } catch (e) {
    next(e);
  }
}

async function deleteMember(req, res, next) {
  try {
    let selectedMember = await Member.findByPk(req.body.memberId);
    if (!selectedMember)
      return res.status(404).send({ message: "Membre introuvable." });
    const memberEngagements = await Engagement.findAll({
      where: {
        creatorId: selectedMember.id,
      },
    });
    const memberCotisations = await selectedMember.getCotisations();
    const data = {
      member: selectedMember,
      enagegements: memberEngagements,
      cotisations: memberCotisations,
    };

    if (selectedMember.fonds !== 0) {
      return res.status(403).send({
        message:
          "Impossible de supprimer ce membre, il possède des fonds inutilisés.",
      });
    }
    await Historique.create({
      histoType: "saving",
      description: "deletion of association member",
      histoData: [data],
    });
    await selectedMember.destroy();
    return res
      .status(200)
      .send({ memberId: req.body.memberId, userId: selectedMember.userId });
  } catch (e) {
    next(e);
  }
}

export {
  getSelectedAssociationMembers,
  respondToAdhesionMessage,
  updateMemberData,
  getMemberInfos,
  readInfo,
  sendMessageToAssociation,
  editImages,
  payCotisation,
  getMembersCotisations,
  getConnectedUserAssociations,
  getConnectedMemberUser,
  leaveAssociation,
  deleteMember,
};
