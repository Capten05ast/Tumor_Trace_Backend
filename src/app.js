

const express = require("express");
const cookieParser = require("cookie-parser");
const userRoutes = require("./routes/user.routes");
const uploadRoutes = require("./routes/upload.routes");
const authRoutes = require('./routes/auth');

const cors = require("cors");

// BACKEND API :-
const mlRoutes = require("./routes/ml.routes");

// PAYMENT ROUTES :-
const paymentRoute = require("./routes/payment.routes");

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

// MIDDLEWARES :-
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ROUTES :-
app.use("/api", userRoutes);
app.use("/api", uploadRoutes);
app.use("/api", mlRoutes);
app.use("/api/payment", paymentRoute);
app.use('/api/auth', authRoutes);

module.exports = app;