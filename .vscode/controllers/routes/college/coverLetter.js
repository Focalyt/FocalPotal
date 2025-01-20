const express = require("express");
const {
	CoverLetter,
	Qualification,
	SubQualification,
	Industry,
	SubIndustry,
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
		const coverLetterData = [];
		const perPage = 5;
		const p = parseInt(req.query.page, 10);
		const page = p || 1;
		const count = await CoverLetter.countDocuments({ isDeleted: isDeleted });
		const coverData = await CoverLetter.find({
			_college: req.session.college._id,
			isDeleted: isDeleted,
		})
			.select("name _industry _qualification active status")
			.sort({ createdAt: -1 })
			.skip(perPage * page - perPage)
			.limit(perPage);
		const promises = coverData.map(async (e) => {
			const qualification = await Qualification.findById({
				_id: e._qualification,
			});
			const industry = await Industry.findById({
				_id: e._industry,
			});
			const obj = {
				_id: e._id,
				name: e.name,
				_industry: industry.name ? industry.name : [],
				_qualification: qualification.name ? qualification.name : [],
				active: e.active,
				status: e.status,
			};
			coverLetterData.push(obj);
		});
		await Promise.all(promises);
		const totalPages = Math.ceil(count / perPage);
		return res.render(`${req.vPath}/college/coverLetter`, {
			coverLetterData,
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
			return res.render(`${req.vPath}/college/coverLetter/add`, {
				industry,
				qualification,
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
			const { _industry, _qualification, name } = req.body;
			const existData = await CoverLetter.findOne({
				_concernPerson: req.session.user._id,
				name,
			});
			if (existData) throw req.ykError("Cover letter title already exist!");
			let ind;
			let qual;
			let isAllInd;
			let isAllQual;
			if (_industry && _industry === "all") {
				const indData = await Industry.find({ status: true }).select("_id");
				if (indData && indData.length > 0) {
					ind = indData.map((x) => x._id);
					isAllInd = true;
				} else {
					ind = [];
					isAllInd = true;
				}
			} else {
				ind = _industry;
				isAllInd = false;
			}

			if (_qualification && _qualification === "all") {
				const quaData = await Qualification.find({ status: true }).select(
					"_id"
				);
				if (quaData && quaData.length > 0) {
					qual = quaData.map((x) => x._id);
					isAllQual = true;
				} else {
					qual = [];
					isAllQual = true;
				}
			} else {
				qual = _qualification;
				isAllQual = false;
			}

			const cl = await CoverLetter.create({
				...req.body,
				_industry: ind,
				_qualification: qual,
				isAllQual,
				isAllInd,
				_concernPerson: collegedetail._concernPerson,
				_college: collegedetail._id,
			});
			if (!cl) throw req.ykError("Cover letter not create!");
			req.flash("success", "Cover letter added successfully!");
			return res.redirect("/panel/college/coverLetter");
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
			const industry = await Industry.find({ status: true });
			const qualification = await Qualification.find({ status: true });
			const coverletters = await CoverLetter.findById(id);
			if (!coverletters) throw req.ykError("Cover letter not found!");
			const subInd = await SubIndustry.find({
				status: true,
				_industry: coverletters._industry,
			}).select("name");
			const subQual = await SubQualification.find({
				status: true,
				_qualification: coverletters._qualification,
			}).select("name");
			return res.render(`${req.vPath}/college/coverLetter/edit`, {
				industry,
				qualification,
				coverletters,
				subInd,
				subQual,
			});
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})
	.post(auth1, async (req, res) => {
		try {
			const {
				_industry,
				_qualification,
				name,
				_subIndustry,
				_subQualification,
			} = req.body;
			const existData = await CoverLetter.findOne({
				name,
				_id: { $ne: req.params.id },
			});
			if (existData) throw req.ykError("Cover letter title already exist!");
			let ind;
			let qual;
			let isAllInd;
			let isAllQual;
			let subInd;
			let subQul;
			if (_industry && _industry === "all") {
				const indData = await Industry.find({ status: true }).select("_id");
				if (indData && indData.length > 0) {
					ind = indData.map((x) => x._id);
					isAllInd = true;
					subInd = [];
				} else {
					ind = [];
					isAllInd = true;
					subInd = [];
				}
			} else {
				ind = _industry;
				isAllInd = false;
				subInd = _subIndustry;
			}

			if (_qualification && _qualification === "all") {
				const quaData = await Qualification.find({ status: true }).select(
					"_id"
				);
				if (quaData && quaData.length > 0) {
					qual = quaData.map((x) => x._id);
					isAllQual = true;
					subQul = [];
				} else {
					qual = [];
					isAllQual = true;
					subQul = [];
				}
			} else {
				qual = _qualification;
				isAllQual = false;
				subQul = _subQualification;
			}

			const cl = await CoverLetter.findByIdAndUpdate(req.params.id, {
				...req.body,
				_industry: ind,
				_qualification: qual,
				_subIndustry: subInd,
				_subQualification: subQul,
				isAllInd,
				isAllQual,
			});
			if (!cl) throw req.ykError("Cover letter not updated!");
			req.flash("success", "Cover letter updated successfully!");
			return res.redirect("/panel/college/coverLetter");
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});

module.exports = router;
