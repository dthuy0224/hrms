const express = require("express");
const path = require("path");
const logger = require("morgan");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const session = require("express-session");
const passport = require("passport");
const flash = require("connect-flash");
const MongoStore = require("connect-mongo");
const favicon = require("serve-favicon");
const csrf = require("csurf");
const helmet = require("helmet");
const compression = require("compression");
const Boom = require("@hapi/boom");
require("dotenv").config();

// ⚠️ Khởi tạo ứng dụng Express
const app = express();

// 🛠 Kết nối MongoDB
const mongoose = require("mongoose");
const MONGO_URL = process.env.DB_URL || "mongodb://localhost:27017/HRMS";

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ Database connection error:", err);
    process.exit(1);
  }
}
connectDB();

// ✅ Bảo mật HTTP Headers
app.use(helmet());

// ✅ Cải thiện hiệu suất bằng compression
app.use(compression());

// Cấu hình view engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Middleware
app.use(favicon(path.join(__dirname, "public", "images", "favicon.ico")));
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// 🛠 Cấu hình session với MongoStore
app.use(
  session({
    secret: process.env.SESSION_SECRET || "mysupersecret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: MONGO_URL,
      collectionName: "sessions",
    }),
    cookie: { maxAge: 180 * 60 * 1000 },
  })
);

// Cấu hình Passport
require("./config/passport");
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// ✅ Cấu hình CSRF Protection
const csrfProtection = csrf();
app.use(cookieParser());
app.use(csrfProtection);

// ✅ Gán CSRF token vào res.locals
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  res.cookie("XSRF-TOKEN", req.csrfToken(), { httpOnly: true, secure: false }); 
  next();
});

// Middleware chung
app.use((req, res, next) => {
  res.locals.title = "HRMS System";
  res.locals.login = req.isAuthenticated();
  res.locals.session = req.session;
  res.locals.messages = req.flash();
  next();
});

// Load routes
const index = require("./routes/index");
const admin = require("./routes/admin");
const employee = require("./routes/employee");
const manager = require("./routes/manager");
const forgotPasswordRoutes = require("./routes/forgotPassword");

// Đăng ký routes
app.use("/", forgotPasswordRoutes);
app.use("/", index);
app.use("/admin", admin);
app.use("/manager", manager);
app.use("/employee", employee);

const cors = require("cors");

app.use(cors({
    origin: "http://localhost:3000",  // Cập nhật đúng domain frontend
    credentials: true
}));



// Middleware xử lý lỗi 404
app.use((req, res, next) => {
  next(Boom.notFound("Page Not Found"));
});

// Middleware xử lý lỗi chung
app.use((err, req, res, next) => {
  console.error("❌ Error:", err);
  const { statusCode, payload } = err.isBoom ? err.output : { statusCode: 500, payload: { message: "Internal Server Error" } };
  res.status(statusCode).render("error", { message: payload.message, error: req.app.get("env") === "development" ? err : {} });
});

// Debug - In danh sách route đã load
console.log("✅ Registered routes:");
app._router.stack.forEach((r) => {
  if (r.route && r.route.path) {
    console.log(`📌 ${r.route.stack[0].method.toUpperCase()} ${r.route.path}`);
  }
});

module.exports = app;
