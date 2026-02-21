

const express = require("express");
const cookieParser = require("cookie-parser");
const userRoutes = require("./routes/User.routes");
const uploadRoutes = require("./routes/Upload.routes");
const authRoutes = require('./routes/auth');

const cors = require("cors");

// BACKEND API :-
const mlRoutes = require("./routes/ml.routes");

// PAYMENT ROUTES :-
const paymentRoute = require("./routes/Payment.routes");

const app = express();

// ✅ CORS Configuration for Production
const allowedOrigins = [
  "http://localhost:5173",  // Development
  "http://localhost:3000",  // Alternative dev
  "https://tumor-trace-frontend.onrender.com",  // ✅ Production
  process.env.FRONTEND_URL  // From .env
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
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

// ✅ Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is running ✅', timestamp: new Date() });
});

module.exports = app;

