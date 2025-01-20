const express = require("express");
const { CourseSectors } = require("../../models");
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
			const secName = "";
			const secImage = "";
			const count = await CourseSectors.countDocuments({});
			const vacancys = await CourseSectors.find({})
				.select("name image status")
				.sort({ createdAt: -1 })
				.skip(perPage * page - perPage)
				.limit(perPage);
                console.log(vacancys, "vacancys")
			const totalPages = Math.ceil(count / perPage);
			return res.render(`${req.vPath}/admin/sectorSetting`, {
				secName,
				secImage,
				vacancys,
				perPage,
				totalPages,
				page,
				menu:'courseSectors',
				view
			});
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})
	.post(async (req, res) => {
		try {
			const { name , image} = req.body;
			const vacancy = await CourseSectors.findOne({ name });

			if (vacancy) throw req.ykError("Sector already exist!");
			CourseSectors.create({ name, image });
			req.flash("success", "Sector added successfully!");
            console.log(vacancy,"sector add dataaaaa")
			return res.redirect("/admin/courseSectors");
		} catch (err) {
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
			const vacData = await CourseSectors.findById(req.params.id).select(
				"name image"
			);
			const secName = vacData.name ? vacData.name : "";
			const secImage = vacData.image ? vacData.image : "";
			const count = await CourseSectors.countDocuments({});
			const vacancys = await CourseSectors.find({})
				.select("name image status")
				.sort({ createdAt: -1 })
				.skip(perPage * page - perPage)
				.limit(perPage);
			const totalPages = Math.ceil(count / perPage);
			return res.render(`${req.vPath}/admin/sectorSetting`, {
				vacancys,
				secName,
				secImage,
				perPage,
				totalPages,
				page,
				menu:'courseSectors',
				view
			});
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})
	.post(async (req, res) => {
		try {
			const { name, image } = req.body;
			const vac = await CourseSectors.findOne({
				_id: { $ne: req.params.id },
				name,
			});
			if (vac) throw new Error("Sector already exist!");
			const pdata = await CourseSectors.findByIdAndUpdate(
				req.params.id,
				{ name, image },
				{ new: true }
			);
			if (!pdata) req.ykError("Sector not update now!");
			req.flash("success", "Sector updated successfully!");
			return res.redirect("/admin/courseSectors");
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});

module.exports = router;
