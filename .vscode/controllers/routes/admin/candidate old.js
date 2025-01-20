const express = require("express");
const axios = require("axios");
const {
	Candidate,
	Qualification,
	Skill,
	Country,
	State,
	City,
	SubQualification,
} = require("../../models");
const { isAdmin } = require("../../../helpers");

const router = express.Router();
router.use(isAdmin);

router.route("/").get(async (req, res) => {
	try {
		const perPage = 5;
		const p = parseInt(req.query.page, 10);
		const page = p || 1;
		const count = await Candidate.countDocuments({});
		const populate = [
			{
				path: "_qualification",
				select: "name",
			},
			{
				path: "_subQualification",
				select: "name",
			},
		];
		const candidates = await Candidate.find({})
			.populate(populate)
			.select("name image session mobile email semester status")
			.sort({ createdAt: -1 })
			.skip(perPage * page - perPage)
			.limit(perPage);
		const totalPages = Math.ceil(count / perPage);
		return res.render(`${req.vPath}/admin/candidate`, {
			candidates,
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
			const country = await Country.find({});
			const qualification = await Qualification.find({ status: true });
			const skill = await Skill.find({ status: true });
			const techSkill = skill.filter((x) => x.type === "technical");
			const nonTechSkill = skill.filter((x) => x.type === "non technical");
			return res.render(`${req.vPath}/admin/candidate/add`, {
				country,
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
			const { mobile } = req.body;
			const dataCheck = await Candidate.findOne({ mobile });
			if (dataCheck) throw req.ykError("Mobile number already exist!");
			const session = req.body.sessionStart
				.concat("-")
				.concat(req.body.sessionEnd);
			const candidate = await Candidate.create({ ...req.body, session });
			if (!candidate) throw req.ykError("Candidate not create!");
			req.flash("success", "Candidate added successfully!");
			return res.redirect("/admin/candidate");
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});

router
	.route("/edit/:id")
	.get(async (req, res) => {
		try {
			const { id } = req.params;
			const country = await Country.find({});
			const qualification = await Qualification.find({ status: true });
			const skill = await Skill.find({ status: true });
			const techSkill = skill.filter((x) => x.type === "technical");
			const nonTechSkill = skill.filter((x) => x.type === "non technical");
			const candidate = await Candidate.findById(id);
			if (!candidate) throw req.ykError("Candidate not found!");
			const state = await State.find({ countryId: candidate.countryId });
			const city = await City.find({ stateId: candidate.stateId });
			const subqual = await SubQualification.find({
				_qualification: candidate._qualification,
			});
			return res.render(`${req.vPath}/admin/candidate/edit`, {
				country,
				qualification,
				techSkill,
				nonTechSkill,
				state,
				city,
				subqual,
				candidate,
			});
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})
	.post(async (req, res) => {
		try {
			const { mobile } = req.body;
			const { id } = req.params;
			const dataCheck = await Candidate.findOne({
				_id: { $ne: id },
				mobile,
			});
			if (dataCheck) throw req.ykError("Mobile number already exist!");
			const session = req.body.sessionStart
				.concat("-")
				.concat(req.body.sessionEnd);
			const candidateUpdate = await Candidate.findByIdAndUpdate(id, {
				...req.body,
				session,
			});
			if (!candidateUpdate) throw req.ykError("Candidate not updated!");
			req.flash("success", "Candidate updated successfully!");
			return res.redirect("/admin/candidate");
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});

router.route("/createResume/:id").get(async (req, res) => {
	try {
		const dataObj = {
			id: req.params.id,
			reCreate: !!req.query.reCreate,
			url: `${req.protocol}://${req.get("host")}/candidateForm/${
				req.params.id
			}`,
		};

		const candidate = await Candidate.findById(req.params.id);
		if (!candidate || !candidate._id)
			throw req.ykError("No candidate found!");
		const { data } = await axios.post(
			"http://15.206.9.185:3027/pdfFromUrl",
			dataObj
		);

		if (!data || !data.status || !data.data || !data.data.bucketFileName)
			throw req.ykError("Unable to create pdf!");
		const { bucketFileName: enrollmentFormPdfLink } = data.data;
		const cand = await Candidate.findByIdAndUpdate(req.params.id, {
			enrollmentFormPdfLink,
		});
		if (!cand) throw req.ykError("Unable to create pdf!");
		req.flash("success", "Create pdf successfully!");
		return res.redirect("/admin/candidate");
	} catch (err) {
		req.flash("error", err.message || "Something went wrong!");
		return res.redirect("back");
	}
});

module.exports = router;
