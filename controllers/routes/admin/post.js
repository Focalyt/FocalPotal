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
	CandidateDoc } = require("../../models");
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
			let smsFilter = {
				isDeleted: false,
				status: true,
				isProfileCompleted: false
			}

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
				smsFilter["$or"] = [
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
			const smsCount = await Candidate.countDocuments(smsFilter);
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
			const smsHistory = await SmsHistory.findOne().sort({ createdAt: -1 }).select("createdAt count")

			return res.render(`${req.vPath}/admin/post/add`, {
				menu: 'addPost',
				candidates: candidates,
				perPage,
				totalPages,
				page,
				count,
				data,
				menu: 'candidate',
				isChecked,
				smsCount,
				view,
				smsHistory,
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
        let view = false;
        if (req.session.user.role === 10) {
            view = true;
        }

        const data = req.body;
        const searchQuery = data.search ? data.search.trim() : "";

        let filter = { isDeleted: false, status: true };
        let smsFilter = { isDeleted: false, status: true, isProfileCompleted: false };

        if (searchQuery) {
            let isNumber = /^[0-9]+$/.test(searchQuery); 

            if (isNumber) {
                let mobileRegex = new RegExp(searchQuery, "i");

                filter["$or"] = [
                    { "$expr": { "$regexMatch": { "input": { "$toString": "$mobile" }, "regex": mobileRegex } } },
                    { "$expr": { "$regexMatch": { "input": { "$toString": "$whatsapp" }, "regex": mobileRegex } } }
                ];

                smsFilter["$or"] = [
                    { "$expr": { "$regexMatch": { "input": { "$toString": "$mobile" }, "regex": mobileRegex } } },
                    { "$expr": { "$regexMatch": { "input": { "$toString": "$whatsapp" }, "regex": mobileRegex } } }
                ];
            } else {
                filter["$or"] = [
                    { "name": { "$regex": searchQuery, "$options": "i" } }
                ];
                smsFilter["$or"] = [
                    { "name": { "$regex": searchQuery, "$options": "i" } }
                ];
            }
        }

        const perPage = 20;
        const page = parseInt(data.page, 10) || 1;

        const smsCount = await Candidate.countDocuments(smsFilter);
        const count = await Candidate.countDocuments(filter);

        let { value, order } = req.query;
        let sorting = {};
        if (value && order) {
            sorting[value] = Number(order);
        } else {
            sorting = { createdAt: -1 };
        }

        let agg = candidateServices.adminCandidatesList(sorting, perPage, page, candidateCashbackEventName.cashbackrequestaccepted, { value, order }, filter);
        let candidates = await Candidate.aggregate(agg);

        const totalPages = Math.ceil(count / perPage);

        return res.json({
            candidates,
            perPage,
            totalPages,
            page,
            count
        });

	} catch (err) {
		return res.status(400).json({error: true, message: "Something went wrong"});
	}
});





module.exports = router;
