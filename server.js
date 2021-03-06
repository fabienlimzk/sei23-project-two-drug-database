const express = require("express");
const mongoose = require("mongoose");
const expressLayouts = require("express-ejs-layouts");
const server = express();
const session = require("express-session");
// const MongoStore = require('connect-mongo')(session);
const flash = require("connect-flash");
const passport = require("./config/passportConfig");
const cloudinary = require("cloudinary");
var moment = require('moment');
var shortDateFormat = "ddd @ h:mmA"; // to put in ejs <%= moment(Date()).format(shortDateFormat) %>
require("dotenv").config();

// connect to MongoDB cloud
mongoose.connect(
  process.env.MONGODBLIVE,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  },
  () => {
    console.log("Mongoose is coming!");
  }
);

server.use(express.static("./public")); // look for static files in public folder
server.use(express.urlencoded({ extended: true })); // collects form data
server.set("view engine", "ejs"); // view engine setup
server.use(expressLayouts);

server.use(
  session({
    secret: process.env.SECRET,
    saveUninitialized: true,
    resave: false,
    cookie: { maxAge: 360000 },
    // store: new MongoStore({ url: process.env.MONGODBLIVE }),
  })
);

// connect to cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDNAME,
  api_key: process.env.APIKEY,
  api_secret: process.env.APISECRET,
});

// passport initialization
server.use(passport.initialize());
server.use(passport.session());
server.use(flash());

server.use(function (req, res, next){
  res.locals.alerts = req.flash();
  res.locals.currentUser = req.user;
  next();
});

server.locals.moment = moment; // this makes moment available as a variable in every EJS page
server.locals.shortDateFormat = shortDateFormat;

server.get("/", (req, res) => {
  res.redirect("/intro");
});

// all routes
server.use("/", require("./routes/drug.route"));
server.use(require("./routes/auth.route"));

// connect to PORT
server.listen(process.env.PORT, () =>
  console.log(`connected to express on ${process.env.PORT}`)
);