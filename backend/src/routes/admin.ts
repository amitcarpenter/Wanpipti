import express from "express";
import { upload, uploadModuleImage, uploadSectionImage, uploadFile, uploadMultipleFiles } from "../services/uploadImage";
import { authenticateUser, isAdmin } from "../middlewares/auth";

//==================================== Import Controller ==============================

import * as userControllers from "../controllers/admin/userController";
import * as sectionController from "../controllers/admin/sectionController";
import * as moduleController from "../controllers/admin/moduleController";
import * as lessonController from "../controllers/admin/lessonController";
import * as fileController from "../controllers/admin/fileController";
import * as quizController from "../controllers/admin/quizController";
import * as privacyPoliciesController from "../controllers/admin/privacyPolicyController";
import * as termsAndConditionsController from "../controllers/admin/termsAndConditionsController";

const router = express.Router();

//==================================== User ==============================
router.get(
  "/get-user-list",
  authenticateUser,
  isAdmin,
  userControllers.get_user_list
);

router.get(
  "/get-user-details/:id",
  authenticateUser,
  isAdmin,
  userControllers.get_user_details
);

router.delete(
  "/delete-user-by-id/:id",
  authenticateUser,
  isAdmin,
  userControllers.delete_user_by_id
);

router.put(
  "/edit-user-profile/:id",
  authenticateUser,
  isAdmin,
  upload.single("profileImage"),
  userControllers.updateUserProfileByAdmin
);

router.post(
  "/forgot-password-admin",
  userControllers.forgot_password_for_admin
);

router.get(
  "/reset-password",
  userControllers.render_forgot_password_page
);

router.post(
  "/reset-password",
  userControllers.reset_password
);

//==================================== Section ==============================
router.post(
  "/sections",
  authenticateUser,
  isAdmin,
  uploadSectionImage,
  sectionController.createSection
);
router.put(
  "/sections/:id",
  authenticateUser,
  isAdmin,
  uploadSectionImage,
  sectionController.updateSection
);
router.delete(
  "/sections/:id",
  authenticateUser,
  isAdmin,
  sectionController.deleteSection
);

router.get(
  "/sections-all",
  authenticateUser,
  isAdmin,
  sectionController.getSectionsForAdmin
);

//==================================== Module ==============================
router.post(
  "/modules",
  authenticateUser,
  isAdmin,
  uploadModuleImage,
  moduleController.createModule
);
router.put(
  "/modules/:id",
  authenticateUser,
  isAdmin,
  uploadModuleImage,
  moduleController.updateModuleById
);
router.delete(
  "/modules/:id",
  authenticateUser,
  isAdmin,
  moduleController.deleteModuleById
);

//==================================== Lesson ==============================
router.post(
  "/lessons",
  authenticateUser,
  isAdmin,
  lessonController.createLesson
);
router.put(
  "/lessons/:id",
  authenticateUser,
  isAdmin,
  lessonController.updateLessonById
);
router.delete(
  "/lessons/:id",
  authenticateUser,
  isAdmin,
  lessonController.deleteLessonById
);

//==================================== Quiz ==============================
router.post("/quizzes", authenticateUser, isAdmin, quizController.createQuiz);
router.put(
  "/quizzes/:id",
  authenticateUser,
  isAdmin,
  quizController.updateQuizById
);
router.put(
  "/quizzes/:id",
  authenticateUser,
  isAdmin,
  quizController.updateQuizById
);
router.delete(
  "/quizzes/:id",
  authenticateUser,
  isAdmin,
  quizController.deleteQuizById
);

//==================================== Privacy Policy ==============================
router.post(
  "/privacy-policy/create",
  authenticateUser,
  isAdmin,
  privacyPoliciesController.createPrivacyPolicy
);
router.put(
  "/privacy-policy/",
  authenticateUser,
  isAdmin,
  privacyPoliciesController.updatePrivacyPolicy
);
router.delete(
  "/privacy-policy/:id",
  authenticateUser,
  isAdmin,
  privacyPoliciesController.deletePrivacyPolicy
);

//==================================== Terms & Condition ==============================
router.post(
  "/terms-and-conditions/create",
  authenticateUser,
  isAdmin,
  termsAndConditionsController.createTermsCondition
);
router.put(
  "/terms-and-conditions/",
  authenticateUser,
  isAdmin,
  termsAndConditionsController.updateTermsCondition
);
router.delete(
  "/terms-and-conditions/:id",
  authenticateUser,
  isAdmin,
  termsAndConditionsController.deleteTermsCondition
);

//==================================== Terms & Condition ==============================
router.get(
  "/sidebar",
  authenticateUser,
  isAdmin,
  sectionController.sidebarshow
);

//==================================== File Upload System ==============================
router.post(
  "/file/upload",
  authenticateUser,
  isAdmin,
  uploadMultipleFiles,
  fileController.uploadFile
);

router.put(
  "/file/update/:id",
  authenticateUser,
  isAdmin,
  uploadMultipleFiles,
  fileController.updateFile
);

router.get(
  "/file/get/:id",
  authenticateUser,
  isAdmin,
  fileController.getFileById
);

router.get(
  "/file/get-all",
  authenticateUser,
  isAdmin,
  fileController.getAllFiles
);

router.delete(
  "/file/delete/:id",
  authenticateUser,
  isAdmin,
  fileController.deleteFile
);

export default router;
