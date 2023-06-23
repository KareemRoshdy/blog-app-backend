const router = require("express").Router();
const {
  getAllUsersCtrl,
  getUserCtrl,
  updateUserProfileCtrl,
  getUsersCountCtrl,
  profilePhotoUpload,
  deleteUserProfileCtrl,
} = require("../controllers/usersControllers");
const photoUpload = require("../middlewares/photoUpload");
const validateObjectId = require("../middlewares/validateObjectId");
const {
  verifyTokenAndAdmin,
  verifyTokenAndOnlyUser,
  verifyToken,
  verifyTokenAndAuthorization,
} = require("../middlewares/verifyToken");

// /api/users/profile
router.route("/profile").get(verifyTokenAndAdmin, getAllUsersCtrl);

// /api/users/profile/:id
router
  .route("/profile/:id")
  .get(validateObjectId, getUserCtrl)
  .put(validateObjectId, verifyTokenAndOnlyUser, updateUserProfileCtrl)
  .delete(validateObjectId, verifyTokenAndAuthorization, deleteUserProfileCtrl);

// /api/users/profile/profile-photo-upload
router
  .route("/profile/profile-photo-upload")
  .post(verifyToken, photoUpload.single("image"), profilePhotoUpload);

// /api/users/count
router.route("/count").get(verifyTokenAndAdmin, getUsersCountCtrl);

module.exports = router;
