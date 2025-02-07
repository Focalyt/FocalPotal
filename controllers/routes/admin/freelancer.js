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
const candidate = require("../services/candidate");
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

			const country = await Country.find({});
			const qualification = await Qualification.find({ status: true });
			const university = await University.find({ status: true });
			let formData = {};
			

			return res.render(`${req.vPath}/admin/freelancer/add`, {
				menu: 'addFreelancer',
				university,
				qualification,
				country
				
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


		let filter = { status: true }

		let posts = await Post.find(filter).sort({ createdAt: -1 });

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
		let filters = {
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
			filters["$or"] = [
				{ "name": { "$regex": name, "$options": "i" } },
			]
			smsFilter["$or"] = [
				{ "name": { "$regex": name, "$options": "i" } },
			]
		}
		if (name && !numberCheck) {
			filters["$or"] = [
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
			filters["isProfileCompleted"] = data.Profile == 'true' ? true : false
		}
		if (data.verified) {
			filters["verified"] = data.verified == 'true' ? true : false
		}

		const count = await Candidate.countDocuments(filters)
		let { value, order } = req.query
		let sorting = {}
		if (value && order) {
			sorting[value] = Number(order)
		} else {
			sorting = { createdAt: -1 }
		}
		let agg = candidateServices.adminCandidatesList(sorting, perPage, page, candidateCashbackEventName.cashbackrequestaccepted, { value, order }, filters)
		let candidates = await Candidate.aggregate(agg)
		const totalPages = Math.ceil(count / perPage);


		return res.render(`${req.vPath}/admin/post/allPosts`, {
			menu: 'allposts',
			posts,
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
		console.error("Error:", err);
		return res.status(400).json({ error: true, message: "Something went wrong" });
	}
});

router.patch("/changeStatus", async (req, res) => {
	try {
		const update = { $set: { status: req.body.status } };

		const data = await Post.findByIdAndUpdate(req.body.id, update);

		if (!data) {
			return res.status(500).send({
				status: false,
				message: "Can't update status of this job post",
			});
		}

		return res.status(200).send({ status: true, data: data });
	} catch (err) {
		console.log(err.message);
		req.flash("error", err.message || "Something went wrong!");
		return res.status(500).send({ status: false, message: err.message });
	}
});


router.get('/tags/:postId', async (req, res) => {
	try {
		const post = await Post.findById(req.params.postId);
		if (!post) return res.status(404).json({ message: 'Post not found' });
		res.json(post.tags);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
});

router.post('/edit', async (req, res) => {
	try {
		const { id, content, tags } = req.body;
		const tagsData = JSON.parse(tags);

		const tagsArray = tagsData.map((tag, index) => ({
			userId: tag._id,
			name: tag.name,
			userType: tag.userType
		}));

		const updateData = {
			content,
			tags: tagsArray
		};

		if (req.files?.length) {
			const fileData = await Promise.all(req.files.map(async file => {
				// Your existing file upload logic
				return {
					fileType: file.mimetype.startsWith('image/') ? 'image' : 'video',
					fileURL: uploadedFileUrl // From your upload logic
				};
			}));
			updateData.files = fileData;
		}

		const updatedPost = await Post.findByIdAndUpdate(
			id,
			updateData,
			{ new: true }
		);

		res.json(updatedPost);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
});






module.exports = router;
