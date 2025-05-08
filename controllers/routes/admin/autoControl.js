const express = require("express");
const { AppUpdate, Qualification, Country, State } = require("../../models");
const { isAdmin } = require("../../../helpers");
const router = express.Router();
let path = require("path");
router.use(isAdmin);

router.route("/autocontrol")
    .get(async (req, res) => {
        try {
            // Pass 'menu' variable with the value 'autocontrol' to the view
            res.render(`${req.vPath}/admin/autoControl/autoControl`, {
                menu: 'autocontrol'  // Add the menu variable here
            });
        } catch (err) {
            console.log(err);
            req.flash("error", err.message || "Something went wrong!");
            return res.redirect("back");
        }
    });

module.exports = router;