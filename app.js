const express = require("express");
const { errorHandler, notFound } = require("./middlewares/error");
const rateLimiting = require("express-rate-limit");
const xss = require("xss-clean");
const helmet = require("helmet");
const hpp = require("hpp");
const cors = require("cors");
require("dotenv").config();

// Init App
const app = express();

// Connection To DB
const connectToDB = require("./config/connectToDB");
connectToDB();

// Middleware
app.use(express.json());

// Security Headers [Helmet]
app.use(helmet());
// Prevent Http Param Pollution
app.use(hpp());
// Prevent XSS[Cross Site Scripting] Attacks
app.use(xss());
// Rate Limiting
app.use(
  rateLimiting({
    windowMs: 10 * 60 * 1000, // 10 Minutes
    max: 200,
  })
);

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
app.use("/api/password", require("./routes/passwordRoute"));

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
