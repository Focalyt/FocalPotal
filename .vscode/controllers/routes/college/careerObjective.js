const express = require("express");
const {
	CareerObjective,
	Qualification,
	Skill,
	College,
} = require("../../models");
const { auth1 } = require("../../../helpers");
const router = express.Router();
// router.use(isAdmin);

router.route("/").get(auth1, async (req, res) => {
	try {
		// for archieve data
		if (req.query.isDeleted == undefined) {
			var isDeleted = false;
			var isChecked = "false";
		} else if (req.query.isDeleted.toString() == "true") {
			var isDeleted = req.query.isDeleted;
			var isChecked = "true";
		} else if (req.query.isDeleted.toString() == "false") {
			var isDeleted = false;
			var isChecked = "false";
		}
		const perPage = 5;
		const p = parseInt(req.query.page, 10);
		const page = p || 1;
		const count = await CareerObjective.countDocuments({
			_college: req.session.college._id,
			isDeleted: isDeleted,
		});
		const careerObjs = await CareerObjective.find({
			_college: req.session.college._id,
			isDeleted: isDeleted,
		})
			.select({ createdAt: false, updatedAt: false })
			.sort({ createdAt: -1 })
			.skip(perPage * page - perPage)
			.limit(perPage);
		const totalPages = Math.ceil(count / perPage);
		return res.render(`${req.vPath}/college/careerObjective`, {
			totalPages,
			page,
			careerObjs,
			isChecked,
		});
	} catch (err) {
		req.flash("error", err.message || "Something went wrong!");
		return res.redirect("back");
	}
});

router
	.route("/add")
	.get(auth1, async (req, res) => {
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
			return res.render(`${req.vPath}/college/careerObjective/add`, {
				qualification,
				techSkill,
				nonTechSkill,
			});
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})
	.post(auth1, async (req, res) => {
		try {
			const collegedetail = await College.findOne({
				_concernPerson: req.session.user._id,
			});
			const career = await CareerObjective.create({
				...req.body,
				_concernPerson: collegedetail._concernPerson,
				_college: collegedetail._id,
			});

			if (!career) throw req.ykError("Career objective not created!");
			req.flash("success", "Career objective added successfully!");
			return res.redirect("/panel/college/careerObjective");
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});

router
	.route("/edit/:id")
	.get(auth1, async (req, res) => {
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
			return res.render(`${req.vPath}/college/careerObjective/edit`, {
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
	.post(auth1, async (req, res) => {
		try {
			const { id } = req.params;
			const { name } = req.body;
			const qual = await CareerObjective.findOne({
				_id: { $ne: req.params.id },
				name,
			});
			// if (qual) throw new Error('Career objective already exist!');
			const pdata = await CareerObjective.findByIdAndUpdate(
				id,
				{ ...req.body },
				{ new: true }
			);
			if (!pdata) throw req.ykError("Career objective not update now!");
			req.flash("success", "Career objective updated successfully!");
			return res.redirect("/panel/college/careerObjective");
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});

module.exports = router;
