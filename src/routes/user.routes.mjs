import express from 'express'
const router = express.Router()

import {editUserInfo, editFund, updateImages, getAllUser, getUserData, updatePushNotifToken} from '../controllers/user.controller.mjs'
import {verifyToken, isAdmin} from "../middlewares/authJWT.mjs";

router.patch('/editInfo',verifyToken, editUserInfo)
router.patch('/editFund',[verifyToken, isAdmin], editFund)
router.patch('/editImages',verifyToken, updateImages)
router.get('/allUsers',verifyToken, getAllUser)
router.post('/userData',getUserData)
router.post('/pushNotifications',verifyToken, updatePushNotifToken)

export default router