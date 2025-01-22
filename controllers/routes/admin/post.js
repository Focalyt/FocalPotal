const express = require("express");
const { ObjectId } = require("mongodb");
const bcrypt = require("bcryptjs");
const { auth1, isAdmin } = require("../../../helpers");
const moment = require("moment");
const { Courses, CourseSectors, Candidate, AppliedCourses } = require("../../models");
const candidateServices = require('../services/candidate')
const { candidateCashbackEventName } = require('../../db/constant');
const router = express.Router();
router.use(isAdmin);


router
	.route("/add")
	.get(async (req, res) => {
		try {
			return res.render(`${req.vPath}/admin/post/add`, {
				menu: 'addPost',
				
			});
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	
});



module.exports = router;
