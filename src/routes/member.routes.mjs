import express from "express";
import { verifyToken, isAdminOrModerator } from "../middlewares/authJWT.mjs";

const router = express.Router();
import {
  respondToAdhesionMessage,
  payCotisation,
  getMembersCotisations,
  getConnectedUserAssociations,
  updateMemberData,
  getSelectedAssociationMembers,
  getMemberInfos,
  readInfo,
  sendMessageToAssociation,
  editImages,
  getConnectedMemberUser,
  leaveAssociation,
  deleteMember,
} from "../controllers/member.controller.mjs";

router.post("/byAssociation", verifyToken, getSelectedAssociationMembers);
router.patch(
  "/respondToAdhesionMessage",
  [verifyToken, isAdminOrModerator],
  respondToAdhesionMessage
);
router.patch("/updateOne", verifyToken, updateMemberData);
router.post("/informations", verifyToken, getMemberInfos);
router.patch("/readInfos", verifyToken, readInfo);
router.patch("/sendAdhesionMessage", verifyToken, sendMessageToAssociation);
router.patch("/editImages", verifyToken, editImages);
router.patch("/payCotisations", verifyToken, payCotisation);
router.post("/membersCotisations", verifyToken, getMembersCotisations);
router.get("/associations", verifyToken, getConnectedUserAssociations);
router.post("/connectedMemberUser", verifyToken, getConnectedMemberUser);
router.patch("/leaveAssociation", verifyToken, leaveAssociation);
router.delete("/deleteMember", [verifyToken, isAdminOrModerator], deleteMember);

export default router;
