const express = require("express");
const { AppUpdate, Qualification, Country, State } = require("../../models");
const { isAdmin } = require("../../../helpers");
const router = express.Router();
router.use(isAdmin);

router
	.route("/")
	.get(async (req, res) => {
		try {
			const perPage = 5;
			const p = parseInt(req.query.page, 10);
			const page = p || 1;
			const title = "";
			const date = "";
			const _qual = [];
			const country = "";
			const state = "";
			const image = "";
			const deeplinking = [];
			const message = "";
			const expStart = "";
			const expEnd = "";
			const count = await AppUpdate.countDocuments({});
			const appUpdates = await AppUpdate.find({})
				.select({ createdAt: false, updatedAt: false })
				.sort({ createdAt: -1 })
				.skip(perPage * page - perPage)
				.limit(perPage);
			const totalPages = Math.ceil(count / perPage);
			const qualification = await Qualification.find({ status: true });
			const countryData = await Country.find({});
			const stateData = await State.find({});
			return res.render(`${req.vPath}/admin/appUpdate`, {
				title,
				_qual,
				date,
				country,
				deeplinking,
				state,
				image,
				message,
				expStart,
				expEnd,
				totalPages,
				page,
				appUpdates,
				qualification,
				countryData,
				stateData,
			});
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})
	.post(async (req, res) => {
		try {
			AppUpdate.create(req.body);
			req.flash("success", "App update added successfully!");
			return res.redirect("/admin/appUpdate");
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});

router
	.route("/edit/:id")
	.get(async (req, res) => {
		try {
			const perPage = 5;
			const p = parseInt(req.query.page, 10);
			const page = p || 1;
			const updateData = await AppUpdate.findById(req.params.id).select({
				createdAt: false,
				updateAt: false,
			});
			const title = updateData.title ? updateData.title : "";
			const image = updateData.image ? updateData.image : "";
			const date = updateData.date ? updateData.date : "";
			const _qual =
				updateData._qualification && updateData._qualification.length > 0
					? updateData._qualification
					: [];
			const country = updateData.countryId ? updateData.countryId : "";
			const state = updateData.stateId ? updateData.stateId : "";
			const deeplinking = updateData.deeplinking
				? updateData.deeplinking
				: "";
			const message = updateData.message ? updateData.message : "";
			const expStart = updateData.expStart ? updateData.expStart : "";
			const expEnd = updateData.expEnd ? updateData.expEnd : "";

			const count = await AppUpdate.countDocuments({});
			const appUpdates = await AppUpdate.find({})
				.select({ createdAt: false, updatedAt: false })
				.sort({ createdAt: -1 })
				.skip(perPage * page - perPage)
				.limit(perPage);
			const totalPages = Math.ceil(count / perPage);
			const qualification = await Qualification.find({ status: true });
			const countryData = await Country.find({});
			const stateData = await State.find({});
			return res.render(`${req.vPath}/admin/appUpdate`, {
				title,
				_qual,
				date,
				country,
				deeplinking,
				state,
				image,
				message,
				expStart,
				expEnd,
				totalPages,
				page,
				appUpdates,
				qualification,
				countryData,
				stateData,
			});
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})
	.post(async (req, res) => {
		try {
			const { id } = req.params;
			const { title } = req.body;
			const qual = await AppUpdate.findOne({
				_id: { $ne: req.params.id },
				title,
			});
			if (qual) throw new Error("App update already exist!");
			const pdata = await AppUpdate.findByIdAndUpdate(
				id,
				{ ...req.body },
				{ new: true }
			);
			if (!pdata) req.ykError("App update not update now!");
			req.flash("success", "App update updated successfully!");
			return res.redirect("/admin/appUpdate");
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});

module.exports = router;
