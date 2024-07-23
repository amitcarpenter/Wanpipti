import express from "express";
import { uploadFile } from "../services/uploadImage";
import { authenticateUser, isAdmin } from "../middlewares/auth";

//==================================== Import Controller ==============================
import * as userControllers from "../controllers/admin/userController";
import * as gameControllers from "../controllers/admin/gameController";
import * as betControllers from "../controllers/admin/betController";
import * as roleControllers from "../controllers/admin/roleController";
import * as resultControllers from "../controllers/admin/resultController";
import * as gameSettingControllers from "../controllers/admin/gameSettingController";

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


//===================================== Bet =============================
router.get("/bets", authenticateUser, isAdmin, betControllers.getBets);
router.get("/bets/today", authenticateUser, isAdmin, betControllers.getBetsForToday);


//===================================== Game Setting =============================
router.post("/create-game-setting", authenticateUser, isAdmin, gameSettingControllers.createGameSetting);
router.get("/get-today-game-setting", authenticateUser, isAdmin, gameSettingControllers.getAllGameSettingsForToday);
router.get("/game-settings-all", authenticateUser, isAdmin, gameSettingControllers.getAllGameSettings);
router.post("/gamesetting-update", authenticateUser, isAdmin, gameSettingControllers.updateGameSetting);


//===================================== Role  =============================
router.post("/create-role", roleControllers.createRole);
router.get("/roles", authenticateUser, isAdmin, roleControllers.getRoles);
router.get("/get-role/:id", authenticateUser, isAdmin, roleControllers.getRoleById);
router.post("/update-role/:id", authenticateUser, isAdmin, roleControllers.updateRole);
router.delete("/delete-role/:id", authenticateUser, isAdmin, roleControllers.deleteRole);


//===================================== Result  =============================
router.post("/declare-result", authenticateUser, resultControllers.declareResults);
// router.get("/bets/today", authenticateUser, resultControllers.getUserBetsForToday);






export default router;
