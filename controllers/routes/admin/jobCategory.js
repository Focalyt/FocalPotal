const express = require("express");
const { JobCategory } = require("../../models");
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
			const jobCatName = "";
			const jobCatImage = "";
			const count = await JobCategory.countDocuments({});
			const jobCats = await JobCategory.find({})
				.select("name image status")
				.sort({ createdAt: -1 })
				.skip(perPage * page - perPage)
				.limit(perPage);
			const totalPages = Math.ceil(count / perPage);
			return res.render(`${req.vPath}/admin/jobCategorySetting`, {
				jobCatName,
				jobCatImage,
				jobCats,
				perPage,
				totalPages,
				page,
				menu:'jobCategory',
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
			const jobCat = await JobCategory.findOne({ name });

			if (jobCat) throw req.ykError("Job category already exist!");
			JobCategory.create({ name, image });
			req.flash("success", "Job category added successfully!");
			return res.redirect("/admin/jobCategory");
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
			const indData = await JobCategory.findById(req.params.id).select(
				"name image"
			);

			const jobCatName = indData.name ? indData.name : "";
			const jobCatImage = indData.image ? indData.image : "";
			const count = await JobCategory.countDocuments({});
			const jobCats = await JobCategory.find({})
				.select("name image status")
				.sort({ createdAt: -1 })
				.skip(perPage * page - perPage)
				.limit(perPage);
			const totalPages = Math.ceil(count / perPage);
			return res.render(`${req.vPath}/admin/jobCategorySetting`, {
				jobCats,
				jobCatName,
				jobCatImage,
				perPage,
				totalPages,
				page,
				menu:'jobCategory',
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
			const jobCat = await JobCategory.findOne({
				_id: { $ne: req.params.id },
				name,
			});
			if (jobCat) throw new Error("Job category already exist!");
			const pdata = await JobCategory.findByIdAndUpdate(
				req.params.id,
				{ name, image },
				{ new: true }
			);
			if (!pdata) req.ykError("Job category not update now!");
			req.flash("success", "Job category updated successfully!");
			return res.redirect("/admin/jobCategory");
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});

module.exports = router;
