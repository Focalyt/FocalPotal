const express = require("express");
const {
	SkillTest,
	SkillTestQuestion,
	Qualification,
	Skill,
	Industry,
} = require("../../models");

const { isAdmin } = require("../../../helpers");
const router = express.Router();
router.use(isAdmin);

router.route("/").get(async (req, res) => {
	try {
		const skillTest = [];
		const perPage = 5;
		const p = parseInt(req.query.page, 10);
		const page = p || 1;
		const count = await SkillTest.countDocuments({});
		const skillData = await SkillTest.find({})
			.select("name _category _skill image level status")
			.sort({ createdAt: -1 })
			.skip(perPage * page - perPage)
			.limit(perPage);

		const promises = skillData.map(async (e) => {
			const skil = await SkillTestQuestion.countDocuments({
				status: true,
				_skillTest: e._id,
			});
			const obj = {
				_id: e._id,
				name: e.name,
				category: e._category,
				skills: (e._skill && e._skill.length) || 0,
				image: e.image,
				skil,
				level: e.level,
				status: e.status,
			};
			skillTest.push(obj);
		});
		await Promise.all(promises);

		const totalPages = Math.ceil(count / perPage);
		return res.render(`${req.vPath}/admin/skillTest`, {
			skillTest,
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
			return res.render(`${req.vPath}/admin/skillTest/add`, {
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
			const {
				_techSkill,
				_nonSkill,
				questionNo,
				questiontime,
				question,
				option1,
				answer1,
				option2,
				answer2,
				option3,
				answer3,
				option4,
				answer4,
				weightage1,
				weightage2,
				weightage3,
				weightage4,
			} = req.body;

			const tech = _techSkill
				.join("_")
				.split("___")
				.map((y) => y.split("_"));
			const nontech = _nonSkill
				.join("_")
				.split("___")
				.map((y) => y.split("_"));
			const test = await SkillTest.create(req.body);
			if (!test) throw req.ykError("Skill Test not create!");

			if (question && question.length > 0) {
				const promises = question.map(async (q, i) => {
					const options = [];
					if (q) {
						const opt = {
							option: answer1[i],
							weightage: weightage1[i],
						};
						if (option1[i] === "on" || option1[i] === 1) {
							opt.correct = true;
						} else {
							opt.correct = false;
						}
						options.push(opt);
						const opt1 = {
							option: answer2[i],
							weightage: weightage2[i],
						};
						if (option2[i] === "on" || option2[i] === 1) {
							opt1.correct = true;
						} else {
							opt1.correct = false;
						}
						options.push(opt1);
						const opt2 = {
							option: answer3[i],
							weightage: weightage3[i],
						};
						if (option3[i] === "on" || option3[i] === 1) {
							opt2.correct = true;
						} else {
							opt2.correct = false;
						}
						options.push(opt2);
						const opt3 = {
							option: answer4[i],
							weightage: weightage4[i],
						};
						if (option4[i] === "on" || option4[i] === 1) {
							opt3.correct = true;
						} else {
							opt3.correct = false;
						}
						options.push(opt3);
						const _skill = tech[i].concat(nontech[i]);
						const obj = {
							_skillTest: test._id,
							questionNo: questionNo[i],
							_skill,
							time: questiontime[i],
							question: q,
							options,
						};
						const que = await SkillTestQuestion.create(obj);
						if (!que) throw req.ykError("Skill Test not create!");
					}
				});
				await Promise.all(promises);
			}

			const skl = await SkillTestQuestion.find({
				_skillTest: test._id,
			}).select("_skill");
			const sk = [];
			skl.forEach((x) => {
				x._skill.map((y) => sk.push(y.toString()));
			});

			const unique = Array.from(new Set(sk));

			const up = await SkillTest.findByIdAndUpdate(test._id, {
				_skill: unique,
			});
			if (!up) throw req.ykError("Skill Test not create!");
			req.flash("success", "Skill test added successfully!");
			return res.redirect("/admin/skillTest");
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});

module.exports = router;
