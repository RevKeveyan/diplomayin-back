const BaseController = require("./baseController");
const User = require("../models/User");
const Address = require("../models/Address");
const PaymentDetails = require("../models/Payment");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
const { optimizeImages } = require("../middleware/fileMidlleware1");
const path = require("path");
const fs = require("fs");
const { log } = require("console");

class UserController extends BaseController {
  constructor(Model) {
    super(Model);
  }
  updateAvatar = async (req, res) => {
    try {
      const { id } = req.params;
      if (!req.file) {
        return res.status(400).json({ message: "No image uploaded" });
      }
  
      // Найти пользователя
      const user = await this.BaseModel.findById(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Обрабатываем загруженное изображение
      const optimizedImages = await optimizeImages([req.file]); 
      const newAvatarPath = optimizedImages[0];

      if (user.avatar) {
        const oldAvatarPath = path.join("uploads/user/", path.basename(user.avatar));
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      }
  
      // Обновляем аватар в базе данных
      user.avatar = newAvatarPath;
      await user.save();
  
      res.status(200).json({
        message: "Avatar updated successfully",
        user:{firstName:user.firstName, lastName:user.lastName, avatar:user.avatar}
      });
    } catch (error) {
      res.status(500).json({ message: "Error updating avatar", error: error.message });
    }
  };
  
  register = async (req, res) => {
    try {
      const { firstName, lastName, email, password, phone } = req.body;

      // Проверка обязательных полей
      if (!firstName || !lastName || !email || !password || !phone) {
        return res.status(400).json({ message: "All fields are required." });
      }

      // Проверка: существует ли уже пользователь с таким email
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ message: "Email is already in use." });
      }

      // Проверка: существует ли уже пользователь с таким телефоном
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) {
        return res.status(409).json({ message: "Phone number is already in use." });
      }

      // Хешируем пароль
      const hashedPassword = await bcrypt.hash(password, 10);

      // Создаем нового пользователя
      const newUser = new User({
        firstName,
        lastName,
        email,
        phone,
        password: hashedPassword,
      });

      await newUser.save();

      res.status(201).json({ message: "User registered successfully." });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed.", error: error.message });
    }
  };

  // Create a new user (for admin purposes, different from register)
  create = async (req, res) => {
    try {
      const { email, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new this.BaseModel({ email, password: hashedPassword });
      await newUser.save();
      res.status(201).json({ message: "User created successfully" });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error creating user", error: error.message });
    }
  };

  // Edit user details
  edit = async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      if (updates.password) {
        updates.password = await bcrypt.hash(updates.password, 10);
      }
      const updatedUser = await this.BaseModel.findByIdAndUpdate(id, updates, {
        new: true,
      });
      if (!updatedUser)
        return res.status(404).json({ message: "User not found" });
      res.status(200).json(updatedUser);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error updating user", error: error.message });
    }
  };

  // Delete a user
  delete = async (req, res) => {
    try {
      const { id } = req.params;
      const deletedUser = await this.BaseModel.findByIdAndDelete(id);
      if (!deletedUser)
        return res.status(404).json({ message: "User not found" });
      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error deleting user", error: error.message });
    }
  };

  // Verify user based on JWT token
  verify = async (req, res) => {
    try {
      const token = req.headers.authorization.split(" ")[1];
      if (!token) return res.status(401).json({ message: "Token required" });

      jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ message: "Invalid token" });
        res.status(200).json({ message: "User verified", userId: decoded.id });
      });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error during verification", error: error.message });
    }
  };

  getUserById = async (req, res) => {
    try {
      const { id } = req.params; // Получаем id пользователя из параметров запроса

      // Ищем пользователя по id
      const user = await this.BaseModel.findById(id);

      // Если пользователь не найден, возвращаем ошибку
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Если пользователь найден, возвращаем его данные
      res.status(200).json(user);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching user", error: error.message });
    }
  };
  updateAddress = async (req, res) => {
    try {
      const { id } = req.params;
      const { street, city, state, postalCode, country } = req.body;

      let address = await Address.findById(id);
      if (!address)
        return res.status(404).json({ message: "Address not found" });

      address.street = street;
      address.city = city;
      address.state = state;
      address.postalCode = postalCode;
      address.country = country;

      await address.save();

      res
        .status(200)
        .json({ message: "Address updated successfully", address });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error updating address", error: error.message });
    }
  };

  getUserAddresses = async (req, res) => {
    try {
      const { id } = req.params; 

      const user = await this.BaseModel.findById(id);
      if (!user) return res.status(404).json({ message: "User not found" });

      const addresses = await Address.find({ user: id });

      res.status(200).json({ addresses });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching addresses", error: error.message });
    }
  };
  updatePaymentDetails = async (req, res) => {
    try {
      const { id } = req.params;
      const {
        cardNumber,
        cardHolderName,
        expirationDate,
        cvv,
        billingAddress,
      } = req.body;
      const user = await this.BaseModel.findById(id);

      if (!user) return res.status(404).json({ message: "User not found" });

      let paymentDetails = await PaymentDetails.findOne({ user: id });

      if (paymentDetails) {
        paymentDetails.cardNumber = cardNumber;
        paymentDetails.cardHolderName = cardHolderName;
        paymentDetails.expirationDate = expirationDate;
        paymentDetails.cvv = cvv;
        paymentDetails.billingAddress = billingAddress;

        await paymentDetails.save();

        return res.status(200).json({
          message: "Payment details updated successfully",
          paymentDetails,
        });
      } else {
        paymentDetails = new PaymentDetails({
          user: id,
          cardNumber,
          cardHolderName,
          expirationDate,
          cvv,
          billingAddress,
        });

        await paymentDetails.save();

        return res.status(201).json({
          message: "Payment details added successfully",
          paymentDetails,
        });
      }
    } catch (error) {
      res.status(500).json({
        message: "Error updating or creating payment details",
        error: error.message,
      });
    }
  };
  addAddress = async (req, res) => {
    const {id} = req.params;
    try {
      const { street, city, state, postalCode, country } = req.body;

      // Проверяем, существует ли пользователь
      const user = await this.BaseModel.findById(id);
      if (!user) return res.status(404).json({ message: "User not found" });

      const newAddress = new Address({
        user: id,
        street,
        city,
        state,
        postalCode,
        country,
      });

      await newAddress.save();
      res
        .status(201)
        .json({ message: "Address added successfully", address: newAddress });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error adding address", error: error.message });
    }
  };
  updatePassword = async (req, res) => {
    try {
      const { id } = req.params; // Получаем userId из параметров
      const { oldPassword, newPassword } = req.body; // Получаем старый и новый пароли

      // Проверяем, существует ли такой пользователь
      const user = await this.BaseModel.findById(id);
      if (!user) return res.status(404).json({ message: "User not found" });

      // Сравниваем старый пароль с текущим
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch)
        return res.status(400).json({ message: "Old password is incorrect" });

      // Хэшируем новый пароль
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // Обновляем пароль
      user.password = hashedNewPassword;
      await user.save();

      // Возвращаем успешный ответ
      res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error updating password", error: error.message });
    }
  };
}

module.exports = new UserController(User);
