const express = require("express");
const { State, City } = require("../../models");
const { isAdmin } = require("../../../helpers");
const router = express.Router();
router.use(isAdmin);
const readXlsxFile = require("read-excel-file/node");
const { parseAsync } = require('json2csv');
const csv = require('fast-csv');
const fs = require('fs')
const path = require('path')

router
	.route("/")
	.get(async (req, res) => {
		try {
			let view = false
			if (req.session.user.role === 10) {
				view = true
			}
			const perPage = 10;
			const p = parseInt(req.query.page, 10);
			const page = p || 1;
			const cityName = "";
			const stateId = req.query.stateId;
			const states = await State.find({ status: {$ne: false}, countryId :'101' }).select("name stateId");
			// const populate = { path: "_industry", select: "name" };
			const count = await City.countDocuments({ stateId: req.query.stateId });
			const cities = await City.find({ stateId: req.query.stateId })
				.select("name status stateId place location")
				.sort({ name: 1 })
				.skip(perPage * page - perPage)
				.limit(perPage);
			const place = "";
			const latitude = "";
			const longitude = ""
			const totalPages = Math.ceil(count / perPage);
			return res.render(`${req.vPath}/admin/citySetting`, {
				cityName,
				stateId,
				cities,
				perPage,
				totalPages,
				page,
				states,
				menu: 'cities',
				view,
				place,
				latitude,
				longitude
			});
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})
	.post(async (req, res) => {
		try {
			const { name, stateId, place, latitude, longitude } = req.body;
			const city = await City.findOne({ name, stateId });

			if (city) throw req.ykError("City already exist!");
			City.create({ name, stateId, place, location: { type: "Point", coordinates: [longitude, latitude] } });
			req.flash("success", "City added successfully!");
			return res.redirect("/admin/cities?stateId=" + stateId);
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
			if (req.session.user.role === 10) {
				view = true
			}
			const perPage = 10;
			const p = parseInt(req.query.page, 10);
			const page = p || 1;
			const cityData = await City.findById(req.params.id).select(
				"name stateId place location"
			);

			const cityName = cityData.name ? cityData.name : "";
			const stateId = cityData.stateId ? cityData.stateId : "";
			const count = await City.countDocuments({ stateId: req.query.stateId });
			const place = cityData.place ? cityData.place : "";
			const latitude = cityData.location.coordinates[1] ? cityData.location.coordinates[1] : "";
			const longitude = cityData.location.coordinates[0] ? cityData.location.coordinates[0] : "";
			const states = await State.find({ status: { $ne: false } }).select("name stateId");
			const cities = await City.find({ stateId: req.query.stateId })
				.select("name stateId status")
				.sort({ name: 1 })
				.skip(perPage * page - perPage)
				.limit(perPage);
			const totalPages = Math.ceil(count / perPage);
			return res.render(`${req.vPath}/admin/citySetting`, {
				cities,
				states,
				cityName,
				stateId,
				perPage,
				totalPages,
				place,
				latitude,
				longitude,
				page,
				menu: 'cities',
				view
			});
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})
	.post(async (req, res) => {
		try {
			const { name, stateId, place, latitude, longitude } = req.body;
			const city = await City.findOne({
				_id: { $ne: req.params.id },
				name,
				stateId
			});
			if (city) throw new Error("City already exist!");
			const pdata = await City.findByIdAndUpdate(
				req.params.id,
				{ name, stateId, place, location: { type: "Point", coordinates: [longitude, latitude] } },
				{ new: true }
			);
			if (!pdata) req.ykError("City not updated now!");
			req.flash("success", "City updated successfully!");
			return res.redirect("/admin/cities?stateId=" + stateId);
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});
module.exports = router;
