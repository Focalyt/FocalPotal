const express = require("express");
const {
	MockInterview,
	MockQuestion,
	Qualification,
	Skill,
	Industry,
} = require("../../models");

const { isAdmin } = require("../../../helpers");
const router = express.Router();
router.use(isAdmin);

router.route("/").get(async (req, res) => {
	try {
		const mockInterview = [];
		const perPage = 5;
		const p = parseInt(req.query.page, 10);
		const page = p || 1;
		const count = await MockInterview.countDocuments({});
		const mocks = await MockInterview.find({})
			.select("name _category _industry _skill _streams status")
			.sort({ createdAt: -1 })
			.skip(perPage * page - perPage)
			.limit(perPage);

		const promises = mocks.map(async (e) => {
			const questions = await MockQuestion.countDocuments({
				status: true,
				_mockInterview: e._id,
			});
			const obj = {
				_id: e._id,
				name: e.name,
				category: e._category,
				noOfInd: (e._industry && e._industry.length) || 0,
				skills: (e._skill && e._skill.length) || 0,
				streams: (e._streams && e._streams.length) || 0,
				questions,
				status: e.status,
			};
			mockInterview.push(obj);
		});
		await Promise.all(promises);

		const totalPages = Math.ceil(count / perPage);
		return res.render(`${req.vPath}/admin/mockInterview`, {
			mockInterview,
			perPage,
			totalPages,
			page,
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
			const industry = await Industry.find({ status: true });
			const qualification = await Qualification.find({ status: true });
			const skill = await Skill.find({ status: true });
			const techSkill = skill.filter((x) => x.type === "technical");
			const nonTechSkill = skill.filter((x) => x.type === "non technical");
			return res.render(`${req.vPath}/admin/mockInterview/add`, {
				industry,
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
			const { questionNo, description, comments } = req.body;
			const mocks = await MockInterview.create(req.body);
			if (!mocks) throw req.ykError("Mock Interview not create!");
			if (questionNo && questionNo.length > 0) {
				questionNo.forEach(async (s, i) => {
					if (s) {
						const objs = {
							_mockInterview: mocks._id,
							question: s,
							comments: comments[i],
							description: description[i],
						};
						const question = await MockQuestion.create(objs);
						if (!question)
							throw req.ykError("Mock Interview not create!");
					}
				});
			}
			req.flash("success", "Mock Interview added successfully!");
			return res.redirect("/admin/mockInterview");
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});

module.exports = router;
