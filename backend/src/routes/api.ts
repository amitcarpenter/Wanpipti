import express from "express";
import { uploadFile } from "../services/uploadImage";
import { authenticateUser } from "../middlewares/auth";

//==================================== Import Controller ==============================
import * as userControllers from "../controllers/api/userController";
import * as betControllers from "../controllers/api/betController";


const router = express.Router();

//==================================== USER ==============================
router.post("/register", userControllers.register);
router.get("/verify-email", userControllers.verifyEmail);
router.post("/google-signup", userControllers.signup_google);
router.post("/login", userControllers.login);
router.post("/forgot-password", userControllers.forgot_password);
router.get("/reset-password", userControllers.render_forgot_password_page);
router.post("/reset-password", userControllers.reset_password);
router.get("/profile", authenticateUser, userControllers.getProfile);
router.post("/profile/update", authenticateUser, uploadFile, userControllers.updateProfile);


//==================================== Bet ==============================
router.post("/place-bet", authenticateUser, betControllers.placeBet);
router.get("/bets/today", authenticateUser, betControllers.getUserBetsForToday);





export default router;
