const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const drugSchema = Schema(
  {
    name: {
      type: String,
      required: true,
    },
    drugClass: String,
    recommendedDose: String,
    description: String,
    imageUrl: String,
    status: {
      type: String,
      enum: ["open", "info pending to be provided", "info pending to be reviewed", "completed"],
      default: "open",
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
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
  },
  { timestamps: true }
);

const Drug = mongoose.model("Drug", drugSchema);

module.exports = Drug;