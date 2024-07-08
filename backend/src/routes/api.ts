import express from "express";
import { uploadFile, uploadProfileImage } from "../services/uploadImage";
import { authenticateUser, isAdmin } from "../middlewares/auth";

//==================================== Import Controller ==============================
import * as userControllers from "../controllers/api/userControllers";


const router = express.Router();
  
//==================================== USER ==============================
router.post("/auth/register", userControllers.register);


export default router;
