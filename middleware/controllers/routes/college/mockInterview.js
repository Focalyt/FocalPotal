const express = require("express");
const {
	MockInterview,
	MockQuestion,
	Qualification,
	Skill,
	Industry,
	College,
} = require("../../models");
const mockInterview = require("../../models/mockInterview");
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
		const mockInterview = [];
		const perPage = 5;
		const p = parseInt(req.query.page, 10);
		const page = p || 1;
		const count = await MockInterview.countDocuments({
			_college: req.session.college._id,
			isDeleted: isDeleted,
		});
		const mocks = await MockInterview.find({
			_college: req.session.college._id,
			isDeleted: isDeleted,
		})
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
		return res.render(`${req.vPath}/college/mockInterview`, {
			mockInterview,
			perPage,
			totalPages,
			page,
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
			const industry = await Industry.find({ status: true });
			const qualification = await Qualification.find({ status: true });
			const skill = await Skill.find({ status: true });
			const techSkill = skill.filter((x) => x.type === "technical");
			const nonTechSkill = skill.filter((x) => x.type === "non technical");
			return res.render(`${req.vPath}/college/mockInterview/add`, {
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
	.post(auth1, async (req, res) => {
		try {
			const collegedetail = await College.findOne({
				_concernPerson: req.session.user._id,
			});

			const { questionNo, description, comments } = req.body;
			const mocks = await MockInterview.create({
				...req.body,
				_concernPerson: collegedetail._concernPerson,
				_college: collegedetail._id,
			});
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
			return res.redirect("/panel/college/mockInterview");
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});

router
	.route("/edit/:id")
	.get(auth1, async (req, res) => {
		try {
			const { id } = req.params;
			const mockInterview = await MockInterview.findById(id);
			if (!mockInterview) throw req.ykError("Mockinterview not found!");
			const mockInterviewId = mockInterview._id;
			const mockQuestion = await MockQuestion.find({
				_mockInterview: mockInterviewId,
			});
			if (!mockQuestion) throw req.ykError("MockQuestion not found!");
			console.log(mockQuestion);

			const industry = await Industry.find({ status: true });
			const qualification = await Qualification.find({ status: true });
			const skill = await Skill.find({ status: true });
			const techSkill = skill.filter((x) => x.type === "technical");
			const nonTechSkill = skill.filter((x) => x.type === "non technical");
			return res.render(`${req.vPath}/college/mockInterview/edit`, {
				industry,
				qualification,
				techSkill,
				nonTechSkill,
				mockInterview,
				mockQuestion,
			});
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})
	.post(auth1, async (req, res) => {
		try {
			const { id } = req.params;
			// const mockInterview = await MockInterview.findById(id);
			// if (!mockInterview) throw req.ykError("Mockinterview not found!");
			// const mockInterviewId = mockInterview._id;
			// console.log(mockInterview._id)
			const { questionNo, description, comments, mockQuestionId } = req.body;

			//return false;
			const mocksupdate = await MockInterview.findByIdAndUpdate(
				req.params.id,
				req.body
			);

			req.body.mockQuestionId = req.body.mockQuestionId.filter(function (
				el
			) {
				return el != "";
			});
			if (req.body.mockQuestionId.length > 0) {
				await MockQuestion.remove({
					_id: { $nin: req.body.mockQuestionId },
				});
			}
			// -------------------
			if (req.body.questionNo && req.body.questionNo.length > 0) {
				req.body.questionNo.forEach(async (s, i) => {
					if (s != "") {
						if (
							req.body.mockQuestionId[i] != "" &&
							req.body.mockQuestionId[i] != undefined
						) {
							let objs = {
								// _mockInterview: req.params.id,
								question: s,
								comments: comments[i],
								description: description[i],
							};
							// var id = ObjectId(req.body.mockQuestionId[i]);
							let question = await MockQuestion.findByIdAndUpdate(
								{ _id: req.body.mockQuestionId[i] },
								objs
							);
						} else {
							let objs = {
								_mockInterview: req.params.id,
								question: s,
								comments: comments[i],
								description: description[i],
							};
							let updatedData = await MockQuestion.create(objs);
						}
					}
				});
			}

			// -------------------
			if (!mocksupdate) throw req.ykError("Mock Interview not updated!");
			req.flash("success", "Mock Interview updated successfully!");
			return res.redirect("/panel/college/mockInterview");
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});
module.exports = router;
