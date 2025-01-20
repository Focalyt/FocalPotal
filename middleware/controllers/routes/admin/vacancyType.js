const express = require("express");
const { VacancyType } = require("../../models");
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
			const vacName = "";
			const count = await VacancyType.countDocuments({});
			const vacancys = await VacancyType.find({})
				.select("name status")
				.sort({ createdAt: -1 })
				.skip(perPage * page - perPage)
				.limit(perPage);
			const totalPages = Math.ceil(count / perPage);
			return res.render(`${req.vPath}/admin/vacancySetting`, {
				vacName,
				vacancys,
				perPage,
				totalPages,
				page,
				menu:'vacancyType',
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
			const vacancy = await VacancyType.findOne({ name });

			if (vacancy) throw req.ykError("Vacancy already exist!");
			VacancyType.create({ name });
			req.flash("success", "Vacancy added successfully!");
			return res.redirect("/admin/vacancyType");
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
			const vacData = await VacancyType.findById(req.params.id).select(
				"name"
			);
			const vacName = vacData.name ? vacData.name : "";
			const count = await VacancyType.countDocuments({});
			const vacancys = await VacancyType.find({})
				.select("name status")
				.sort({ createdAt: -1 })
				.skip(perPage * page - perPage)
				.limit(perPage);
			const totalPages = Math.ceil(count / perPage);
			return res.render(`${req.vPath}/admin/vacancySetting`, {
				vacancys,
				vacName,
				perPage,
				totalPages,
				page,
				menu:'vacancyType',
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
			const vac = await VacancyType.findOne({
				_id: { $ne: req.params.id },
				name,
			});
			if (vac) throw new Error("Vacancy already exist!");
			const pdata = await VacancyType.findByIdAndUpdate(
				req.params.id,
				{ name },
				{ new: true }
			);
			if (!pdata) req.ykError("Vacancy not update now!");
			req.flash("success", "Vacancy updated successfully!");
			return res.redirect("/admin/vacancyType");
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});

module.exports = router;
