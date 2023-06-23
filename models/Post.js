const mongoose = require("mongoose");
const Joi = require("joi");

// Post Schema
const PostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    image: {
      type: Object,
      default: {
        url: "",
        publicId: null,
      },
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Populate Comment For This Post
PostSchema.virtual("comments", {
  ref: "Comment",
  foreignField: "postId",
  localField: "_id",
});

// Post model
const Post = mongoose.model("Post", PostSchema);

// Validate Create Post
const validateCreatePost = (obj) => {
  const schema = Joi.object({
    title: Joi.string().trim().min(2).max(10).required(),
    description: Joi.string().trim().min(10).required(),
    category: Joi.string().trim().required(),
  });
  return schema.validate(obj);
};

// Validate Update Post
const validateUpdatePost = (obj) => {
  const schema = Joi.object({
    title: Joi.string().trim().min(2).max(100),
    description: Joi.string().trim().min(10),
    category: Joi.string().trim(),
  });
  return schema.validate(obj);
};

module.exports = {
  Post,
  validateCreatePost,
  validateUpdatePost,
};
