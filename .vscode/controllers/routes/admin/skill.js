const express = require("express");
const { Skill } = require("../../models");
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
			const skillName = "";
			const skillType = "";
			const count = await Skill.countDocuments({});
			const skills = await Skill.find({})
				.select("name type status")
				.sort({ createdAt: -1 })
				.skip(perPage * page - perPage)
				.limit(perPage);
			const totalPages = Math.ceil(count / perPage);
			return res.render(`${req.vPath}/admin/skillSetting`, {
				skillName,
				skillType,
				skills,
				perPage,
				totalPages,
				page,
				menu:'skill',
				view
			});
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})
	.post(async (req, res) => {
		try {
			const { name, type } = req.body;
			const skill = await Skill.findOne({ name, type });

			if (skill) throw req.ykError("Skill already exist!");
			Skill.create({ name, type });
			req.flash("success", "Skill added successfully!");
			return res.redirect("/admin/skill");
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
			const skillData = await Skill.findById(req.params.id).select(
				"name type"
			);
			const skillName = skillData.name ? skillData.name : "";
			const skillType = skillData.type ? skillData.type : "";
			const count = await Skill.countDocuments({});
			const skills = await Skill.find({})
				.select("name type status")
				.sort({ createdAt: -1 })
				.skip(perPage * page - perPage)
				.limit(perPage);
			const totalPages = Math.ceil(count / perPage);
			return res.render(`${req.vPath}/admin/skillSetting`, {
				skills,
				skillName,
				skillType,
				perPage,
				totalPages,
				page,
				menu:'skill',
				view
			});
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})
	.post(async (req, res) => {
		try {
			const { name, type } = req.body;
			const qual = await Skill.findOne({
				_id: { $ne: req.params.id },
				name,
				type,
			});
			if (qual) throw new Error("Skill already exist!");
			const pdata = await Skill.findByIdAndUpdate(
				req.params.id,
				{ name, type },
				{ new: true }
			);
			if (!pdata) req.ykError("Skill not update now!");
			req.flash("success", "Skill updated successfully!");
			return res.redirect("/admin/skill");
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});

module.exports = router;
