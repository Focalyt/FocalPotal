const express = require("express");
const mongoose = require('mongoose');
const { ObjectId } = require("mongodb");
const { auth1 } = require("../../../helpers");
const {
	Skill,
	Company,
	Industry,
	SubIndustry,
	Vacancy,
	VacancyType,
	Country,
	State,
	City,
	Qualification,
	SubQualification,
} = require("../../models");

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
		const count = await Vacancy.countDocuments({ isDeleted: isDeleted });
		const populate = [
			{
				path: "_company",
				select: "name logo",
			},
			{
				path: "_industry",
				select: "name",
			},
			{
				path: "_vacancyType",
				select: "name",
			},
		];
		const vacancies = await Vacancy.find({
			isDeleted: isDeleted,
			_company: new mongoose.Types.ObjectId(req.session.company._id),
		})
			.populate(populate)
			.select("name closingDate status")
			.sort({ createdAt: -1 })
			.skip(perPage * page - perPage)
			.limit(perPage);
		const totalPages = Math.ceil(count / perPage);
		return res.render(`${req.vPath}/company/vacancy`, {
			vacancies,
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
			const country = await Country.find({});
			const industry = await Industry.find({ status: true });
			const company = await Company.find({});
			const skill = await Skill.find({ status: true });
			const vacancyType = await VacancyType.find({ status: true });
			const qualification = await Qualification.find({ status: true });
			return res.render(`${req.vPath}/company/vacancy/add`, {
				country,
				industry,
				company,
				skill,
				vacancyType,
				qualification,
			});
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})
	.post(auth1, async (req, res) => {
		try {
			delete req.body._company;
			req.body._company = req.session.company._id;
			const comp = await Vacancy.create(req.body);
			if (!comp) throw req.ykError("Vacancy not create!");
			req.flash("success", "Vacancy added successfully!");
			return res.redirect("/panel/company/vacancy");
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
			const country = await Country.find({});
			const industry = await Industry.find({ status: true });
			const company = await Company.find({ status: true });
			const skill = await Skill.find({ status: true });
			const vacancyType = await VacancyType.find({ status: true });
			const qualification = await Qualification.find({ status: true });
			const vacancy = await Vacancy.findById(id);
			if (!vacancy) throw req.ykError("Vacancy not found!");
			const state = await State.find({ countryId: vacancy.countryId });
			const city = await City.find({ stateId: vacancy.stateId });
			const subqual = await SubQualification.find({
				_qualification: vacancy._qualification,
			});
			const subInd = await SubIndustry.find({
				_industry: vacancy._industry,
			});
			return res.render(`${req.vPath}/company/vacancy/edit`, {
				country,
				industry,
				company,
				skill,
				vacancyType,
				qualification,
				vacancy,
				state,
				city,
				subqual,
				subInd,
			});
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})
	.post(auth1, async (req, res) => {
		try {
			delete req.body._company;
			req.body._company = req.session.company._id;
			const vacancyUpdate = await Vacancy.findByIdAndUpdate(
				req.params.id,
				req.body
			);
			if (!vacancyUpdate) throw req.ykError("Vacancy not updated!");
			req.flash("success", "Vacancy updated successfully!");
			return res.redirect("/panel/company/vacancy");
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});
module.exports = router;
