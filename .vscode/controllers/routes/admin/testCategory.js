const express = require("express");
const { TestCategory } = require("../../models");
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
			const testName = "";
			const count = await TestCategory.countDocuments({});
			const testCats = await TestCategory.find({})
				.select("name status")
				.sort({ createdAt: -1 })
				.skip(perPage * page - perPage)
				.limit(perPage);
			const totalPages = Math.ceil(count / perPage);
			return res.render(`${req.vPath}/admin/testCategorySetting`, {
				testName,
				testCats,
				perPage,
				totalPages,
				page,
				menu:'testCategory',
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
			const testCat = await TestCategory.findOne({ name });

			if (testCat) throw req.ykError("Test category already exist!");
			TestCategory.create({ name });
			req.flash("success", "Test category added successfully!");
			return res.redirect("/admin/testCategory");
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
			const testData = await TestCategory.findById(req.params.id).select(
				"name"
			);
			const testName = testData.name ? testData.name : "";
			const count = await TestCategory.countDocuments({});
			const testCats = await TestCategory.find({})
				.select("name status")
				.sort({ createdAt: -1 })
				.skip(perPage * page - perPage)
				.limit(perPage);
			const totalPages = Math.ceil(count / perPage);
			return res.render(`${req.vPath}/admin/testCategorySetting`, {
				testCats,
				testName,
				perPage,
				totalPages,
				page,
				menu:'testCategory',
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
			const qual = await TestCategory.findOne({
				_id: { $ne: req.params.id },
				name,
			});
			if (qual) throw new Error("Test category already exist!");
			const pdata = await TestCategory.findByIdAndUpdate(
				req.params.id,
				{ name },
				{ new: true }
			);
			if (!pdata) req.ykError("Test category not update now!");
			req.flash("success", "Test category updated successfully!");
			return res.redirect("/admin/testCategory");
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});

module.exports = router;
