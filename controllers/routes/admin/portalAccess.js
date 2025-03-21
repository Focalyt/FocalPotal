
const express = require("express");
const router = express.Router();
const { auth1 } = require("../../../helpers");

router.get("/addaccess", auth1, async (req, res) => {
    try {
        return res.render(`admin/portalAccess/add`, { menu: 'accesstype' });
        // return res.render(`${req.vPath}/portalAccess/add`, { menu: 'accesstype' });

        
    } catch (err) {
        console.error("Error loading Add Event page:", err);
        req.flash("error", "Something went wrong!");
        return res.redirect("back");
    }
});
router.get("/viewaccess", auth1, async (req, res) => {
    try {
        return res.render(`admin/portalAccess/view`, { menu: 'viewaccess' });
        // return res.render(`${req.vPath}/portalAccess/add`, { menu: 'accesstype' });

        
    } catch (err) {
        console.error("Error loading Add Event page:", err);
        req.flash("error", "Something went wrong!");
        return res.redirect("back");
    }
});

module.exports = router;
