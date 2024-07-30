import express from "express";
import { uploadFile } from "../services/uploadImage";
import { authenticateUser } from "../middlewares/auth";

//==================================== Import Controller ==============================
import * as betControllers from "../controllers/api/betController";
import * as userControllers from "../controllers/api/userController";
import * as gameControllers from "../controllers/api/gameController";
import * as walletControllers from "../controllers/api/walletController";
import * as resultControllers from "../controllers/api/resultController";
import * as walletTransactionControllers from "../controllers/api/walletTransactionController";


const router = express.Router();

//==================================== USER ==============================
router.post("/register", userControllers.register);
router.get("/verify-email", userControllers.verifyEmail);
router.post("/google-signup", userControllers.signup_google);
router.post("/login", userControllers.login);
router.post("/forgot-password", userControllers.forgot_password);
router.get("/reset-password", userControllers.render_forgot_password_page);
router.post("/reset-password", userControllers.reset_password);
router.post("/change-password", authenticateUser, userControllers.changePassword);
router.get("/profile", authenticateUser, userControllers.getProfile);
router.post("/profile/update", authenticateUser, uploadFile, userControllers.updateProfile);
router.get("/register-success", userControllers.render_success_register);
router.get("/success-reset", userControllers.render_success_reset);


//==================================== Game ==============================
router.get("/get-today-games", authenticateUser, gameControllers.getUserTodayGameResults);
// router.get("/bets/today", authenticateUser, betControllers.getUserBetsForToday);


//==================================== Bet ==============================
router.post("/place-bet", authenticateUser, betControllers.placeBet);
router.get("/bets/today", authenticateUser, betControllers.getUserBetsForToday);



//==================================== Result ==============================
router.get("/get/today-results", authenticateUser, resultControllers.getTodaysResultsForUser);
router.get("/get-all-results", authenticateUser, resultControllers.getAllResultsForUser);



//==================================== Wallet Transaction ==============================
router.get("/get-wallet-transaction", authenticateUser, walletTransactionControllers.getWalletTransactionsByUser);
router.post("/create-transaction", authenticateUser, walletTransactionControllers.createWalletTransaction);


//==================================== Wallet  ==============================
router.get("/get-wallet-details", authenticateUser, walletControllers.getUserWalletDetails);
// router.post("/create-transaction", authenticateUser, walletControllers.createWalletTransaction);





export default router;
