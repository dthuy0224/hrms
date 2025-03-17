const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/user");
const { isLoggedIn } = require("./middleware");
const csrf = require("csurf");

const csrfProtection = csrf(); // Sử dụng session thay vì cookie

// ✅ Chỉ áp dụng CSRF cho các route cần thiết
router.get("/", csrfProtection, function viewLoginPage(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/check-type");
  }

  const messages = req.flash("error");
  res.render("login", {
    title: "Log In",
    csrfToken: req.csrfToken(),
    messages: messages,
    hasErrors: messages.length > 0,
  });
});

router.post(
  "/login",
  function (req, res, next) {
    passport.authenticate("local.signin", function (err, user, info) {
      if (err) return next(err);
      if (!user) {
        req.flash("error", info.message);
        return res.redirect("/");
      }
      req.logIn(user, function (err) {
        if (err) return next(err);
        return res.redirect("/check-type");
      });
    })(req, res, next);
  }
);



router.get("/check-type", function checkTypeOfLoggedInUser(req, res, next) {
  if (!req.user) {
    return res.redirect("/");
  }

  req.session.user = req.user;
  switch (req.user.type) {
    case "project_manager":
    case "accounts_manager":
      return res.redirect("/manager/");
    case "employee":
      return res.redirect("/employee/");
    default:
      return res.redirect("/admin/");
  }
});

// ✅ Fix lỗi CSRF token trong forgot-password
router.get("/forgot-password", csrfProtection, (req, res) => {
  res.render("forgot-password", {
    title: "Forgot Password",
    csrfToken: req.csrfToken(),
    messages: req.flash(),
  });
});

// ✅ Logout không cần CSRF
router.get("/logout", isLoggedIn, function (req, res, next) {
  req.logout(function (err) {
    if (err) return next(err);
    
    req.session.destroy((err) => {
      if (err) return next(err);

      res.clearCookie("connect.sid", { path: "/" });  // Xóa session cookie
      res.redirect("/");
    });
  });
});


// ✅ Signup với CSRF Protection
router.get("/signup", csrfProtection, function signUp(req, res, next) {
  const messages = req.flash("error");
  res.render("signup", {
    csrfToken: req.csrfToken(),
    messages: messages,
    hasErrors: messages.length > 0,
  });
});

router.post(
  "/signup",
  csrfProtection,
  function (req, res, next) {
    passport.authenticate("local.signup", function (err, user, info) {
      if (err) return next(err);
      if (!user) {
        req.flash("error", info.message);
        return res.redirect("/signup");
      }
      req.logIn(user, function (err) {
        if (err) return next(err);
        return res.redirect("/signup");
      });
    })(req, res, next);
  }
);

// ✅ Fix lỗi try-catch khi lấy dữ liệu
router.get("/dummy", async function (req, res, next) {
  try {
    const users = await User.find({ type: "employee" });
    res.render("dummy", { title: "Dummy", users });
  } catch (err) {
    console.error("❌ Error fetching dummy data:", err);
    next(err);
  }
});

module.exports = router;
