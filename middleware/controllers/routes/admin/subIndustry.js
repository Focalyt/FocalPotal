const express = require("express");
const { Industry, SubIndustry } = require("../../models");
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
			const subName = "";
			const subInd = "";
			const industry = await Industry.find({ status: true }).select("name");
			const populate = { path: "_industry", select: "name" };
			const count = await SubIndustry.countDocuments({});
			const subIndustry = await SubIndustry.find({})
				.populate(populate)
				.select("name status")
				.sort({ createdAt: -1 })
				.skip(perPage * page - perPage)
				.limit(perPage);
			const totalPages = Math.ceil(count / perPage);
			return res.render(`${req.vPath}/admin/subIndustrySetting`, {
				subName,
				subInd,
				subIndustry,
				perPage,
				totalPages,
				page,
				industry,
				menu:'subIndustry',
				view
			});
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})
	.post(async (req, res) => {
		try {
			const { name, _industry } = req.body;
			const subIndustry = await SubIndustry.findOne({ name });

			if (subIndustry) throw req.ykError("Sub industry already exist!");
			await SubIndustry.create({ name, _industry });
			req.flash("success", "SubIndustry added successfully!");
			return res.redirect("/admin/subIndustry");
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
			const subData = await SubIndustry.findById(req.params.id).select(
				"name _industry"
			);
			const industry = await Industry.find({ status: true }).select("name");
			const subName = subData.name ? subData.name : "";
			const subInd = subData._industry ? subData._industry : "";
			const count = await SubIndustry.countDocuments({});
			const populate = { path: "_industry", select: "name" };
			const subIndustry = await SubIndustry.find({})
				.populate(populate)
				.select("name _industry status")
				.sort({ createdAt: -1 })
				.skip(perPage * page - perPage)
				.limit(perPage);
			const totalPages = Math.ceil(count / perPage);
			return res.render(`${req.vPath}/admin/subIndustrySetting`, {
				subIndustry,
				subName,
				industry,
				subInd,
				perPage,
				totalPages,
				page,
				menu:'subIndustry',
				view
			});
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})
	.post(async (req, res) => {
		try {
			const { name, _industry } = req.body;
			const subIndustry = await SubIndustry.findOne({
				_id: { $ne: req.params.id },
				name,
			});
			if (subIndustry) throw new Error("Sub industry already exist!");
			const pdata = await SubIndustry.findByIdAndUpdate(
				req.params.id,
				{ name, _industry },
				{ new: true }
			);
			if (!pdata) req.ykError("Sub industry not update now!");
			req.flash("success", "Sub industry updated successfully!");
			return res.redirect("/admin/subIndustry");
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});

module.exports = router;
