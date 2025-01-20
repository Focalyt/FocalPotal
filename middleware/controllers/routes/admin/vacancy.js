const express = require("express");
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
const { Translate } = require('@google-cloud/translate').v2;
const {translateProjectId, translateKey} = require('../../../config')

const { isAdmin } = require("../../../helpers");
const router = express.Router();
router.use(isAdmin);

router.route("/").get(async (req, res) => {
	try {
		const perPage = 5;
		const p = parseInt(req.query.page, 10);
		const page = p || 1;
		const count = await Vacancy.countDocuments({ isDeleted: false });
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

		const vacancies = await Vacancy.find({ isDeleted: false }, {})
			.populate(populate)
			.select("name closingDate status")
			.sort({ createdAt: -1 })
			.skip(perPage * page - perPage)
			.limit(perPage);
		const totalPages = Math.ceil(count / perPage);
		return res.render(`${req.vPath}/admin/vacancy`, {
			vacancies,
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
			const industry = await Industry.find({ status: true });
			const company = await Company.find({ status: true });
			const skill = await Skill.find({ status: true });
			const vacancyType = await VacancyType.find({ status: true });
			const qualification = await Qualification.find({ status: true });
			return res.render(`${req.vPath}/admin/vacancy/add`, {
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
	.post(async (req, res) => {
		try {
			const comp = await Vacancy.create(req.body);
			if (!comp) throw req.ykError("Vacancy not create!");
			req.flash("success", "Vacancy added successfully!");
			return res.redirect("/admin/vacancy");
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
			return res.render(`${req.vPath}/admin/vacancy/edit`, {
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
	.post(async (req, res) => {
		try {
			const vacancyUpdate = await Vacancy.findByIdAndUpdate(
				req.params.id,
				req.body
			);
			if (!vacancyUpdate) throw req.ykError("Vacancy not updated!");
			req.flash("success", "Vacancy updated successfully!");
			return res.redirect("/admin/vacancy");
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});

router.route('/translate')
	.post(async (req, res) => {
		const message = req.body.message?.toLowerCase();
		console.log('I received this message ', message)
		const translate = new Translate({ projectId: translateProjectId, key: translateKey });
		
		translate.translate(message, 'hi').then(result => {
			return res.send({ status: true, message: result[0] });
		})
			.catch(err => {
				console.log('=========> Err', err)
				return res.send({ status: false, message: 'caught an error' });
			});
		
	})

module.exports = router;
