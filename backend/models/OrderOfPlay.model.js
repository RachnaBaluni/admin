const mongoose = require("mongoose");

const OrderOfPlaySchema = new mongoose.Schema({
  eventId: {
    type: String,
    required: true
  },

  playDate: {
    type: String,
    required: true
  },

  grid: {
    type: Array,
    default: []
  }

}, { timestamps: true });

module.exports = mongoose.model("OrderOfPlay", OrderOfPlaySchema);