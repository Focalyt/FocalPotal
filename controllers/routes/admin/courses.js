const express = require("express");
const { ObjectId } = require("mongodb");
const mongoose = require('mongoose');
const bcrypt = require("bcryptjs");
const { auth1, isAdmin } = require("../../../helpers");
const moment = require("moment");
const { Courses, CourseSectors, Candidate, AppliedCourses } = require("../../models");
const candidateServices = require('../services/candidate')
const { candidateCashbackEventName } = require('../../db/constant');
const router = express.Router();
router.use(isAdmin);

router.route("/").get(async (req, res) => {
	try {
		let view = false
		if (req.session.user.role === 10) {
			view = true
		}
		const data = req.query;
		const fields = {
			isDeleted: false
		}
		if (data['name'] != '' && data.hasOwnProperty('name')) {
			fields["name"] = { "$regex": data['name'], "$options": "i" }
		}
		if (data.FromDate && data.ToDate) {
			let fdate = moment(data.FromDate).utcOffset("+05:30").startOf('day').toDate()
			let tdate = moment(data.ToDate).utcOffset("+05:30").endOf('day').toDate()
			fields["createdAt"] = {
				$gte: fdate,
				$lte: tdate
			}
		}

		if (req.query.status == undefined) {
			var status = true;
			var isChecked = "false";
		} else if (req.query.status.toString() == "true") {
			var status = true;
			var isChecked = "false";
		} else if (req.query.status.toString() == "false") {
			var status = false;
			var isChecked = "true";
		}
		fields["status"] = status;
		let courses = await Courses.find(fields).populate("sectors")
		// console.log(courses, "this is courses")
		return res.render(`${req.vPath}/admin/course`, {
			menu: 'course',
			view,
			courses,
			isChecked,
			data
		});

	} catch (err) {
		req.flash("error", err.message || "Something went wrong!");
		return res.redirect("back");
	}
});
router
	.route("/add")
	.get(async (req, res) => {
		try {
			const sectors = await CourseSectors.find({ status: true })
			return res.render(`${req.vPath}/admin/course/add`, {
				menu: 'addCourse',
				sectors
			});
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})
	.post(async (req, res) => {
		try {
			console.log(req.body, "this is body of post data>>>>><><><><><")
			let photos = req.body.photos?.split(',')
			let testimonialvideos = req.body.testimonialvideos?.split(',')
			let videos = req.body.videos?.split(',')
			let body = req.body;
			body.photos = photos
			body.testimonialvideos = testimonialvideos
			body.videos = videos

			const addRecord = await Courses.create(body);
			console.log(JSON.stringify(addRecord), "create coursessssssss")
			if (addRecord) {
				return res.json({ status: true, message: "Record added!" })
			} else {
				return res.json({ status: false, message: "Record not added!" })
			}
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");

		}
	});
router.route("/changeStatus").patch(async (req, res) => {
	try {
		const updata = { $set: { status: req.body.status } };

		const data = await Courses.findByIdAndUpdate(req.body.id, updata);

		if (!data) {
			return res.status(500).send({
				status: false,
				message: "Can't update status of this course",
			});
		}

		return res.status(200).send({ status: true, data: data });
	} catch (err) {
		req.flash("error", err.message || "Something went wrong!");
		return res.status(500).send({ status: false, message: err.message });
	}
});

router
	.route("/edit/:id")
	.get(async (req, res) => {
		try {
			const { id } = req.params;
			let course = await Courses.findById(id);
			if (!course) throw req.ykError("course not found!");
			const sectors = await CourseSectors.find({
				status: true, _id: {
					$nin: course.sectors
				}
			})
			course = await Courses.findById(id).populate('sectors');
			console.log(course, "this is course>?<<<<edited course")
			return res.render(`${req.vPath}/admin/course/edit`, {
				course,
				sectors,
				id,
				menu: 'course'
			});

		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})
	.post(async (req, res) => {
		try {
			let { id } = req.params
			let body = req.body;
			console.log(body)
			body.photos = req.body.photos?.split(',')
			body.videos = req.body.videos?.split(',')
			body.testimonialvideos = req.body.testimonialvideos?.split(',')
			const updateCourse = await Courses.findByIdAndUpdate(id, { $set: body }, { new: true });
			console.log(updateCourse, "updateCourse updateCourse data")
			if (updateCourse) {
				req.flash("success", "Course updated successfully!");
				return res.json({ status: true, message: "Record added!" })
			} else {
				return res.json({ status: false, message: "Record not added!" })
			}
		} catch (err) {
			console.log('err: ', err);
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});
router.route("/getCourseViaSector").get(async (req, res) => {
	try {
		const { sectorId } = req.query;
		const courses = await Courses.find({
			sectors: {
				$in: [new mongoose.Types.ObjectId(sectorId)]
			},
			isDeleted: false
		});
		return res.status(200).json({ status: true, data: courses });
	} catch (error) {
		req.flash("error", err.message || "Something went wrong!");
		return res.redirect("back");
	}
})
router.route("/getCourseDetailById").get(async (req, res) => {
	try {
		const { courseId } = req.query;
		const courses = await Courses.findOne({
			_id: {
				$in: [new mongoose.Types.ObjectId(courseId)]
			},
			isDeleted: false
		});
		return res.status(200).json({ status: true, data: [courses] });
	} catch (error) {
		req.flash("error", err.message || "Something went wrong!");
		return res.redirect("back");
	}
});
router.route("/registrations")
	.get(auth1, async (req, res) => {
		try {
			const data = req.query
			const perPage = 20;
			const p = parseInt(req.query.page, 10);
			const page = p || 1;
			let view = false
			if (req.session.user.role === 10) {
				view = true
			}
			const filter = {};
			let numberCheck = isNaN(data?.name);
			if (data['name'] != '' && data.hasOwnProperty('name')) {
				const regex = new RegExp(data['name'], 'i');
				filter["name"] = regex;
			}
			if (data['name'] && !numberCheck) {
				filter["$or"] = [
					{ "name": { "$regex": data['name'], "$options": "i" } },
					{ "mobile": Number(data['mobile']) },
					{ "whatsapp": Number(data['whatsapp']) }
				];
			}

			const count = await AppliedCourses.countDocuments(filter)
			let { value, order } = req.query
			let sorting = {}
			if (value && order) {
				sorting[value] = Number(order)
			} else {
				sorting = { createdAt: -1 }
			}
			let agg = candidateServices.candidateCourseList(sorting, perPage, page, filter)
			let candidates = await AppliedCourses.aggregate(agg);
			const totalPages = Math.ceil(count / perPage);

			return res.render(`${req.vPath}/admin/course/registration`, {
				candidates,
				perPage,
				totalPages,
				page,
				count,
				data,
				menu: 'courseRegistrations',
				view,
				sortingValue: Object.keys(sorting),
				sortingOrder: Object.values(sorting),
			});
		} catch (err) {
			console.log(err)
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});


router.route("/assignCourses/:id")
	.put(async (req, res) => {
		try {
			const { id } = req.params;
			const { url, remarks, assignDate } = req.body;

			const updateFields = {
				courseStatus: 1
			};
			if (url) updateFields.url = url;
			if (remarks) updateFields.remarks = remarks;
			if (assignDate) updateFields.assignDate = assignDate;
			const updateCourse = await AppliedCourses.findByIdAndUpdate(id, { $set: updateFields }, { new: true });
			if (updateCourse) {
				return res.status(200).json({ status: true, data: updateCourse });
			} else {
				return res.json({ status: false, message: "Record not found!" });
			}
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});

router.post("/removetestimonial", isAdmin, async (req, res) => {
	const { courseId, key } = req.body;
	let course = await Courses.findById(courseId);
	if (!course) throw req.ykError("Company doesn't exist!");

	let gallery = course.testimonialvideos.filter((i) => i !== key);
	const courseUpdate = await Courses.findOneAndUpdate(
		{ _id: courseId },
		{ testimonialvideos: gallery }
	);
	if (!courseUpdate) throw req.ykError("Course not updated!");
	req.flash("success", "Course updated successfully!");
	res.send({ status: 200, message: "Course Updated Successfully" });
});
router.post("/removevideo", isAdmin, async (req, res) => {
	const { courseId, key } = req.body;
	let course = await Courses.findById(courseId);
	if (!course) throw req.ykError("Company doesn't exist!");

	let gallery = course.videos.filter((i) => i !== key);
	const courseUpdate = await Courses.findOneAndUpdate(
		{ _id: courseId },
		{ videos: gallery }
	);
	if (!courseUpdate) throw req.ykError("Course not updated!");
	req.flash("success", "Course updated successfully!");
	res.send({ status: 200, message: "Course Updated Successfully" });
});

router.post("/removebrochure", isAdmin, async (req, res) => {
	const { courseId, key } = req.body;
	let course = await Courses.findById(courseId);
	if (!course) throw req.ykError("Company doesn't exist!");

	const courseUpdate = await Courses.findOneAndUpdate(
		{ _id: courseId },
		{ brochure: '' }
	);
	if (!courseUpdate) throw req.ykError("Course not updated!");
	req.flash("success", "Course updated successfully!");
	res.send({ status: 200, message: "Course Updated Successfully" });
});

router.post("/removethumbnail", isAdmin, async (req, res) => {
	const { courseId, key } = req.body;
	let course = await Courses.findById(courseId);
	if (!course) throw req.ykError("course doesn't exist!");

	const courseUpdate = await Courses.findOneAndUpdate(
		{ _id: courseId },
		{ thumbnail: '' }
	);
	if (!courseUpdate) throw req.ykError("Course not updated!");
	req.flash("success", "Course updated successfully!");
	res.send({ status: 200, message: "Course Updated Successfully" });
});

router.post("/removephoto", isAdmin, async (req, res) => {
	const { courseId, key } = req.body;
	let course = await Courses.findById(courseId);
	if (!course) throw req.ykError("Course doesn't exist!");

	let gallery = course.photos.filter((i) => i !== key);
	const courseUpdate = await Courses.findOneAndUpdate(
		{ _id: courseId },
		{ photos: gallery }
	);
	if (!courseUpdate) throw req.ykError("Course not updated!");
	req.flash("success", "Course updated successfully!");
	res.send({ status: 200, message: "Course Updated Successfully" });
});

module.exports = router;
