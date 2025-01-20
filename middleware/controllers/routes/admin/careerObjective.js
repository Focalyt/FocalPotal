const express = require("express");
const { CareerObjective, Qualification, Skill } = require("../../models");
const { isAdmin } = require("../../../helpers");
const router = express.Router();
router.use(isAdmin);

router.route("/").get(async (req, res) => {
	try {
		const perPage = 5;
		const p = parseInt(req.query.page, 10);
		const page = p || 1;
		const count = await CareerObjective.countDocuments({});
		const careerObjs = await CareerObjective.find({})
			.select({ createdAt: false, updatedAt: false })
			.sort({ createdAt: -1 })
			.skip(perPage * page - perPage)
			.limit(perPage);
		const totalPages = Math.ceil(count / perPage);
		return res.render(`${req.vPath}/admin/careerObjective`, {
			totalPages,
			page,
			careerObjs,
		});
	} catch (err) {
		req.flash("error", err.message || "Something went wrong!");
		return res.redirect("back");
	}
});

router
	.route("/add")
	.get(async (req, res) => {
		try {
			const qualification = await Qualification.aggregate([
				{
					$match: {
						status: true,
					},
				},
				{
					$lookup: {
						from: "subqualifications",
						localField: "_id",
						foreignField: "_qualification",
						as: "qual",
					},
				},
				{ $unwind: { path: "$qual", preserveNullAndEmptyArrays: true } },
				{
					$project: {
						status: false,
						createdAt: false,
						updatedAt: false,
						__v: false,
						"qual.status": false,
						"qual.createdAt": false,
						"qual.updatedAt": false,
						"qual._qualification": false,
						"qual.__v": false,
					},
				},
			]);
			const skill = await Skill.find({ status: true });
			const techSkill = skill.filter((x) => x.type === "technical");
			const nonTechSkill = skill.filter((x) => x.type === "non technical");
			return res.render(`${req.vPath}/admin/careerObjective/add`, {
				qualification,
				techSkill,
				nonTechSkill,
			});
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})
	.post(async (req, res) => {
		try {
			const career = await CareerObjective.create(req.body);
			if (!career) throw req.ykError("Career objective not created!");
			req.flash("success", "Career objective added successfully!");
			return res.redirect("/admin/careerObjective");
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});

router
	.route("/edit/:id")
	.get(async (req, res) => {
		try {
			const career = await CareerObjective.findById(req.params.id).select({
				createdAt: false,
				updateAt: false,
			});
			const qualification = await Qualification.aggregate([
				{
					$match: {
						status: true,
					},
				},
				{
					$lookup: {
						from: "subqualifications",
						localField: "_id",
						foreignField: "_qualification",
						as: "qual",
					},
				},
				{ $unwind: { path: "$qual", preserveNullAndEmptyArrays: true } },
				{
					$project: {
						status: false,
						createdAt: false,
						updatedAt: false,
						__v: false,
						"qual.status": false,
						"qual.createdAt": false,
						"qual.updatedAt": false,
						"qual._qualification": false,
						"qual.__v": false,
					},
				},
			]);
			const skill = await Skill.find({ status: true });
			const techSkill = skill.filter((x) => x.type === "technical");
			const nonTechSkill = skill.filter((x) => x.type === "non technical");
			return res.render(`${req.vPath}/admin/careerObjective/edit`, {
				career,
				qualification,
				techSkill,
				nonTechSkill,
			});
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})
	.post(async (req, res) => {
		try {
			const { id } = req.params;
			const { name } = req.body;
			const qual = await CareerObjective.findOne({
				_id: { $ne: req.params.id },
				name,
			});
			if (qual) throw new Error("Career objective already exist!");
			const pdata = await CareerObjective.findByIdAndUpdate(
				id,
				{ ...req.body },
				{ new: true }
			);
			if (!pdata) throw req.ykError("Career objective not update now!");
			req.flash("success", "Career objective updated successfully!");
			return res.redirect("/admin/careerObjective");
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});

module.exports = router;
