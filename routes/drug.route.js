const router = require("express").Router();
const User  = require("../models/user.model");
const Drug = require("../models/drug.model");
const isLoggedIn = require("../config/loginBlocker");

router.get("/dashboard", isLoggedIn, async (req, res) => {
  try {
    let user = await User.find()
    let drugs = await Drug.find()
    res.render("dashboard/index", { user, drugs });
  } catch (error){
    console.log(error);
  }
});

router.get("/create", isLoggedIn, (req, res) => {
  res.render("drugs/create");
});

// TODO: Do not allow duplicates
router.post("/create", (req, res) => {
  let data = {
    name: req.body.name,
    drugClass: req.body.drugClass,
    recommendedDose: req.body.recommendedDose,
    description: req.body.description,
    imageUrl: req.body.imageUrl,
    createdBy: req.user._id,
  }

  let drug = new Drug(data);
  console.log(drug);
  drug.save()
  .then(() => {
    User.findByIdAndUpdate(req.user._id, {
      $push: { drugs: drug._id }
    })
    .then(() => {
      req.flash("success", "Drug created!");
      res.redirect("/dashboard");
    });
  })
});

router.get("/view/:id", async (req, res) => {
  try {
    let drug = await Drug.findById(req.params.id)
    .populate("createdBy")
    .populate("editedBy")
    .populate("reviewedBy")
    res.render("drugs/view", { drug });
  } catch (error) {
    console.log(error);
  }
});

router.get("/edit/:id", (req, res) => {
  Drug.findById(req.params.id)
  .then((drug) => {
    res.render("drugs/edit", { drug });
  })
  .catch((err) => {
    console.log(err);
  });
});

router.post("/edit/:id", (req, res) => {
  Drug.findById(req.params.id)
  .then((drug) => {
    drug.name = req.body.name;
    drug.drugClass = req.body.drugClass;
    drug.recommendedDose = req.body.recommendedDose;
    drug.description = req.body.description;
    drug.imageUrl = req.body.imageUrl;
    drug.editedBy = req.user._id;
    drug.status = "info pending to be reviewed";
    drug.save()
    .then(() => {
      req.flash("success", "Drug updated");
      res.redirect("/dashboard");
    });
  });
});

router.get("/review/:id", async (req, res) => {
  try {
    let drug = await Drug.findById(req.params.id)
    .populate("createdBy")
    .populate("editedBy")
    res.render("drugs/review", { drug });
  } catch (error) {
    console.log(error);
  }
});

router.post("/review/approve/:id", (req, res) => {
  Drug.findById(req.params.id)
  .then((drug) => {
    drug.reviewedBy = req.user._id;
    drug.status = "completed"
    drug.save()
    .then(() => {
      req.flash("success", "Drug info approved");
      res.redirect("/dashboard");
    });
  });
});

router.post("/review/reject/:id", (req, res) => {
  Drug.findById(req.params.id)
  .then((drug) => {
    drug.reviewedBy = req.user._id;
    drug.status = "info pending to be amended"
    drug.save()
    .then(() => {
      req.flash("success", "Drug info rejected");
      res.redirect("/dashboard");
    });
  });
});

module.exports = router;