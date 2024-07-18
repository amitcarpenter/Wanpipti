import express from "express";
import { uploadFile } from "../services/uploadImage";
import { authenticateUser, isAdmin } from "../middlewares/auth";

//==================================== Import Controller ==============================
import * as userControllers from "../controllers/admin/userController";
import * as gameControllers from "../controllers/admin/gameController";

const router = express.Router();

//==================================== USER ==============================
router.get("/user-list", authenticateUser, isAdmin, userControllers.getUserList);
router.get("/user/:id", authenticateUser, isAdmin, userControllers.getUserById);
router.post("/user/update/:id", authenticateUser, isAdmin, uploadFile, userControllers.updateUser);
router.delete("/user/delete/:id", authenticateUser, isAdmin, userControllers.delete_user_by_id);


//===================================== Game =============================
router.post("/create-game", authenticateUser, isAdmin, gameControllers.createGame);
router.get("/games/all", authenticateUser, isAdmin, gameControllers.getGames);
router.get("/games/today", authenticateUser, isAdmin, gameControllers.getTodayGames);
router.post("/game/update/:id", authenticateUser, isAdmin, gameControllers.updateGame);
router.delete("/game/delete/:id", authenticateUser, isAdmin, gameControllers.deleteGame);





export default router;
