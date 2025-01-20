const express = require("express");
const { CollegeSms } = require("../../models");
const { auth1 } = require("../../../helpers");
const router = express.Router();
// router.use(isAdmin);

router
	.route("/")
	.get(auth1, async (req, res) => {
		try {
			const perPage = 4;
			const p = parseInt(req.query.page, 10);
			const page = p || 1;
			const smsName = "";
			const smsMessage = "";
			const count = await CollegeSms.countDocuments({});
			const collegeSms = await CollegeSms.find({})
				.select("name message status")
				.sort({ createdAt: -1 })
				.skip(perPage * page - perPage)
				.limit(perPage);
			const totalPages = Math.ceil(count / perPage);
			return res.render(`${req.vPath}/college/sms`, {
				smsName,
				smsMessage,
				collegeSms,
				perPage,
				totalPages,
				page,
			});
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})
	.post(auth1, async (req, res) => {
		try {
			const { name, message } = req.body;
			const collegeSms = await CollegeSms.findOne({ name });

			if (collegeSms) throw req.ykError("Sms name already exist!");
			CollegeSms.create({ name, message });
			req.flash("success", "Sms added successfully!");
			return res.redirect("/college/sms");
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});

router
	.route("/edit/:id")
	.get(auth1, async (req, res) => {
		try {
			const perPage = 4;
			const p = parseInt(req.query.page, 10);
			const page = p || 1;
			const smsData = await CollegeSms.findById(req.params.id).select(
				"name message"
			);

			const smsName = smsData.name ? smsData.name : "";
			const smsMessage = smsData.message ? smsData.message : "";
			const count = await CollegeSms.countDocuments({});
			const collegeSms = await CollegeSms.find({})
				.select("name message status")
				.sort({ createdAt: -1 })
				.skip(perPage * page - perPage)
				.limit(perPage);
			const totalPages = Math.ceil(count / perPage);
			return res.render(`${req.vPath}/college/sms`, {
				collegeSms,
				smsName,
				smsMessage,
				perPage,
				totalPages,
				page,
			});
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})
	.post(auth1, async (req, res) => {
		try {
			const { id } = req.params;
			const { name, message } = req.body;
			const collegeSms = await CollegeSms.findOne({
				_id: { $ne: id },
				name,
			});
			if (collegeSms) throw new Error("Sms already exist!");
			const pdata = await CollegeSms.findByIdAndUpdate(
				id,
				{ name, message },
				{ new: true }
			);
			if (!pdata) req.ykError("Sms not update now!");
			req.flash("success", "Sms updated successfully!");
			return res.redirect("/college/sms");
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});

module.exports = router;
