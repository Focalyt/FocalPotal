const express = require("express");
const { Industry, Company } = require("../../models");
const { isAdmin } = require("../../../helpers");
const { ObjectId } = require("mongodb");
const mongoose = require('mongoose');
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
			const indName = "";
			const indImage = "";
			const count = await Industry.countDocuments({});
			const industry = await Industry.find({})
				.select("name image status")
				.sort({ createdAt: -1 })
				.skip(perPage * page - perPage)
				.limit(perPage);

			var new_inds = [];
			industry.forEach(async (obj) => {
				const checkInsd = await Company.findOne(
					{ _industry: new mongoose.Types.ObjectId(obj._id) },
					{}
				);
				if (checkInsd != null) {
					obj.deleteStatus = false;
					new_inds.push(obj);
				} else {
					obj.deleteStatus = true;
					new_inds.push(obj);
				}
				//  console.log(obj)
				//  return obj;
				//  console.log( ObjectId(obj._id))
				//  console.log(checkInsd)
			});

			const totalPages = Math.ceil(count / perPage);
			return res.render(`${req.vPath}/admin/industrySetting`, {
				indName,
				indImage,
				industry,
				perPage,
				totalPages,
				page,
				menu:'industry',
				view
			});
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})
	.post(async (req, res) => {
		try {
			const { name, image } = req.body;
			const industry = await Industry.findOne({ name });

			if (industry) throw req.ykError("Industry already exist!");
			const indus = await Industry.create({ name, image });
			if(!indus) {
				throw req.ykError("Industry not created!");
			}

			req.flash("success", "Industry added successfully!");
			return res.redirect("/admin/industry");
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
			const indData = await Industry.findById(req.params.id).select(
				"name image"
			);

			const indName = indData.name ? indData.name : "";
			const indImage = indData.image ? indData.image : "";
			const count = await Industry.countDocuments({});
			const industry = await Industry.find({})
				.select("name image status")
				.sort({ createdAt: -1 })
				.skip(perPage * page - perPage)
				.limit(perPage);
			const totalPages = Math.ceil(count / perPage);
			return res.render(`${req.vPath}/admin/industrySetting`, {
				industry,
				indName,
				indImage,
				perPage,
				totalPages,
				page,
				menu:"industry",
				view
			});
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})
	.post(async (req, res) => {
		try {
			const { name, image } = req.body;
			const industry = await Industry.findOne({
				_id: { $ne: req.params.id },
				name,
			});
			if (industry) throw new Error("Industry already exist!");
			const pdata = await Industry.findByIdAndUpdate(
				req.params.id,
				{ name, image },
				{ new: true }
			);
			if (!pdata) req.ykError("Industry not update now!");
			req.flash("success", "Industry updated successfully!");
			return res.redirect("/admin/industry");
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});

module.exports = router;
