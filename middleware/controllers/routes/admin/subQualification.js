const express = require("express");
const { Qualification, SubQualification } = require("../../models");
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
			const subName = "";
			const subQua = "";
			const qualifications = await Qualification.find({
				status: true,
			}).select("name");
			const populate = { path: "_qualification", select: "name" };
			const count = await SubQualification.countDocuments({status: true});
			const subQual = await SubQualification.find({status: true})
				.populate(populate)
				.select("name status")
				.sort({ createdAt: -1 })
				.skip(perPage * page - perPage)
				.limit(perPage);
			const totalPages = Math.ceil(count / perPage);
			return res.render(`${req.vPath}/admin/subQualificationSetting`, {
				subName,
				subQua,
				subQual,
				perPage,
				totalPages,
				page,
				qualifications,
				menu:'subQualification',
				view
			});
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})
	.post(async (req, res) => {
		try {	
			if(req.body.subQuali){
				const 	subQ = await SubQualification.findOne({ _id:req.body.subQuali, status:true});
				if (subQ) throw req.ykError("Stream already exist!");
				await SubQualification.findOneAndUpdate({_id:req.body.subQuali}, { 
					status:true 
				});
				req.flash("success", "Stream added successfully!");
				return res.redirect("/admin/subQualification");
			}else{
				const { name, _qualification } = req.body;
				const subQ = await SubQualification.findOne({ name:req.body.name});
				if (subQ) throw req.ykError("Stream already exist!");
				const sub = await SubQualification.create({ name, _qualification });
				if(!sub) {
					throw req.ykError("SubQualification not created!");
				}
				req.flash("success", "Stream added successfully!");
				return res.redirect("/admin/subQualification");
			}	
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
			const subData = await SubQualification.findById(req.params.id).select(
				"name _qualification"
			);
			const qualifications = await Qualification.find({
				status: true,
			}).select("name");
			const subName = subData.name ? subData.name : "";
			const subQua = subData._qualification ? subData._qualification : "";
			const count = await SubQualification.countDocuments({status: true});
			const populate = { path: "_qualification", select: "name" };
			const subQual = await SubQualification.find({status: true})
				.populate(populate)
				.select("name _qualification status")
				.sort({ createdAt: -1 })
				.skip(perPage * page - perPage)
				.limit(perPage);
			const totalPages = Math.ceil(count / perPage);
			return res.render(`${req.vPath}/admin/subQualificationSetting`, {
				subQual,
				subName,
				qualifications,
				subQua,
				perPage,
				totalPages,
				page,
				menu:'subQualification',
				view
			});
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})
	.post(async (req, res) => {
		try {
			const { name, _qualification } = req.body;
			const subQualification = await SubQualification.findOne({
				_id: { $ne: req.params.id },
				name,
			});
			if (subQualification)
				throw new Error("Sub qualification already exist!");
			const pdata = await SubQualification.findByIdAndUpdate(
				req.params.id,
				{ name },
				{ new: true }
			);
			if (!pdata) req.ykError("Stream not update now!");
			req.flash("success", "Stream updated successfully!");
			return res.redirect("/admin/subQualification");
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});

module.exports = router;
