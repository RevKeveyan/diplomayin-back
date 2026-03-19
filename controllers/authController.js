const nodemailer = require("nodemailer");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const dotenv = require("dotenv");
const sendEmail = require("../mailer/send-mail");

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "jane_jan";

const BaseController = require("./baseController");

class AuthController extends BaseController {
  constructor(User) {
    super(User);
  }

  login = async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await this.BaseModel.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid password" });
      }

      const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1d" });
      res
        .status(200)
        .json({
          message: "Login successful",
          userData: {
            token,
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatar,
            role: user.role,
          },
        });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error during login", error: error.message });
    }
  };

  getAuthenticatedUser = async (req, res) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      const decodedData = jwt.verify(token, JWT_SECRET);
      const user = await User.findById({ _id: decodedData.id });

      if (!user) {
        return res.status(401).json({ error, message: "User not found" });
      }
      res
        .status(200)
        .json({
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
          role: user.role,
        });
    } catch (error) {
      return res.status(401).json({ error, message: "User not found" });
    }
  };

  sendPasswordResetCode = async (req, res) => {
    const { email } = req.body;
    try {
      const resetCode = crypto.randomBytes(3).toString("hex");
      const user = await this.BaseModel.findOne({ email });
      if (!user) {
        throw new Error("User not found");
      }

      user.passwordResetCode = resetCode;
      user.passwordResetExpiration = Date.now() + 5 * 60 * 1000;
      await user.save();

   

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Password Reset Code",
        text: `Your password reset code is: ${resetCode}. It will expire in 1 minutes.`,
      };

      await sendEmail(mailOptions);
      res.status(200).json({ message: "Reset code sent to your email" });
    } catch (error) {
      return res.status(400).json({ message: "Failed to send reset code" });
    }
  };

  resetPassword = async (req, res) => {
    try {
      const { email, resetCode, newPassword } = req.body;
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: "User not found" });

      if (
        user.passwordResetCode !== resetCode ||
        user.passwordResetExpiration < Date.now()
      ) {
        return res
          .status(400)
          .json({ message: "Invalid or expired reset code" });
      }

      user.password = await bcrypt.hash(newPassword, 10);
      user.passwordResetCode = null;
      user.passwordResetExpiration = null;
      await user.save();

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Password Changed",
        text: `Your password has been changed successfully.`,
      };

      await sendEmail(mailOptions);
      res.status(200).json({ message: "Password successfully reset" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  };

  logout = async (req, res) => {
    try {
      const token = req.headers.authorization.split(" ")[1];
      if (!token) {
        return res.status(400).json({ message: "Token required for logout" });
      }

      jwt.verify(token, JWT_SECRET, async (err, decoded) => {
        if (err) {
          return res.status(401).json({ message: "Invalid token" });
        }

        res.status(200).json({ message: "Logout successful" });
      });
    } catch (error) {
      -res
        .status(500)
        .json({ message: "Error during logout", error: error.message });
    }
  };

  sendPasswordResetCode = async (req, res) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: "User not found" });

      const resetCode = crypto.randomBytes(3).toString("hex");
      user.passwordResetCode = resetCode;
      user.passwordResetExpiration = Date.now() + 1 * 60 * 1000;
      await user.save();

      await sendEmail(
        email,
        "Password Reset Code",
        `Your reset code: ${resetCode}. Expires in 5 minutes.`
      );
      res.status(200).json({ message: "Reset code sent to your email" });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error sending reset code", error: error.message });
    }
  };
}

module.exports = new AuthController(User);
