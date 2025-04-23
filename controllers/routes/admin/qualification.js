const express = require("express");
const { Qualification, QualificationCourse, SubQualification } = require("../../models");
const { isAdmin } = require("../../../helpers");
const qualificationCourse = require("../../models/qualificationCourse");
const router = express.Router();
router.use(isAdmin);

router
	.route("/")
	.get(async (req, res) => {
		try {
			let view = false
			if (req.session.user.role === 10) {
				view = true
			}
			const perPage = 5;
			const p = parseInt(req.query.page, 10);
			const page = p || 1;
			const quaName = "";
			const count = await Qualification.countDocuments({});
			const qualifications = await Qualification.find({})
				.select("name status basic")
				.sort({ createdAt: -1 })
				.skip(perPage * page - perPage)
				.limit(perPage);

			const qual = await Qualification.find({})
				.select("name status basic")
				.sort({ createdAt: -1 })
				.skip(perPage * page - perPage)
				.limit(perPage);

			const totalPages = Math.ceil(count / perPage);
			return res.render(`${req.vPath}/admin/qualificationSetting/qualification`, {
				quaName,
				qualifications,
				qual,
				perPage,
				totalPages,
				page,
				menu: 'qualification',
				view
			});
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})
	.post(async (req, res) => {
		try {
			if (req.body.id) {
				const qual = await Qualification.findOne({ _id: req.body.id, status: true });
				if (qual) throw req.ykError("Course already exist!");

				await Qualification.findOneAndUpdate({ _id: req.body.id }, {
					status: true
				});

				req.flash("success", "Course added successfully!");
				return res.redirect("/admin/qualification");
			} else {
				const qual = await Qualification.findOne({ name: req.body.name });
				if (qual) throw req.ykError("Course already exist!");
				const qualification = await Qualification.create({ name: req.body.name, status: true })
				if (!qualification) {
					throw req.ykError("qualification not created!");
				}
				req.flash("success", "Course added successfully!");
				return res.redirect("/admin/qualification");
			}
		} catch (err) {
			console.log('==> err ', err)
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});

router
	.route("/edit/:id")
	.get(async (req, res) => {
		try {
			let view = false
			if (req.session.user.role === 10) {
				view = true
			}
			const perPage = 5;
			const p = parseInt(req.query.page, 10);
			const page = p || 1;
			const qualifications = await Qualification.find({ status: true });
			const qualData = await Qualification.findById(req.params.id).select(
				"name"
			);
			const quaName = qualData.name ? qualData.name : "";
			const count = await Qualification.countDocuments({});
			const qual = await Qualification.find({})
				.select("name status basic")
				.sort({ createdAt: -1 })
				.skip(perPage * page - perPage)
				.limit(perPage);
			const totalPages = Math.ceil(count / perPage);
			return res.render(`${req.vPath}/admin/qualificationSetting/qualification`, {
				qualifications,
				quaName,
				perPage,
				qual,
				totalPages,
				page,
				menu: 'qualification',
				view
			});
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})
	.post(async (req, res) => {
		try {
			const { name } = req.body;
			const qual = await Qualification.findOne({
				_id: { $ne: req.params.id },
				name,
			});
			if (qual) throw new Error("Course already exist!");
			const pdata = await Qualification.findByIdAndUpdate(
				req.params.id,
				{ name },
				{ new: true }
			);
			if (!pdata) req.ykError("Course not update now!");
			req.flash("success", "Course updated successfully!");
			return res.redirect("/admin/qualification");
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});
router
	.route("/addCourse")
	.get(async (req, res) => {
		try {
			let view = false
			if (req.session.user.role === 10) {
				view = true
			}
			const perPage = 5;
			const p = parseInt(req.query.page, 10);
			const page = p || 1;

			const qualifications = await Qualification.find({
				status: true,
			}).select("name");
			const course = await QualificationCourse.find().populate("_qualification")
				.sort({ createdAt: -1 });
			const coursedata = ""

			const count = await QualificationCourse.countDocuments({ status: true });
			const totalPages = Math.ceil(count / perPage);

			return res.render(`${req.vPath}/admin/qualificationSetting/course`, {
				menu: 'addedu',
				qualifications,
				course,
				coursedata,
				view,
				totalPages,
				perPage,
				page 
				
			});

		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}

	})
	.post(async (req, res) => {
		try {
			const { _qualification, name } = req.body;
			const body = {
				_qualification, name
			}
			console.log("body", body)
			// Check if the name already exists
			const existing = await QualificationCourse.findOne({ name: name.trim() });
			if (existing) {
				req.flash('error', 'This Course already exists.');
				return res.redirect('back');
			}

			const addRecord = await QualificationCourse.create(body);


			// res.json({ status: true, message: "Record added!" });
			req.flash('success', 'Record added!');
			return res.redirect("back");

		} catch (err) {
			console.log(err)
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");

		}

	})

router
	.route("/editCourse/:id")
	.get(async (req, res) => {
		try {
			let view = false
			if (req.session.user.role === 10) {
				view = true
			}
			
			const qualifications = await Qualification.find({
				status: true,
			}).select("name");
			const populate = [{ path: "_qualification", select: "name" }]
			const coursedata = await QualificationCourse.findById(req.params.id)
				.populate(populate)
			

				const course = await QualificationCourse.find().populate("_qualification")
				.sort({ createdAt: -1 });
			

			

			return res.render(`${req.vPath}/admin/qualificationSetting/course`, {
				menu: 'addedu',
				qualifications,
				course,
				coursedata,
				view
			});

		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}

	})
	.post(async (req,res) =>{

		try{
			const { name, _qualification } = req.body;
			if (!name && !_qualification) {
				throw req.ykError("Filleds are missing!");
			}
			const course = await QualificationCourse.findOneAndUpdate({ _id: req.params.id }, {
				name, _qualification

			});


			req.flash("success", "Course updated successfully!");
			return res.redirect("/admin/qualification/addCourse");

		}
		catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})

router
	.route("/course/addstream")
	.get(async (req, res) => {
		try {
			let view = false
			if (req.session.user.role === 10) {
				view = true
			}
			const perPage = 5;
			const p = parseInt(req.query.page, 10);
			const page = p || 1;
			const subName = "";
			const subQua = "";
			const qualifications = await Qualification.find({
				status: true,
			}).select("name");
			const populate = [{ path: "_qualification", select: "name" },
			{ path: "_course", select: "name" }
			];
			const count = await SubQualification.countDocuments({ status: true });
			const subQual = await SubQualification.find()
				.populate(populate)
				.select("name status")
				.sort({ createdAt: -1 })
				.skip(perPage * page - perPage)
				.limit(perPage);
			const qualificationCourses = await QualificationCourse.find({}).populate("_qualification");
			console.log('qualificationCourses', qualificationCourses)

			const totalPages = Math.ceil(count / perPage);
			return res.render(`${req.vPath}/admin/qualificationSetting/stream`, {
				subName,
				subQua,
				subQual,
				perPage,
				totalPages,
				page,
				qualifications,
				qualificationCourses,
				menu: 'subQualification',
				view
			});
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})
	.post(async (req, res) => {
		try {
			if (req.body.subQuali) {
				const subQ = await SubQualification.findOne({ _id: req.body.subQuali, status: true });
				if (subQ) throw req.ykError("Stream already exist!");
				await SubQualification.findOneAndUpdate({ _id: req.body.subQuali }, {
					status: true
				});
				req.flash("success", "Stream added successfully!");
				return res.redirect("/admin/qualification/course/addstream");
			} else {
				const { name, _qualification, _course } = req.body;
				const subQ = await SubQualification.findOne({
					name: req.body.name,
					_qualification: req.body._qualification,
					_course: req.body._course,
				  });
				  
				if (subQ) throw req.ykError("Stream already exist!");
				const sub = await SubQualification.create({ name, _qualification, _course });
				if (!sub) {
					throw req.ykError("SubQualification not created!");
				}
				req.flash("success", "Stream added successfully!");
				return res.redirect("/admin/qualification/course/addstream");
			}
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});

router
	.route("/course/editstream/:id")
	.get(async (req, res) => {

		try {
			console.log('api hitting')
			let view = false
			if (req.session.user.role === 10) {
				view = true
			}
			const perPage = 5;
			const p = parseInt(req.query.page, 10);
			const page = p || 1;
			const subName = "";



			const qualifications = await Qualification.find({
				status: true,
			}).select("name");
			const populate = [{ path: "_qualification", select: "name" },
			{ path: "_course", select: "name" }
			];
			const subQua = await SubQualification.findById(
				req.params.id
			)
				.populate(populate);
			console.log('subQua', subQua)
			const count = await SubQualification.countDocuments({ status: true });
			const subQual = await SubQualification.find({ status: true })
				.populate(populate)
				.select("name status")
				.sort({ createdAt: -1 })
				.skip(perPage * page - perPage)
				.limit(perPage);

			const qualificationCourses = await QualificationCourse.find({}).populate("_qualification");


			const totalPages = Math.ceil(count / perPage);
			return res.render(`${req.vPath}/admin/qualificationSetting/stream`, {
				subName,
				subQua,
				subQual,
				perPage,
				totalPages,
				page,
				qualifications,
				qualificationCourses,
				menu: 'subQualification',
				view
			});
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})
	.post(async (req, res) => {
		try {

			const { name, _qualification, _course } = req.body;
			if (!name && !_qualification && !_course) {
				throw req.ykError("Filleds are missing!");
			}
			const subQ = await SubQualification.findOneAndUpdate({ _id: req.params.id }, {
				name, _qualification, _course

			});


			req.flash("success", "Stream updated successfully!");
			return res.redirect("/admin/qualification/course/addstream");

		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});
module.exports = router;
