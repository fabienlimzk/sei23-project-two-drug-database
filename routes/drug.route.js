const router = require("express").Router();
const User  = require("../models/user.model");
const Drug = require("../models/drug.model");
const isLoggedIn = require("../config/loginBlocker");
const multer = require('multer');
const upload = multer({ dest: './public/uploads/' });
const cloudinary = require("cloudinary");

router.get("/intro", async (req, res) => {
  try {
    let drugs = await Drug.find()
    res.render("intro/index", { drugs });
  } catch (error){
    console.log(error);
  }
});

router.get("/dashboard", isLoggedIn, async (req, res) => {
  try {
    let user = await User.find()
    let drugs = await Drug.find()
    .populate("createdBy")
    .populate("editedBy")
    .populate("approvedBy")
    .populate("rejectedBy")
    // console.log(drugs[0].editedBy[0]._id);
    // console.log(req.user._id);
    res.render("dashboard/index", { user, drugs });
  } catch (error) {
    console.log(error);
  }
});

router.get("/create", isLoggedIn, (req, res) => {
  res.render("drugs/create");
});

router.post("/create", upload.single("imageUrl"), isLoggedIn, async (req, res) => {
  try {
    // check if image uploaded == true
    if (req.file) {
      cloudinary.uploader.upload(req.file.path, async (result) => { 
        // check fields === "" or not
        if (req.body.drugClass === "" || req.body.recommendedDose === "" || req.body.description === "") {
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
                imageUrl: result.secure_url,
                createdBy: req.user._id,
                status: "pending information",
              }
            );
            
            let savedDrug = await drug.save();
            // console.log(drug.imageUrl);

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
        } else if (req.body.drugClass !== "" && req.body.recommendedDose !== "" && req.body.description !== "") {
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
                imageUrl: result.secure_url,
                createdBy: req.user._id,
                editedBy: req.user._id,
                status: "pending review",
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
      });
    } else if (!req.file) {
      // all fields != ""
      if (req.body.drugClass === "" || req.body.recommendedDose === "" || req.body.description === "") {
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
              status: "pending information and image",
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
      } else if (req.body.drugClass !== "" && req.body.recommendedDose !== "" && req.body.description !== "") {
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
              status: "pending image",
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
    .populate("approvedBy")
    .populate("rejectedBy")
    res.render("drugs/view", { drug });
  } catch (error) {
    console.log(error);
  }
});

router.get("/upload-image/:id", async (req, res) => {
  try {
    let drug = await Drug.findById(req.params.id)
    .populate("createdBy")
    .populate("editedBy")
    .populate("approvedBy")
    .populate("rejectedBy")
    res.render("drugs/upload-image", { drug });
  } catch (error) {
    console.log(error);
  }
});

router.post("/upload-image/:id", upload.single("imageUrl"), async (req, res) => {
  try {
    if (req.file) {
      cloudinary.uploader.upload(req.file.path, async (result) => {
        let finalData = {
          imageUrl: result.secure_url,
          editedBy: req.user._id,
          status: "pending review",
        }

        let imageUploaded = await Drug.findByIdAndUpdate(req.params.id, finalData);
      
        if (imageUploaded) {
          User.findByIdAndUpdate(req.user._id, {
            $push: { edited: req.params.id }
          })
          .then(() => {
            req.flash("success", "Drug image uploaded!");
            res.redirect("/dashboard");
          });
        }
      });
    } else if (!req.file) {
      req.flash("error", "Please upload an image!");
      res.redirect("/upload-image/" + req.params.id);
    }
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
      cloudinary.uploader.upload(req.file.path, async (result) => {
        // all fields != ""
        if (req.body.drugClass === "" || req.body.recommendedDose === "" || req.body.description === "") {
          let finalData = {
            name: req.body.name,
            drugClass: req.body.drugClass,
            recommendedDose: req.body.recommendedDose,
            description: req.body.description,
            imageUrl: result.secure_url,
            editedBy: req.user._id,
            status: "pending review",
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
        } else if (req.body.drugClass !== "" && req.body.recommendedDose !== "" && req.body.description !== "") {
          let finalData = {
            name: req.body.name,
            drugClass: req.body.drugClass,
            recommendedDose: req.body.recommendedDose,
            description: req.body.description,
            imageUrl: result.secure_url,
            editedBy: req.user._id,
            status: "pending review",
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
      });
    } else if (!req.file) {
      // all fields != ""
      if (req.body.drugClass === "" || req.body.recommendedDose === "" || req.body.description === "" || Drug.imageUrl === "") {
        let finalData = {
          name: req.body.name,
          drugClass: req.body.drugClass,
          recommendedDose: req.body.recommendedDose,
          description: req.body.description,
          editedBy: req.user._id,
          status: "pending information and image",
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
      } else if (req.body.drugClass !== "" && req.body.recommendedDose !== "" && req.body.description !== "") {
        let finalData = {
          name: req.body.name,
          drugClass: req.body.drugClass,
          recommendedDose: req.body.recommendedDose,
          description: req.body.description,
          editedBy: req.user._id,
          status: "pending image",
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
      } else if (req.body.drugClass !== "" && req.body.recommendedDose !== "" && req.body.description !== "" && Drug.imageUrl !== "") {
        let finalData = {
          name: req.body.name,
          drugClass: req.body.drugClass,
          recommendedDose: req.body.recommendedDose,
          description: req.body.description,
          editedBy: req.user._id,
          status: "pending review",
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
      status: "pending amendment",
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

router.get("/amendment/:id", isLoggedIn, (req, res) => {
  Drug.findById(req.params.id)
  .then((drug) => {
    res.render("drugs/amendment", { drug });
  })
  .catch((err) => {
    console.log(err);
  });
});

router.post("/amendment/:id", upload.single("imageUrl"), isLoggedIn, async (req, res) => {
  try {
    // all fields != ""
    if (req.body.drugClass === "" || req.body.recommendedDose === "" || req.body.description === "") {
      throw {
        code: "EMPTY_FIELDS"
      }
    } else if (req.body.drugClass !== "" && req.body.recommendedDose !== "" && req.body.description !== "") {
      let finalData = {
        name: req.body.name,
        drugClass: req.body.drugClass,
        recommendedDose: req.body.recommendedDose,
        description: req.body.description,
        editedBy: req.user._id,
        status: "pending review",
      }
      
      let amendedDrug = await Drug.findByIdAndUpdate(req.params.id, finalData);

      if (amendedDrug) {
        User.findByIdAndUpdate(req.user._id, {
          $push: { edited: req.params.id }
        })
        .then(() => {
          req.flash("success", "Drug amended!");
          res.redirect("/dashboard");
        });
      }
    }
  } catch (error) {
    console.log(error);
    if (error.code == "EMPTY_FIELDS") {
      req.flash("error", "Please enter all fields!");
      res.redirect("/amendment/" + req.params.id);
    }
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