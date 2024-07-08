import express from "express";
import { uploadFile, uploadProfileImage } from "../services/uploadImage";
import { authenticateUser, isAdmin } from "../middlewares/auth";

//==================================== Import Controller ==============================
import * as userControllers from "../controllers/api/userControllers";
import * as lessonController from "../controllers/api/lessonController";
import * as moduleController from "../controllers/api/moduleController";
import * as privacyPoliciesController from "../controllers/admin/privacyPolicyController";
import * as quizController from "../controllers/api/quizController";
import * as scoreController from "../controllers/api/scoreController";
import * as sectionController from "../controllers/api/sectionController";
import * as termsAndConditionsController from "../controllers/admin/termsAndConditionsController";
import * as homeController from "../controllers/api/homeController";

const router = express.Router();

//==================================== USER ==============================
router.post("/auth/register", userControllers.register);
router.post("/auth/verify-otp", userControllers.verifyOTP);
router.post("/auth/login", userControllers.login);
router.post("/auth/resend-otp", userControllers.resendOTPByEmail);
router.post("/auth/resend-reset-otp", userControllers.resendOTPByEmailForResetPassword);
router.post("/auth/signup/google", userControllers.signup_google);
router.post("/auth/signup/facebook", userControllers.signup_facebook);
router.get("/auth/isPassword", authenticateUser, userControllers.isPassword);
router.get("/auth/profile", authenticateUser, userControllers.getProfile);
router.put(
  "/auth/profile",
  uploadProfileImage,
  authenticateUser,
  userControllers.updateProfile
);
router.post(
  "/auth/profileImage/update",
  authenticateUser,
  uploadProfileImage,
  userControllers.profile_image_update
);
router.delete(
  "/auth/profileImage/delete",
  authenticateUser,
  userControllers.remove_profile_image
);
router.post("/auth/forgot-password", userControllers.forgotPassword);
router.post(
  "/auth/verify-forgot-password",
  userControllers.verify_otp_forgot_password
);
router.post(
  "/auth/change-password-by-email",
  userControllers.changePasswordByEmail
);
router.post(
  "/auth/change-password",
  authenticateUser,
  userControllers.changePassword
);
router.delete("/auth/delete-account", authenticateUser, userControllers.deleteAccount);

//=================================== section ==============================
router.get("/sections", authenticateUser, sectionController.getSections);

//==================================== Modules ==============================
router.get(
  "/modules",
  authenticateUser,
  authenticateUser,
  moduleController.getAllModules
);
router.get(
  "/modules/section-id/:id",
  authenticateUser,
  moduleController.getModuleBySectionId
);

//==================================== Lesson  ==============================
router.get("/lessons", authenticateUser, lessonController.getAllLessons);
router.get("/lessons/:id", authenticateUser, lessonController.getLessonById);
router.get("/lessons/:id", authenticateUser, lessonController.getLessonById);
router.get(
  "/lessons/module-id/:id",
  authenticateUser,
  lessonController.getLessonByModuleId
);

//==================================== Quiz ==============================
router.get("/quizzes", authenticateUser, quizController.getAllQuizzes);
router.get("/quizzes/:id", authenticateUser, quizController.getQuizById);
router.post(
  "/quizzes/check-answer",
  authenticateUser,
  quizController.check_quiz
);
router.get(
  "/quizzes/lesson-id/:id",
  authenticateUser,
  quizController.getQuizByLessonId
);
router.post(
  "/quizzes/submit-quiz",
  authenticateUser,
  quizController.submit_quiz
);

//==================================== Score LeaderBoard ==============================
router.get(
  "/scores/leaderboard",
  authenticateUser,
  scoreController.get_score_leaderboard
);

//==================================== Privacy Policy ==============================
router.get(
  "/privacy-policy",
  privacyPoliciesController.getAllPrivacyPolicies
);

//==================================== Terms and Conditions ==============================
router.get(
  "/terms-and-conditions",
  termsAndConditionsController.getTermsCondition
);


//==================================== Terms and Conditions ==============================
router.post(
  "/home-content",
  uploadFile, homeController.createHome
);

router.get(
  "/get-home-content", homeController.getAllHomes
);

export default router;
