const express = require("express");
const { CollegeSms } = require("../../models");
const { auth1 } = require("../../../helpers");
const router = express.Router();
// router.use(isAdmin);

router.route("/").get(auth1, async (req, res) => {
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
});

module.exports = router;
