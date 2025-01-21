const express = require("express");
const { Qualification } = require("../../models");
const { isAdmin } = require("../../../helpers");
const router = express.Router();
router.use(isAdmin);

router
	.route("/")
	.get(async (req, res) => {
		try {
			let view = false
		if(req.session.user.role === 10){
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
			return res.render(`${req.vPath}/admin/qualificationSetting`, {
				quaName,
				qualifications,
				qual,
				perPage,
				totalPages,
				page,
				menu:'qualification',
				view
			});
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})
	.post(async (req, res) => {
		try {
			if(req.body.id){
				const 	qual = await Qualification.findOne({ _id:req.body.id, status:true});
			if (qual) throw req.ykError("Course already exist!");

			await Qualification.findOneAndUpdate({_id:req.body.id}, { 
				status:true 
			});

			req.flash("success", "Course added successfully!");
			return res.redirect("/admin/qualification");
			}else{
				const 	qual = await Qualification.findOne({name:req.body.name});
				if (qual) throw req.ykError("Course already exist!");
				const qualification = await Qualification.create({ name:req.body.name ,status:true})
				if (!qualification){
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
		if(req.session.user.role === 10){
			view = true
		}
			const perPage = 5;
			const p = parseInt(req.query.page, 10);
			const page = p || 1;
			const qualifications = await Qualification.find({status:true});
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
			return res.render(`${req.vPath}/admin/qualificationSetting`, {
				qualifications,
				quaName,
				perPage,
				qual,
				totalPages,
				page,
				menu:'qualification',
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

module.exports = router;
