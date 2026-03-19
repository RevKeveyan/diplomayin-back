const BaseController = require("./baseController");
const User = require("../models/User");
const Address = require("../models/Address");
const PaymentDetails = require("../models/Payment");

class PaymentController extends BaseController {
  constructor(Model) {
    super(Model);
  }


  getUserPayments = async (req, res) => {
    try {
      const { id } = req.params;
  
      const user = await User.findById(id);
      if (!user) return res.status(404).json({ message: "User not found" });
  
      // Исключаем CVV при получении платежек
      const payments = await PaymentDetails.find({ user: id }).select("-cvv");
  
      res.status(200).json({ payments });
    } catch (error) {
      res.status(500).json({
        message: "Error fetching payments",
        error: error.message,
      });
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
      const user = await User.findById(id);

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

  addPayment = async (req, res) => {
    const {id} = req.params;
    try {
        const {
            cardNumber,
            cardHolderName,
            expirationDate,
            cvv,
            billingAddress,
          } = req.body;

      // Проверяем, существует ли пользователь
      const user = await User.findById(id);
      if (!user) return res.status(404).json({ message: "User not found" });

      const newPayment = new PaymentDetails({
        user: id,
        cardNumber,
        cardHolderName,
        expirationDate,
        cvv,
        billingAddress,
      });

      await newPayment.save();
      res
        .status(201)
        .json({ message: "Address added successfully", address: newPayment });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error adding address", error: error.message });
    }
  };

}

module.exports = new PaymentController(PaymentDetails);
