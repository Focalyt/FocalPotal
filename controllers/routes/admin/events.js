const express = require("express");
const router = express.Router();
const { auth1 } = require("../../../helpers");

router.get("/add", auth1, async (req, res) => {
    try {
        return res.render("admin/event/add", { menu: 'event' });
    } catch (err) {
        console.error("Error loading Add Event page:", err);
        req.flash("error", "Something went wrong!");
        return res.redirect("back");
    }
});

module.exports = router;




// const express = require("express");
// const router = express.Router();
// const { auth1 } = require("../../../helpers");

// router.get("/add", auth1, async (req, res) => {
//     try {
//         return res.render("admin/addEvent/add", { menu: 'event' });
//     } catch (err) {
//         console.error("Error loading Add Event page:", err);
//         req.flash("error", "Something went wrong!");
//         return res.redirect("back");
//     }
// });

// module.exports = router;
