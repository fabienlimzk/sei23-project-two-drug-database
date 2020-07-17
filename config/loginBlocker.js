module.exports = function(req, res, next) {
  if (!req.user) {
    req.flash("error", "You must be logged in to access that page");
    rese.redirect("/auth/login");
  } else {
    next();
  }
};
