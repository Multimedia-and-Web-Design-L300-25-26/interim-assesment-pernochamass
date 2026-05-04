import mongoose from "mongoose";

const cryptoSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Coin name is required"],
      trim: true,
    },
    symbol: {
      type: String,
      required: [true, "Symbol is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    image: {
      type: String,
      default: "",
      trim: true,
    },
    change24h: {
      type: Number,
      required: [true, "24h change is required"],
      default: 0,
    },
  },
  {
    timestamps: true, // createdAt used for "new listings" sort
  }
);

// Index for common sort queries
cryptoSchema.index({ change24h: -1 });
cryptoSchema.index({ createdAt: -1 });

const Crypto = mongoose.model("Crypto", cryptoSchema);

export default Crypto;
