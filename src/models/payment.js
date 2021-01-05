const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  razorpay_payment_id: {
    type: String,
    required: true,
  },
  amountPaid: {
    type: Number,
    required: true,
  },
  paidOn: {
    type: Date,
    default: new Date(),
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
});

// paymentSchema.virtual("User", {
//   ref: "User",
//   localField: "paidBy",
//   foreignField: "_id",
// });

const Payment = mongoose.model("Payment", paymentSchema);

module.exports = Payment;
