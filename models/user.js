const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("mongoose-type-email");

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  type: { type: String },
  email: { type: mongoose.SchemaTypes.Email, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  contactNumber: { type: String, required: true },
  department: String,
  Skills: [String],
  designation: String,
  dateAdded: { type: Date, default: Date.now },
});

// Mã hóa mật khẩu trước khi lưu vào database
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    return next(err);
  }
});

// Hàm kiểm tra mật khẩu
UserSchema.methods.validPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Xuất model User
module.exports = mongoose.model("User", UserSchema);
