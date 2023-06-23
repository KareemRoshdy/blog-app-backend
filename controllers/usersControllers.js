const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs"); // file system
const { User, validateUpdateUser } = require("../models/User");
const {
  cloudinaryRemoveImage,
  cloudinaryUploadImage,
  cloudinaryRemoveMultipleImage,
} = require("../utils/cloudinary");
const { Post } = require("../models/Post");
const { Comment } = require("../models/Comment");

/**-------------------------------------
 * @des     Get All Users Profile
 * @route  /api/users/profile
 * @method  GET
 * @access  private (only admin)
 --------------------------------------- */
module.exports.getAllUsersCtrl = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password");
  res.status(200).json(users);
});

/**-------------------------------------
 * @des     Get User Profile
 * @route  /api/users/profile/:id
 * @method  GET
 * @access  public
 --------------------------------------- */
module.exports.getUserCtrl = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select("-password")
    .populate("posts");
  if (!user) {
    return res.status(404).json({ message: "user not found" });
  }
  res.status(200).json(user);
});

/**-------------------------------------
 * @des     Update User Profile
 * @route  /api/users/profile/:id
 * @method  PUT
 * @access  private (only user himself)
 --------------------------------------- */
module.exports.updateUserProfileCtrl = asyncHandler(async (req, res) => {
  // Validation
  const { error } = validateUpdateUser(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  // Hashing Password
  if (req.body.password) {
    const salt = await bcrypt.genSalt(10);
    req.body.password = await bcrypt.hash(req.body.password, salt);
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        username: req.body.username,
        password: req.body.password,
        bio: req.body.bio,
      },
    },
    { new: true }
  ).select("-password");

  res.status(200).json(updatedUser);
});

/**-------------------------------------
 * @des     Get Users Count
 * @route  /api/users/count
 * @method  GET
 * @access  private (only admin)
 --------------------------------------- */
module.exports.getUsersCountCtrl = asyncHandler(async (req, res) => {
  const count = await User.count();
  res.status(200).json(count);
});

/**-------------------------------------
 * @des     Upload Profile Photo 
 * @route  /api/users/profile/profile-photo-upload
 * @method  POST
 * @access  private (only logged in user)
 --------------------------------------- */
module.exports.profilePhotoUpload = asyncHandler(async (req, res) => {
  // Validation
  if (!req.file) {
    return res.status(400).json({ message: "no file provided" });
  }

  // Get The Path To Image
  const imagePath = path.join(__dirname, `../images/${req.file.filename}`);

  // Upload To Cloudinary
  const result = await cloudinaryUploadImage(imagePath);

  // Get The User From DB
  const user = await User.findById(req.user.id);

  // Delete the old profile if exist
  if (user.profilePhoto.publicId !== null) {
    await cloudinaryRemoveImage(user.profilePhoto.publicId);
  }

  // Change the profile Photo field in the DB
  user.profilePhoto = {
    url: result.secure_url,
    publicId: result.public_id,
  };

  await user.save();

  // Send Response To client
  res.status(200).json({
    message: "your profile photo uploaded successfully",
    profilePhoto: {
      url: result.secure_url,
      publicId: result.public_id,
    },
  });

  // Remove Image From The Server
  fs.unlinkSync(imagePath);
});

/**-------------------------------------
 * @des     Delete Profile User
 * @route  /api/users/profile/:id
 * @method  DELETE
 * @access  private (only Admin or user himself)
 --------------------------------------- */
module.exports.deleteUserProfileCtrl = asyncHandler(async (req, res) => {
  // 1. Get the user from DB
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: "user not found" });
  }

  // 2. Get all posts from DB
  const posts = await Post.find({ user: user._id });

  // 3. Get the public ids from the posts
  const publicIds = posts?.map((post) => post.image.publicId);

  // 4. Delete all posts image from cloudinary that belong to this user
  if (publicIds?.length > 0) {
    await cloudinaryRemoveMultipleImage(publicIds);
  }

  // 5. Delete the profile picture from cloudinary
  await cloudinaryRemoveImage(user.profilePhoto.publicId);

  // 6. Delete user posts & comments
  await Post.deleteMany({ user: user._id });
  await Comment.deleteMany({ user: user._id });

  // 7. Delete the user himself
  await User.findByIdAndDelete(user.id);

  // 8. Send response to the client
  res.status(200).json({ message: "your profile has been deleted" });
});
