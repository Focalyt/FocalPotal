const express = require("express");
const { ObjectId } = require("mongodb");
const bcrypt = require("bcryptjs");
const { auth1, isAdmin } = require("../../../helpers");
const moment = require("moment");
const { Courses, CourseSectors, Import,
	Candidate,
	Qualification,
	Skill,
	Country,
	User,
	State,
	City,
	College,
	SubQualification,
	University,
	coinsOffers,
	CoinsAlgo,
	SmsHistory,
	CashBackRequest,
	CandidateCashBack,
	KycDocument,
	Notification,
	Referral,
	CandidateDoc,
	Company, Post } = require("../../models");
const candidateServices = require('../services/candidate')
const { candidateCashbackEventName } = require('../../db/constant');
const router = express.Router();
router.use(isAdmin);


router
	.route("/add")
	.get(async (req, res) => {
		try {
			let view = false
			if (req.session.user.role === 10) {
				view = true
			}
			const data = req.query
			if (req.query.status == undefined) {
				var status = true;
				var isChecked = "false";
			} else if (req.query.status.toString() == "true") {
				var status = true;
				var isChecked = "false";
			} else if (req.query.status.toString() == "false") {
				var status = false;
				var isChecked = "true";
			}
			const perPage = 20;
			const p = parseInt(req.query.page, 10);
			const page = p || 1;
			let filter = {
				isDeleted: false,
				status
			};
			
			let numberCheck = isNaN(data?.name)
			let name = ''

			var format = `/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;`;
			data?.name?.split('').some(char => {
				if (!format.includes(char))
					name += char
			})

			if (name && numberCheck) {
				filter["$or"] = [
					{ "name": { "$regex": name, "$options": "i" } },
				]
				smsFilter["$or"] = [
					{ "name": { "$regex": name, "$options": "i" } },
				]
			}
			if (name && !numberCheck) {
				filter["$or"] = [
					{ "name": { "$regex": name, "$options": "i" } },
					{ "mobile": Number(name) },
					{ "whatsapp": Number(name) }
				]
				
			}

			if (data.FromDate && data.ToDate) {
				let fdate = moment(data.FromDate).utcOffset("+05:30").startOf('day').toDate()
				let tdate = moment(data.ToDate).utcOffset("+05:30").endOf('day').toDate()
				filter["createdAt"] = {
					$gte: fdate,
					$lte: tdate
				}
				smsFilter["createdAt"] = {
					$gte: fdate,
					$lte: tdate
				}
			}
			if (data.Profile && data.Profile !== 'All') {
				filter["isProfileCompleted"] = data.Profile == 'true' ? true : false
			}
			if (data.verified) {
				filter["verified"] = data.verified == 'true' ? true : false
			}
			
			const count = await Candidate.countDocuments(filter)
			let { value, order } = req.query
			let sorting = {}
			if (value && order) {
				sorting[value] = Number(order)
			} else {
				sorting = { createdAt: -1 }
			}
			let agg = candidateServices.adminCandidatesList(sorting, perPage, page, candidateCashbackEventName.cashbackrequestaccepted, { value, order }, filter)
			let candidates = await Candidate.aggregate(agg)
			const totalPages = Math.ceil(count / perPage);

			return res.render(`${req.vPath}/admin/post/add`, {
				menu: 'addPost',
				candidates: candidates,
				perPage,
				totalPages,
				page,
				count,
				data,
				isChecked,
				
				view,
				
				sortingValue: Object.keys(sorting),
				sortingOrder: Object.values(sorting)
			});
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}

	});

router.post('/getTagsList', async (req, res) => {
	try {

		var selectedTag = req.body.searchfor;
		const data = req.body;
		const searchQuery = data.search ? data.search.trim() : "";
		const page = parseInt(data.page, 10) || 1;
		const perPage = 20;
		const skip = (page - 1) * perPage;

		let filter = { isDeleted: false, status: true };

		var isNumber;
		var count;
		var candidates;

		switch (selectedTag) {
			case "company":
				if (searchQuery) {
					isNumber = /^[0-9]+$/.test(searchQuery);
					filter["name"] = { $regex: searchQuery, $options: "i" };
				}
				count = await Company.countDocuments(filter);
				candidates = await Company.find(filter)
					.select("name")
					.sort({ createdAt: -1 })
					.skip(skip)
					.limit(perPage)
					.lean();
				break;

			case "college":
				if (searchQuery) {
					isNumber = /^[0-9]+$/.test(searchQuery);
					filter["name"] = { $regex: searchQuery, $options: "i" };
				}
				count = await College.countDocuments(filter);
				candidates = await College.find(filter)
					.select("name")
					.sort({ createdAt: -1 })
					.skip(skip)
					.limit(perPage)
					.lean();
				break;

			default:
				if (searchQuery) {
					isNumber = /^[0-9]+$/.test(searchQuery);
					if (isNumber) {
						filter["$or"] = [
							{ "$expr": { "$regexMatch": { "input": { "$toString": "$mobile" }, "regex": searchQuery, "options": "i" } } },
							{ "$expr": { "$regexMatch": { "input": { "$toString": "$whatsapp" }, "regex": searchQuery, "options": "i" } } }
						];
					} else {
						filter["name"] = { $regex: searchQuery, $options: "i" };
					}
				}
				count = await Candidate.countDocuments(filter);
				candidates = await Candidate.find(filter)
					.select("name mobile")
					.sort({ createdAt: -1 })
					.skip(skip)
					.limit(perPage)
					.lean();
				break;

		}

		return res.json({
			candidates,
			perPage,
			totalPages: Math.ceil(count / perPage),
			page,
			count
		});

	} catch (err) {
		console.error("Error:", err);
		return res.status(400).json({ error: true, message: "Something went wrong" });
	}
});

router.get('/allposts', async (req, res) => {
	try {


		let filter = { status: true}
				
		let posts = await Post.find(filter).sort({  createdAt: -1 });


		return res.render(`${req.vPath}/admin/post/allPosts`,{
			menu : 'allposts',
			posts
		});

	} catch (err) {
		console.error("Error:", err);
		return res.status(400).json({ error: true, message: "Something went wrong" });
	}
});






module.exports = router;
