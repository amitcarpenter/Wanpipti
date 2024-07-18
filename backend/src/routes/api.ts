import express from "express";
import { uploadFile } from "../services/uploadImage";
import { authenticateUser } from "../middlewares/auth";

//==================================== Import Controller ==============================
import * as userControllers from "../controllers/api/userController";


const router = express.Router();

//==================================== USER ==============================
router.post("/auth/register", userControllers.register);
router.post("/auth/google-signup", userControllers.signup_google);
router.post("/auth/login", userControllers.login);
router.post("/forgot-password", userControllers.forgot_password);
router.get("/reset-password", userControllers.render_forgot_password_page);
router.post("/reset-password", userControllers.reset_password);

router.get("/auth/profile", authenticateUser, userControllers.getProfile);
router.post("/auth/profile/update", authenticateUser, uploadFile, userControllers.updateProfile);


export default router;
