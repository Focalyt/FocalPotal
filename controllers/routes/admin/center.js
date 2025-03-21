const express = require("express");
const { auth1 } = require("../../../helpers");
const path = require('path');
const { Courses, CourseSectors, Candidate, AppliedCourses, Center } = require("../../models");

const router = express.Router();

router.route("/")
    .get(auth1, async (req, res) => {
        try {
            const center = await Center.find()
            return res.render(`${req.vPath}/admin/center/index`, {
                menu: 'center',
                center
            });
        } catch (err) {
            console.log(err);
            req.flash("error", err.message || "Something went wrong!");
            return res.redirect("back");
        }
    })
    .post(async (req, res) => {
        try {
            console.log(req.body);
            const addRecord = await Center.create(req.body);
            console.log(addRecord);
            return res.redirect("back");
            

        }catch (err) {
            console.log(err);
        
            if (err.code === 11000 && err.keyPattern && err.keyPattern.name) {
                req.flash("error", "Center already exists!");
            } else {
                req.flash("error", err.message || "Something went wrong!");
            }
        
            return res.redirect("back");
        }
    })

module.exports = router;
