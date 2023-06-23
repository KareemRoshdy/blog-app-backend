const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const {
  User,
  validateRegisterUser,
  validateLoginUser,
} = require("../models/User");

/**-------------------------------------
 * @des     Register New User
 * @route  /api/auth/register
 * @method  POST
 * @access  public
 --------------------------------------- */
module.exports.registerUserCtrl = asyncHandler(async (req, res) => {
  // Validation
  const { error } = validateRegisterUser(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  // Is User already exists
  let user = await User.findOne({ email: req.body.email });
  if (user) {
    return res.status(400).json({ message: "user already exist" });
  }

  // hash the password
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(req.body.password, salt);

  // new user and save it to db
  user = new User({
    username: req.body.username,
    email: req.body.email,
    password: hashPassword,
  });
  await user.save();

  // send a response to client
  res
    .status(201)
    .json({ message: "you registered Successfully, please log in" });
});

/**-------------------------------------
 * @des     Login New User
 * @route  /api/auth/loin
 * @method  POST
 * @access  public
 --------------------------------------- */
module.exports.loginUserCtrl = asyncHandler(async (req, res) => {
  // Validation
  const { error } = validateLoginUser(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  // Is User already exists
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(400).json({ message: "invalid email or password" });
  }

  // check the password
  const isPasswordMatch = await bcrypt.compare(
    req.body.password,
    user.password
  );
  if (!isPasswordMatch) {
    return res.status(400).json({ message: "invalid email or password" });
  }

  // Generate Token (JWT)
  const token = user.generateAuthToken();

  // Response To Client
  res.status(200).json({
    _id: user._id,
    username: user.username,
    email: user.email,
    isAdmin: user.isAdmin,
    profilePhoto: user.profilePhoto,
    token,
  });
});
