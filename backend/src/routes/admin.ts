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
import * as gameBetSettingControllers from "../controllers/admin/gameBetSettingController";
import * as walletTransactionControllers from "../controllers/admin/walletTransactionController";

const router = express.Router();

//==================================== USER ==============================
router.post("/user/add", authenticateUser, isAdmin, userControllers.add_user);
router.get("/user/:id", authenticateUser, isAdmin, userControllers.getUserById);
router.get("/user-list", authenticateUser, isAdmin, userControllers.getUserList);
router.delete("/user/delete/:id", authenticateUser, isAdmin, userControllers.delete_user_by_id);
router.post("/user/update/:id", authenticateUser, isAdmin, uploadFile, userControllers.updateUser);


//===================================== Game =============================
router.get("/games/all", authenticateUser, isAdmin, gameControllers.getGames);
router.post("/create-game", authenticateUser, isAdmin, gameControllers.createGame);
router.get("/games/today", authenticateUser, isAdmin, gameControllers.getTodayGames);
router.post("/game/update/:id", authenticateUser, isAdmin, gameControllers.updateGame);
router.delete("/game/delete/:id", authenticateUser, isAdmin, gameControllers.deleteGame);
router.post("/create-game-by-admin", authenticateUser, isAdmin, gameControllers.createGameByAdmin);
router.post("/game-winning-number-setting", authenticateUser, isAdmin, gameControllers.edit_game_details);


//===================================== Bet =============================
router.post("/bets-by-date", betControllers.getBetsbyDate);
router.get("/bets", authenticateUser, betControllers.getBets);
router.get("/bets/today", authenticateUser, isAdmin, betControllers.getBetsForToday);


//===================================== Game Setting =============================
router.get("/game-settings-all", authenticateUser, isAdmin, gameSettingControllers.getAllGameSettings);
router.post("/gamesetting-update", authenticateUser, isAdmin, gameSettingControllers.updateGameSetting);
router.post("/create-game-setting", authenticateUser, isAdmin, gameSettingControllers.createGameSetting);
router.get("/get-today-game-setting", authenticateUser, gameSettingControllers.getAllGameSettingsForToday);


//===================================== Game Bet Setting =============================
router.get("/game-bet-settings-all", gameBetSettingControllers.getAllGameBetSettings);
router.post("/gamebetsetting-update", gameBetSettingControllers.updateBetGameSetting);
router.post("/create-bet-game-setting", gameBetSettingControllers.createGameBetSetting);
router.delete("/gamebetsetting/delete/:id", gameBetSettingControllers.delete_game_limit);


//===================================== Role  =============================
router.post("/create-role", roleControllers.createRole);
router.get("/roles", authenticateUser, isAdmin, roleControllers.getRoles);
router.get("/get-role/:id", authenticateUser, isAdmin, roleControllers.getRoleById);
router.post("/update-role/:id", authenticateUser, isAdmin, roleControllers.updateRole);
router.delete("/delete-role/:id", authenticateUser, isAdmin, roleControllers.deleteRole);


//===================================== Result  =============================
router.post("/declare-result", authenticateUser, isAdmin, resultControllers.declareResults);
router.get("/game-result/today/:game_id", authenticateUser, isAdmin, resultControllers.getTodaysResultsForGames);


//===================================== Wallet Transaction  =============================
router.get("/get-wallet-trasaction/all", authenticateUser, isAdmin, walletTransactionControllers.getAllWalletTransactions);




export default router;
