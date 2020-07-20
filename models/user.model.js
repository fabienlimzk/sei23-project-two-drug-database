const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

var userSchema = new mongoose.Schema({
  firstname: {
    type: String,
    required: true,
  },
  lastname: {
    type: String,
    required: true,
  },
  dateOfBirth: {
    type: String,
    required: true,
  },
  phone: {
    type: Number,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    // isLength: {
    //   errorMessage: "Password should be at least 6 chars long",
    //   options: { min: 7},
    // }
  },
  drugs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Drug",
    }
  ],
  // edited: [
  //   {
  //     type: mongoose.Schema.Types.ObjectId,
  //     ref: "Drug",
  //   }
  // ],
  // reviewed: [
  //   {
  //     type: mongoose.Schema.Types.ObjectId,
  //     ref: "Drug",
  //   }
  // ],
  isAdmin: {
    type: Boolean,
    default: false,
  },
});

userSchema.pre("save", function (next){
  var user = this;
  // Only hash the password if it has been modified (or is new)
  if (!user.isModified("password")) return next();

  //hash the password
  var hash = bcrypt.hashSync(user.password, 10);

  // Override the cleartext password with the hashed one
  user.password = hash;
  
  next();
});

userSchema.methods.validPassword = function (password){
  // Compare is a bcrypt method that will return a boolean,
  return bcrypt.compareSync(password, this.password);
};

const User = mongoose.model("User", userSchema);

module.exports = User;