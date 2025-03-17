const express = require("express");
const router = express.Router();
const User = require("../models/user");
const csrf = require("csurf");
const cookieParser = require("cookie-parser");
const validator = require("validator");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
require("dotenv").config();

// 🛠 Middleware CSRF với SameSite
const csrfProtection = csrf({
  cookie: {
    httpOnly: true, // ✅ Chỉ đọc qua HTTP
    secure: process.env.NODE_ENV === "production", // 🔒 Chỉ bật secure khi deploy
    sameSite: "Strict", // ✅ Tránh mất token do cross-site request
  },
});

console.log("✅ Forgot Password route file loaded");

// 📧 Cấu hình Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 🔍 Route GET - Trả CSRF token
router.get("/csrf-token", csrfProtection, (req, res) => {
  console.log("📢 CSRF Token sent:", req.csrfToken()); // Debug kiểm tra token
  return res.json({ csrfToken: req.csrfToken() });
});

// 🚀 Route POST - Xử lý yêu cầu quên mật khẩu
router.post("/forgot-password", csrfProtection, async function (req, res) {
  console.log("🚀 POST /forgot-password called with:", req.body);

  const { email } = req.body;

  // ❌ Kiểm tra email rỗng
  if (!email) {
    return res.status(400).json({ error: "Email cannot be empty." });
  }

  // ❌ Kiểm tra định dạng email
  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: "Invalid email format." });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "No account found with this email." });
    }

    // 🔑 Tạo mật khẩu mới & mã hóa
    const newPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 📌 Cập nhật mật khẩu mới
    user.password = hashedPassword;
    await user.save();

    // ✉ Gửi email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your New Password",
      html: `
        <p>Dear User,</p>
        <p>Your new password is: <strong style="color:red;">${newPassword}</strong></p>
        <p>For security reasons, please change your password immediately.</p>
        <p>Best Regards,</p>
        <p><strong>HRMS Team</strong></p>
      `,
    };

    await transporter.sendMail(mailOptions);

    console.log(`✅ Password reset email sent to ${email}`);

    return res.json({ message: "A new password has been sent to your email." });
  } catch (err) {
    console.error("❌ Error in forgot password:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

module.exports = router;
