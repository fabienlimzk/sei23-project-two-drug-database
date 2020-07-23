const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const drugSchema = Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    drugClass: String,
    recommendedDose: String,
    description: String,
    imageUrl: String,
    status: {
      type: String,
      enum: ["pending information and image", "pending information", "pending image", "pending amendment", "pending review", "completed"],
      default: "pending information and image",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    editedBy: [
      {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      }
    ],
    approvedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    rejectedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
  },
  { timestamps: true }
);

const Drug = mongoose.model("Drug", drugSchema);

module.exports = Drug;