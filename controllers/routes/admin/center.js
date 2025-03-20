const express = require("express");
const { auth1 } = require("../../../helpers");
const path = require('path');
const router = express.Router();

router.route("/")
    .get(auth1, async (req, res) => {
        try {
            return res.render(`${req.vPath}/admin/center/index`, {
                menu: 'center'
            });
        } catch (err) {
            console.log(err);
            req.flash("error", err.message || "Something went wrong!");
            return res.redirect("back");
        }
    });

module.exports = router;
