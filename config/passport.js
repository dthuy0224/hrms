const passport = require("passport");
const { body, validationResult } = require("express-validator");
const User = require("../models/user");
const LocalStrategy = require("passport-local").Strategy;

// Middleware kiểm tra dữ liệu đăng ký nhân viên
const validateEmployeeSignup = [
  body("email").notEmpty().isEmail().withMessage("Invalid email"),
  body("password").notEmpty().isLength({ min: 6 }).withMessage("Invalid password"),
];

// Local strategy for adding new employee
passport.use(
  "local.add-employee",
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
      passReqToCallback: true,
    },
    async (req, email, password, done) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return done(null, false, req.flash("error", errors.array().map(err => err.msg)));
      }

      try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          req.flash("error", "Email is already in use");
          return done(null, false);
        }

        const newUser = new User({
          email,
          password: new User().encryptPassword(password), // Fix lỗi gọi hàm
          name: req.body.name,
          dateOfBirth: new Date(req.body.DOB),
          contactNumber: req.body.number,
          department: req.body.department,
          Skills: req.body["skills[]"],
          designation: req.body.designation,
          dateAdded: new Date(),
          type: req.body.designation === "Accounts Manager"
            ? "accounts_manager"
            : req.body.designation === "Project Manager"
            ? "project_manager"
            : "employee",
        });

        await newUser.save();
        return done(null, newUser);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// Middleware kiểm tra đăng nhập
const validateSignin = [
  body("email").notEmpty().isEmail().withMessage("Invalid email"),
  body("password").notEmpty().withMessage("Invalid password"),
];

// Local strategy for signing in a user
passport.use(
  "local.signin",
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
      passReqToCallback: true,
    },
    async (req, email, password, done) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return done(null, false, req.flash("error", errors.array().map(err => err.msg)));
      }

      try {
        const user = await User.findOne({ email });
        if (!user || !user.validPassword(password)) {
          req.flash("error", "Incorrect email or password");
          return done(null, false);
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// Serialize & Deserialize User (Fix lỗi "Failed to serialize user into session")
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Export passport để tránh lỗi trong app.js
module.exports = passport;
module.exports.validateEmployeeSignup = validateEmployeeSignup;
module.exports.validateSignin = validateSignin;
