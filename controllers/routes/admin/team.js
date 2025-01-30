const express = require("express");
const router = express.Router();
const { isAdmin } = require("../../../helpers");
const moment = require("moment");
const { Vacancy } = require("../../models"); 
const { ObjectId } = require("mongodb");


router.use(isAdmin);


router.get("/add", async (req, res) => {
  try {
    const data = []; 
    return res.render(`${req.vPath}/admin/team/add`, { data, menu: "addTeam" });
  } catch (err) {
    req.flash("error", err.message || "Something went wrong!");
    return res.redirect("back");
  }
});


router.get("/view", async (req, res) => {
  try {
  
    const jd = await Vacancy.find({})
      .populate("_company", "name") 
      .populate("_qualification", "name") 
      .lean(); 

    if (!jd || jd.length === 0) {
      req.flash("error", "No job data found");
    }
    let isChecked = req.query.status === "false" ? "true" : "false";
    const data = {};
    const totalPages = Math.ceil(jd.length / 20); 

    return res.render(`${req.vPath}/admin/team/teamMember`, {
      jd,
      data,
      moment,
      totalPages,
      menu: "team",
    });
  } catch (err) {
    console.error("Error fetching job listings:", err);
    req.flash("error", err.message || "Something went wrong!");
    return res.redirect("back");
  }
});

module.exports = router;
