const express = require("express");
const uniqid = require("uniqid");

const User = require("../models/user");
let instance = require("../utils/razorpay");

const { auth, notauth, adminAuth } = require("../middleware/auth");
const Payment = require("../models/payment");

const router = express.Router();

// router.get("/charges/add", adminAuth, async(req, res) => {
//     await User.findOneAndUpdate({ email: "cto@devoftech.com" }, {
//         bill: "9030000",
//         dueDate: new Date(2021, 2, 5),
//     });
//     res.send("Added Charges");
// });

router.get("/invoice/generate", auth, async (req, res) => {
  // if (req.user.bill < 1 || req.user.bill === undefined) {
  //   return res.send("You Don't Have Any Pending Bill");
  // }
  res.render("invoice", {
    user: req.user,
  });
});

router.get("/invoice/generate/payment", auth, async (req, res) => {
  try {
    if (req.query.amount) {
      let order_id;
      var options = {
        amount: req.query.amount * 100, // amount in the smallest currency unit
        currency: "INR",
        receipt: uniqid("reciept_id-"),
        payment_capture: "0",
      };
      instance.orders.create(options, function (err, order) {
        // console.log(order);
        // console.log(order.id);
        order_id = order.id;
      });

      res.render("invoice-ready", {
        order_id,
        user: req.user,
        amount: req.query.amount,
        charges: req.query.amount * 100,
      });
    } else {
      res.redirect("/invoice/generate");
    }
  } catch (e) {
    console.log(e);
    res.send("Something Went Wrong <br> " + e);
  }
});

router.get("/bill/paid", auth, async (req, res) => {
  try {
    if (req.query.razorpay_payment_id && req.query.amountPaid) {
      const user = await User.findOne({ _id: req.user._id });
      const capturePayment = await instance.payments.capture(
        req.query.razorpay_payment_id,
        req.query.amountPaid * 100,
        "INR"
      );

      const paymentDetails = await instance.payments.fetch(
        req.query.razorpay_payment_id
      );

      const payment = new Payment({
        ...req.query,
        paidBy: user._id,
      });

      await payment.save();

      (user.bill -= req.query.amountPaid * 100), await user.save();
      res.render("payment-successfull", {
        amount: req.query.amountPaid,
        payment_id: req.query.razorpay_payment_id,
        user: req.user,
      });
    } else {
      throw "Seems Like You Made A Mistake";
    }
  } catch (e) {
    console.log(e);
    res.send(req.user.schoolName + " tried to manipulate the code IP logged ");
  }
});

module.exports = router;
