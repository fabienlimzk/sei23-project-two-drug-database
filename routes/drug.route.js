const router = require("express").Router();
const User  = require("../models/user.model");
const Drug = require("../models/drug.model");
const isLoggedIn = require("../config/loginBlocker");

router.get("/dashboard", isLoggedIn, async (req, res) => {
  try {
    let user = await User.find()
    let drugs = await Drug.find()
    .populate("createdBy")
    .populate("editedBy")
    .populate("reviewedBy")
    res.render("dashboard/index", { user, drugs });
  } catch (error){
    console.log(error);
  }
});

router.get("/create", isLoggedIn, (req, res) => {
  res.render("drugs/create");
});

router.post("/create", async (req, res) => {
  try {
    let {
      name,
      drugClass,
      recommendedDose,
      description,
      imageUrl,
    } = req.body;

    let drugExists = await Drug.exists({ name });

    if (!drugExists) {
      let drug = new Drug(
        {
          name,
          drugClass,
          recommendedDose,
          description,
          imageUrl,
          createdBy: req.user._id,
        }
      );
      
      let savedDrug = await drug.save();

      if (savedDrug) {
        User.findByIdAndUpdate(req.user._id, {
          $push: { created: drug._id }
        })
        .then(() => {
          req.flash("success", "Drug created!");
          res.redirect("/dashboard");
        });
      }
    } else {
      throw {
        code: "DRUG_EXISTS",
      }
    }
  } catch (error) {
    console.log(error);
    if (error.code == "DRUG_EXISTS") {
      req.flash("error", "Drug already exists!");
      res.redirect("/create");
    }
  }
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

router.get("/edit/:id", isLoggedIn, (req, res) => {
  Drug.findById(req.params.id)
  .then((drug) => {
    res.render("drugs/edit", { drug });
  })
  .catch((err) => {
    console.log(err);
  });
});

// TODO: if any of the field(s) is empty, status != "info pending to be reviewed"
router.post("/edit/:id", async (req, res) => {
  try {
    let finalData = {
      name: req.body.name,
      drugClass: req.body.drugClass,
      recommendedDose: req.body.recommendedDose,
      description: req.body.description,
      imageUrl: req.body.imageUrl,
      editedBy: req.user._id,
      status: "info pending to be reviewed",
    }

    let editedDrug = await Drug.findByIdAndUpdate(req.params.id, finalData);

    if (editedDrug) {
      User.findByIdAndUpdate(req.user._id, {
        $push: { edited: req.params.id }
      })
      .then(() => {
        req.flash("success", "Drug edited!");
        res.redirect("/dashboard");
      });
    }
  } catch (error) {
    console.log(error);
  }
});

router.get("/review/:id", isLoggedIn, async (req, res) => {
  try {
    let drug = await Drug.findById(req.params.id)
    .populate("createdBy")
    .populate("editedBy")
    res.render("drugs/review", { drug });
  } catch (error) {
    console.log(error);
  }
});

router.post("/review/approve/:id", async (req, res) => {
  try {
    let finalData = {
      reviewedBy: req.user._id,
      status: "completed",
    }

    let approvedDrug = await Drug.findByIdAndUpdate(req.params.id, finalData);

    if (approvedDrug) {
      User.findByIdAndUpdate(req.user._id, {
        $push: { approved: req.params.id }
      })
      .then(() => {
        req.flash("success", "Drug info approved!");
        res.redirect("/dashboard");
      });
    }
  } catch (error) {
    console.log(error);
  }
});

router.post("/review/reject/:id", async (req, res) => {
  try {
    let finalData = {
      reviewedBy: req.user._id,
      status: "info pending to be amended",
    }

    let rejectedDrug = await Drug.findByIdAndUpdate(req.params.id, finalData);

    if (rejectedDrug) {
      User.findByIdAndUpdate(req.user._id, {
        $push: { rejected: req.params.id }
      })
      .then(() => {
        req.flash("error", "Drug info rejected!");
        res.redirect("/dashboard");
      });
    }
  } catch (error) {
    console.log(error);
  }
});

// TODO: remove drugs ref in user
router.get("/delete/:id", (req, res) => {
  User.findByIdAndUpdate(req.user._id, { $pull: {
      drugs: req.params.id 
    } 
  })
  .then(() => {
    Drug.findByIdAndDelete(req.params.drugid)
    .then(() => {
      res.redirect("/dashboard");
    })
  })
  .catch((err) => {
    console.log(err);
  });
});

module.exports = router;