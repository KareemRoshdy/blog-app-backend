const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const {
  User,
  validateRegisterUser,
  validateLoginUser,
} = require("../models/User");
const VerificationToken = require("../models/VerificationToken");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

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

  // Sending Email [verify account]
  // 1. Creating new VerificationToken & save it to DB
  const verificationToken = new VerificationToken({
    userId: user._id,
    token: crypto.randomBytes(32).toString("hex"),
  });
  await verificationToken.save();

  // 2. Making The Link
  const link = `${process.env.CLIENT_DOMAIN}/users/${user._id}/verify/${verificationToken.token}`;

  // 3. Putting the link into an HTML Template
  const htmlTemplate = `
    <div>
      <p>Click on the link below to verify your email</p>
      <a href="${link}">Verify</a>
    </div>
  `;

  // 4. Sending email to the user
  await sendEmail(user.email, "Verify Your Email", htmlTemplate);

  // 5. send a response to client
  res.status(201).json({
    message: "We sent to you an email, Please verify your email address",
  });
});

/**-------------------------------------
 * @des     Login New User
 * @route  /api/auth/login
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

  // Sending Email [Verify account if not verified]
  if (!user.isAccountVerified) {
    let verificationToken = await VerificationToken.findOne({
      userId: user._id,
    });

    if (!verificationToken) {
      verificationToken = new VerificationToken({
        userId: user._id,
        token: crypto.randomBytes(32).toString("hex"),
      });
      await verificationToken.save();
    }
    
    const link = `${process.env.CLIENT_DOMAIN}/users/${user._id}/verify/${verificationToken.token}`;

    const htmlTemplate = `
    <div>
      <p>Click on the link below to verify your email</p>
      <a href="${link}">Verify</a>
    </div>
  `;

    await sendEmail(user.email, "Verify Your Email", htmlTemplate);

    return res.status(400).json({
      message: "We sent to you an email, Please verify your email address",
    });
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

/**-------------------------------------
 * @des     Verify User Account
 * @route  /api/auth/:userId/verify/:token
 * @method  GET
 * @access  public
 --------------------------------------- */
module.exports.verifyUserAccountCtrl = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);
  // Check User
  if (!user) {
    return res.status(400).json({ message: "Invalid Link" });
  }

  // Check Token
  const verificationToken = await VerificationToken.findOne({
    userId: user._id,
    token: req.params.token,
  });

  if (!verificationToken) {
    return res.status(400).json({ message: "Invalid Link" });
  }

  // Change The Account Verification to True And Save it in DB
  user.isAccountVerified = true;
  await user.save();

  // Remove The VerificationToken and send a response to client
  await VerificationToken.findByIdAndDelete(verificationToken._id);

  res.status(200).json({ message: "Your account verified" });
});
