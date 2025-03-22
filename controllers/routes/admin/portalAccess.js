
const express = require("express");
const router = express.Router();
const { auth1 } = require("../../../helpers");
const { Courses, CourseSectors, Candidate, AppliedCourses, Center,User } = require("../../models");




router.route('/addaccess')
    .get(auth1, async (req, res) => {
        try {
            const centers = await Center.find({ status: true });
            const courses = await Courses.find({ status: true })
            return res.render(`admin/portalAccess/add`, {
                menu: 'accesstype',
                centers,
                courses
            });
            // return res.render(`${req.vPath}/portalAccess/add`, { menu: 'accesstype' });


        } catch (err) {
            console.error("Error loading Add Event page:", err);
            req.flash("error", "Something went wrong!");
            return res.redirect("back");
        }
    })
    .post(auth1, async (req, res) => {
        try {
            console.log(req.body);

            let body = req.body;
            let email = body.email;
            

            if (email) {
                let duplicateEmail = await User.findOne({ email: email })
                if (duplicateEmail) {
                    console.log('Email already Exists')
                    req.flash('error', 'Email already Exists')
                    return res.redirect('/admin/roles')

                }
            };
           

            console.log("Body",body);            

            let user = await User.create(body)
            if (!user) {
                req.flash('error', 'User not added')
                return res.redirect('/admin/roles')
            }
            req.flash('success', 'User added Successfully')
            return res.redirect('/admin/portalaccess/addaccess')


        } catch (err) {
            console.error("Error loading Add Event page:", err);
            req.flash("error", "Something went wrong!");
            return res.redirect("back");
        }
    })

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
