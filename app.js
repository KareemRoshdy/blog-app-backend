const express = require("express");
const { errorHandler, notFound } = require("./middlewares/error");
const cors = require("cors");
require("dotenv").config();

// Init App
const app = express();

// Connection To DB
const connectToDB = require("./config/connectToDB");
connectToDB();

// Middleware
app.use(express.json());

// Cors Policy
app.use(
  cors({
    origin: "http://localhost:3000",
  })
);
// Routes
app.use("/api/auth", require("./routes/authRoute"));
app.use("/api/users", require("./routes/usersRoute"));
app.use("/api/posts", require("./routes/postsRoute"));
app.use("/api/comments", require("./routes/commentsRoute"));
app.use("/api/categories", require("./routes/categoriesRoute"));

// Error Handler Middleware
app.use(notFound);
app.use(errorHandler);

// Running Server
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(
    `Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`
  );
});
