
const express = require("express");
const router = express.Router();
const { auth1 } = require("../../../helpers");
const mongoose = require('mongoose');
const { Courses, CourseSectors, Candidate, AppliedCourses, Center, User } = require("../../models");




router.route('/addaccess')
    .get(auth1, async (req, res) => {
        try {
            const centers = await Center.find({ status: true });
            const courses = await Courses.find({ status: true })
            const users = await User.find({ role: 11 }).lean();  // lean() important hai yahan

            const updatedUsers = await Promise.all(users.map(async (user) => {
                const courseData = await Courses.find({ _id: { $in: user.access.courseAccess } }).lean();
                const centerData = await Center.find({ _id: { $in: user.access.centerAccess } }).lean();

                return {
                    ...user,
                    courseData,
                    centerData
                };
            }));

            console.log(updatedUsers);


            return res.render(`admin/portalAccess/Access`, {
                menu: 'accesstype',
                centers,
                courses,
                users
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
                    req.flash('error', 'Email already Exists')
                    console.log('Email already Exists')                   

                }
            };


            console.log("Body", body);

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
        return res.render(`admin/portalAccess/AccessType`, { menu: 'viewaccess' });
        // return res.render(`${req.vPath}/portalAccess/add`, { menu: 'accesstype' });


    } catch (err) {
        console.error("Error loading Add Event page:", err);
        req.flash("error", "Something went wrong!");
        return res.redirect("back");
    }
});



router.post('/getCoursesByCenter', async (req, res) => {
    try {
        const { centerIds } = req.body;
        console.log("centerIds",centerIds)
        let courses = null;

        if(centerIds=='any'){
            courses = await Courses.find({
                status: true
            })
        } else{
        // IDs को normalize कर लो (Array या Single दोनों चलेगा)
        const idsArray = Array.isArray(centerIds) ? centerIds : [centerIds];

        // Valid ObjectId check & conversion
        const validCenterIds = idsArray
            .filter(id => mongoose.Types.ObjectId.isValid(id))
            .map(id => new mongoose.Types.ObjectId(id));

        if (validCenterIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid Center ID(s)' });
        }

        // Courses जिनके center array में centerId मौजूद हो
        courses = await Courses.find({
            center: { $in: validCenterIds },
            status:true
        });}

        return res.status(200).json({ success: true, courses });

    } catch (error) {
        console.error("Error fetching courses:", error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
});




module.exports = router;
