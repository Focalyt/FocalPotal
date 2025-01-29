const express = require("express");
const router = express.Router();
const { isAdmin } = require("../../../helpers");

// Middleware to ensure the user is an admin
router.use(isAdmin);

// Senior Manager page route
router.get("/add", async (req, res) => {
  try {
    // Fetch any required data here if needed
    const data = []; // Replace with actual data
    return res.render(`${req.vPath}/admin/team/add`, { data, menu: 'addTeam', });
    // return res.render(`${req.vPath}/admin/team/junior`, { data });
  } catch (err) {
    req.flash("error", err.message || "Something went wrong!");
    return res.redirect("back");
  }
});

module.exports = router;
