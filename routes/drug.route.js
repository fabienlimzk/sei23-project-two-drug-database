const router = require("express").Router();
const User  = require("../models/user.model");
const Drug = require("../models/drug.model");
const isLoggedIn = require("../config/loginBlocker");
const multer = require('multer');
const path = require('path');

// storage engine
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads");
  },
  filename: function (req, file, cb) {
    // file with unique names
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

// init upload
const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  }
});

// check upload file type
function checkFileType(file, cb){
  // allowed ext
  const filetypes = /jpeg|jpg|png/;

  // check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  // checkmime
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb('Error: .jpg, .jpeg, .png only');
  }
}


router.get("/dashboard", isLoggedIn, async (req, res) => {
  try {
    let user = await User.find()
    let drugs = await Drug.find()
    .populate("createdBy")
    .populate("editedBy")
    .populate("approvedBy")
    .populate("rejectedBy")
    res.render("dashboard/index", { user, drugs });
  } catch (error){
    console.log(error);
  }
});

router.get("/create", isLoggedIn, (req, res) => {
  res.render("drugs/create");
});

router.post("/create", upload.single("imageUrl"), isLoggedIn, async (req, res) => {
  try {
    // image uploaded == true
    if (req.file) {
      // all fields != ""
      if (req.body.drugClass !== "" && req.body.recommendedDose !== "" && req.body.description !== "") {
        let {
          name,
          drugClass,
          recommendedDose,
          description,
        } = req.body;
        
        const file = req.file;
    
        let drugExists = await Drug.exists({ name });
    
        if (!drugExists) {
          let drug = new Drug(
            {
              name,
              drugClass,
              recommendedDose,
              description,
              imageUrl: "/uploads/" + file.filename,
              createdBy: req.user._id,
              status: "info pending to be reviewed",
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
      } else if (req.body.drugClass === "" || req.body.recommendedDose === "" || req.body.description === "") {
        let {
          name,
          drugClass,
          recommendedDose,
          description,
        } = req.body;
        
        const file = req.file;
    
        let drugExists = await Drug.exists({ name });
    
        if (!drugExists) {
          let drug = new Drug(
            {
              name,
              drugClass,
              recommendedDose,
              description,
              imageUrl: "/uploads/" + file.filename,
              createdBy: req.user._id,
              status: "info pending to be provided",
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
      }
    } else if (!req.file) {
      // all fields != ""
      if (req.body.drugClass !== "" && req.body.recommendedDose !== "" && req.body.description !== "") {
        let {
          name,
          drugClass,
          recommendedDose,
          description,
        } = req.body;
        
        let drugExists = await Drug.exists({ name });
    
        if (!drugExists) {
          let drug = new Drug(
            {
              name,
              drugClass,
              recommendedDose,
              description,
              createdBy: req.user._id,
              status: "info pending to be provided",
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
      } else if (req.body.drugClass === "" || req.body.recommendedDose === "" || req.body.description === "") {
        let {
          name,
          drugClass,
          recommendedDose,
          description,
        } = req.body;
    
        let drugExists = await Drug.exists({ name });
    
        if (!drugExists) {
          let drug = new Drug(
            {
              name,
              drugClass,
              recommendedDose,
              description,
              createdBy: req.user._id,
              status: "info pending to be provided",
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
router.post("/edit/:id", upload.single("imageUrl"), isLoggedIn, async (req, res) => {
  try {
    // image uploaded == true
    if (req.file) {
      // all fields != ""
      if (req.body.drugClass !== "" && req.body.recommendedDose !== "" && req.body.description !== "") {
        const file = req.file;
  
        let finalData = {
          name: req.body.name,
          drugClass: req.body.drugClass,
          recommendedDose: req.body.recommendedDose,
          description: req.body.description,
          imageUrl: "/uploads/" + file.filename,
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
      } else if (req.body.drugClass === "" || req.body.recommendedDose === "" || req.body.description === "") {
        const file = req.file;

        let finalData = {
          name: req.body.name,
          drugClass: req.body.drugClass,
          recommendedDose: req.body.recommendedDose,
          description: req.body.description,
          imageUrl: "/uploads/" + file.filename,
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
      }
    } else if (!req.file) {
      // all fields != ""
      if (req.body.drugClass !== "" && req.body.recommendedDose !== "" && req.body.description !== "") {
        let finalData = {
          name: req.body.name,
          drugClass: req.body.drugClass,
          recommendedDose: req.body.recommendedDose,
          description: req.body.description,
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
      } else if (req.body.drugClass === "" || req.body.recommendedDose === "" || req.body.description === "") {
        let finalData = {
          name: req.body.name,
          drugClass: req.body.drugClass,
          recommendedDose: req.body.recommendedDose,
          description: req.body.description,
          editedBy: req.user._id,
          status: "info pending to be provided",
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
      }
    }
  } catch (error) {
    console.log(error);
  }
});

// TODO: same user that provide info cannot review the drug info that he/she provided
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
      approvedBy: req.user._id,
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
      rejectedBy: req.user._id,
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

router.get("/delete/:id", (req, res) => {
  if (req.user.isAdmin) {
    Drug.findByIdAndDelete(req.params.id)
    .then((drug) => {
      User.findByIdAndUpdate(drug.createdBy, { $pull: {
          created: req.params.id, edited: req.params.id, approved: req.params.id, rejected: req.params.id,
        } 
      })
      .then(() => {
        User.findByIdAndUpdate(drug.editedBy, { $pull: {
            created: req.params.id, edited: req.params.id, approved: req.params.id, rejected: req.params.id,
          } 
        })
        .then(() => {
          User.findByIdAndUpdate(drug.approvedBy, { $pull: {
              created: req.params.id, edited: req.params.id, approved: req.params.id, rejected: req.params.id,
            } 
          })
          .then(() => {
            User.findByIdAndUpdate(drug.rejectedBy, { $pull: {
                created: req.params.id, edited: req.params.id, approved: req.params.id, rejected: req.params.id,
              }
            })
            res.redirect("/dashboard");
          })
        })
      })
    })
    .catch((err) => {
      console.log(err);
    });
  }
});

module.exports = router;