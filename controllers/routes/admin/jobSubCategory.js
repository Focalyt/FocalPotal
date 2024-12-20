const express = require("express");
const { JobCategory, JobSubCategory } = require("../../models");
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
			const jobSubName = "";
			const jobSubJC = "";
			const jobCat = await JobCategory.find({ status: true }).select("name");
			const populate = { path: "_jobCategory", select: "name" };
			const count = await JobSubCategory.countDocuments({});
			const jobSubCats = await JobSubCategory.find({})
				.populate(populate)
				.select("name status")
				.sort({ createdAt: -1 })
				.skip(perPage * page - perPage)
				.limit(perPage);
			const totalPages = Math.ceil(count / perPage);
			return res.render(`${req.vPath}/admin/jobSubCategorySetting`, {
				jobSubName,
				jobSubJC,
				jobSubCats,
				perPage,
				totalPages,
				page,
				jobCat,
				menu:'jobSubCategory',
				view
			});
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})
	.post(async (req, res) => {
		try {
			const { name, _jobCategory } = req.body;
			const jobSub = await JobSubCategory.findOne({ name });

			if (jobSub) throw req.ykError("Job sub category already exist!");
			JobSubCategory.create({ name, _jobCategory });
			req.flash("success", "Job sub category added successfully!");
			return res.redirect("/admin/jobSubCategory");
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
			const subData = await JobSubCategory.findById(req.params.id).select(
				"name _jobCategory"
			);
			const jobCat = await JobCategory.find({ status: true }).select("name");
			const jobSubName = subData.name ? subData.name : "";
			const jobSubJC = subData._jobCategory ? subData._jobCategory : "";
			const count = await JobSubCategory.countDocuments({});
			const populate = { path: "_jobCategory", select: "name" };
			const jobSubCats = await JobSubCategory.find({})
				.populate(populate)
				.select("name _jobCategory status")
				.sort({ createdAt: -1 })
				.skip(perPage * page - perPage)
				.limit(perPage);
			const totalPages = Math.ceil(count / perPage);
			return res.render(`${req.vPath}/admin/jobSubCategorySetting`, {
				jobSubCats,
				jobSubName,
				jobCat,
				jobSubJC,
				perPage,
				totalPages,
				page,
				menu:'jobSubCategory',
				view
			});
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})
	.post(async (req, res) => {
		try {
			const { name, _jobCategory } = req.body;
			const subJobCat = await JobSubCategory.findOne({
				_id: { $ne: req.params.id },
				name,
			});
			if (subJobCat) throw new Error("Job sub category already exist!");
			const pdata = await JobSubCategory.findByIdAndUpdate(
				req.params.id,
				{ name, _jobCategory },
				{ new: true }
			);
			if (!pdata) req.ykError("Job sub category not update now!");
			req.flash("success", "Job sub category updated successfully!");
			return res.redirect("/admin/jobSubCategory");
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});

module.exports = router;
