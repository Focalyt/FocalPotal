const express = require("express");
const { State } = require("../../models");
const { isAdmin } = require("../../../helpers");
const router = express.Router();
const uuid = require("uuid/v1");
router.use(isAdmin);

router
	.route("/")
	.get(async (req, res) => {
		try {
			let view = false
		if(req.session.user.role === 10){
			view = true
		}
			const perPage = 10;
			const p = parseInt(req.query.page, 10);
			const page = p || 1;
			const stateName = "";
			const count = await State.countDocuments({countryId:'101'});
			
				const states = await State.find({countryId:'101'})
				.select("name status")
				.sort({ name: 1 })
				.skip(perPage * page - perPage)
				.limit(perPage);

			const totalPages = Math.ceil(count / perPage);
			return res.render(`${req.vPath}/admin/stateSetting`, {
				stateName,
				states,
				perPage,
				totalPages,
				page,
				menu:'states',
				view
			});
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})
	.post(async (req, res) => {
		try {
			if(req.body.id){
				const st = await State.findOne({ _id:req.body.id, status:true});
			if (st) throw req.ykError("state already exist!");

			await State.findOneAndUpdate({_id:req.body.id}, { 
				status:true 
			});

			req.flash("success", "State updated successfully!");
			return res.redirect("/admin/states");
			}else{
				const st = await State.findOne({name:req.body.name});
				if (st) throw req.ykError("State already exist!");
				const state = await State.create({ name:req.body.name ,status:true, stateId: uuid()})
				if (!state){
					throw req.ykError("State not created!");
				}
				req.flash("success", "State added successfully!");
				return res.redirect("/admin/states");
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
			const perPage = 10;
			const p = parseInt(req.query.page, 10);
			const page = p || 1;
			// const qual = await State.find({status:true, countryId:'101'});
			// console.log("--------------------");
			// console.log(qual)
			const stateData = await State.findById(req.params.id).select(
				"name"
			);
			const stateName = stateData.name ? stateData.name : "";
			const count = await State.countDocuments({countryId:'101'});
			const states = await State.find({countryId:'101'})
				.select("name status")
				.sort({ name: 1 })
				.skip(perPage * page - perPage)
				.limit(perPage);
			const totalPages = Math.ceil(count / perPage);
			return res.render(`${req.vPath}/admin/stateSetting`, {
				states,
				stateName,
				perPage,
				totalPages,
				page,
				menu:'states',
				view
			});
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})
	.post(async (req, res) => {
		try {
			const { name } = req.body;
			const state = await State.findOne({
				_id: { $ne: req.params.id },
				name,
			});
			
			if (state) throw new Error("State already exist!");
			const pdata = await State.findByIdAndUpdate(
				req.params.id,
				{ name },
				{ new: true }
			);
			if (!pdata) req.ykError("State not update now!");
			req.flash("success", "State updated successfully!");
			return res.redirect("/admin/states");
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});

module.exports = router;
