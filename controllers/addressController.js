const BaseController = require("./baseController");
const User = require("../models/User");
const Address = require("../models/Address");
const PaymentDetails = require("../models/Payment");

class AddressController extends BaseController {
  constructor(Model) {
    super(Model);
  }


  updateAddress = async (req, res) => {
    try {
      const { id } = req.params;
      const { street, city, state, postalCode, country } = req.body;

      let address = await this.BaseModel.findById(id);
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

      const user = await User.findById(id);
      if (!user) return res.status(404).json({ message: "User not found" });

      const addresses = await this.BaseModel.find({ user: id });

      res.status(200).json({ addresses });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching addresses", error: error.message });
    }
  };

  getUserPayments = async (req, res) => {
    try {
      const { id } = req.params; 

      const user = await User.findById(id);
      if (!user) return res.status(404).json({ message: "User not found" });

      const payments = await PaymentDetails.find({ user: id });

      res.status(200).json({ payments });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching paymenst", error: error.message });
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
  addAddress = async (req, res) => {
    const {id} = req.params;
    try {
      const { street, city, state, postalCode, country } = req.body;

      // Проверяем, существует ли пользователь
      const user = await User.findById(id);
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

}

module.exports = new AddressController(Address);
