const express = require("express");
const {
	CoverLetter,
	Qualification,
	SubQualification,
	Industry,
	SubIndustry,
} = require("../../models");

const { isAdmin } = require("../../../helpers");
const router = express.Router();
router.use(isAdmin);

router.route("/").get(async (req, res) => {
	try {
		const coverLetterData = [];
		const perPage = 5;
		const p = parseInt(req.query.page, 10);
		const page = p || 1;
		const count = await CoverLetter.countDocuments({});
		const coverData = await CoverLetter.find({})
			.select("name _industry _qualification active status")
			.sort({ createdAt: -1 })
			.skip(perPage * page - perPage)
			.limit(perPage);

		const promises = coverData.map(async (e) => {
			const obj = {
				_id: e._id,
				name: e.name,
				_industry: e._industry.length,
				_qualification: e._qualification.length,
				active: e.active,
				status: e.status,
			};
			coverLetterData.push(obj);
		});
		await Promise.all(promises);

		const totalPages = Math.ceil(count / perPage);
		return res.render(`${req.vPath}/admin/coverLetter`, {
			coverLetterData,
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
			return res.render(`${req.vPath}/admin/coverLetter/add`, {
				industry,
				qualification,
			});
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})
	.post(async (req, res) => {
		try {
			const { _industry, _qualification, name } = req.body;
			const existData = await CoverLetter.findOne({ name });
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
			});
			if (!cl) throw req.ykError("Cover letter not create!");
			req.flash("success", "Cover letter added successfully!");
			return res.redirect("/admin/coverLetter");
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
			return res.render(`${req.vPath}/admin/coverLetter/edit`, {
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
	.post(async (req, res) => {
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
			return res.redirect("/admin/coverLetter");
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});

module.exports = router;
