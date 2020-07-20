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
          $push: { drugs: drug._id }
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

router.get("/edit/:id", (req, res) => {
  Drug.findById(req.params.id)
  .then((drug) => {
    res.render("drugs/edit", { drug });
  })
  .catch((err) => {
    console.log(err);
  });
});

// TODO: if any of the field(s) is empty, status != "info pending to be reviewed"
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

router.get("/delete/:drugid", (req, res) => {
  User.findByIdAndUpdate(req.user._id, { $pull: {
      drugs: req.params.drugid 
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