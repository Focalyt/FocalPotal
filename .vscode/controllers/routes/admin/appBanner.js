const express = require("express");
const { AppBanner, Qualification, Country, State } = require("../../models");
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
			const banner = "";
			const _qual = [];
			const country = "";
			const state = "";
			const applicable = "";
			const count = await AppBanner.countDocuments({});
			const appBanners = await AppBanner.find({})
				.select({ createdAt: false, updatedAt: false })
				.sort({ createdAt: -1 })
				.skip(perPage * page - perPage)
				.limit(perPage);
			const totalPages = Math.ceil(count / perPage);
			const qualification = await Qualification.find({ status: true });
			const countryData = await Country.find({});
			const stateData = await State.find({});
			return res.render(`${req.vPath}/admin/appBanner`, {
				banner,
				_qual,
				country,
				state,
				applicable,
				totalPages,
				page,
				appBanners,
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
			AppBanner.create(req.body);
			req.flash("success", "App banner added successfully!");
			return res.redirect("/admin/appBanner");
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
			const bannerData = await AppBanner.findById(req.params.id).select({
				createdAt: false,
				updateAt: false,
			});
			const banner = bannerData.banner ? bannerData.banner : "";
			const _qual =
				bannerData._qualification && bannerData._qualification.length > 0
					? bannerData._qualification
					: [];
			const country = bannerData.countryId ? bannerData.countryId : "";
			const state = bannerData.stateId ? bannerData.stateId : "";
			const applicable = bannerData.applicableFor
				? bannerData.applicableFor
				: "";
			const count = await AppBanner.countDocuments({});
			const appBanners = await AppBanner.find({})
				.select({ createdAt: false, updatedAt: false })
				.sort({ createdAt: -1 })
				.skip(perPage * page - perPage)
				.limit(perPage);
			const totalPages = Math.ceil(count / perPage);
			const qualification = await Qualification.find({ status: true });
			const countryData = await Country.find({});
			const stateData = await State.find({});
			return res.render(`${req.vPath}/admin/appBanner`, {
				banner,
				_qual,
				country,
				state,
				applicable,
				totalPages,
				page,
				appBanners,
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
			const pdata = await AppBanner.findByIdAndUpdate(
				id,
				{ ...req.body },
				{ new: true }
			);
			if (!pdata) req.ykError("App banner not update now!");
			req.flash("success", "App banner updated successfully!");
			return res.redirect("/admin/appBanner");
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});

module.exports = router;
