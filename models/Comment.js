const mongoose = require("mongoose");
const Joi = require("joi");

// Comment Schema
const CommentSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Comment Model
const Comment = mongoose.model("Comment", CommentSchema);

// validate Create Comment
const validateCreateComment = (obj) => {
  const schema = Joi.object({
    postId: Joi.string().required().label("Post ID"),
    text: Joi.string().trim().required(),
  });
  return schema.validate(obj);
};

// validate Update Comment
const validateUpdateComment = (obj) => {
  const schema = Joi.object({
    text: Joi.string().required(),
  });
  return schema.validate(obj);
};

module.exports = {
  Comment,
  validateUpdateComment,
  validateCreateComment,
};
