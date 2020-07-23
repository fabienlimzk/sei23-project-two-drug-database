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
      enum: ["info and image pending to be provided", "info pending to be provided", "image pending to be provided", "info pending to be amended", "info pending to be reviewed", "completed"],
      default: "info and image pending to be provided",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    editedBy: [
      {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
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