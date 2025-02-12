const express = require("express");
const { isCollege, auth1, authenti } = require("../../../helpers");
const { extraEdgeAuthToken, extraEdgeUrl, env, baseUrl } = require("../../../config");
const axios = require("axios")
const { ObjectId } = require('mongoose').Types.ObjectId;
const puppeteer = require("puppeteer");
const { CollegeValidators } = require('../../../helpers/validators')
const { User, College, State, University, City, Qualification, Industry, Vacancy, CandidateImport,
	Skill, CollegeDocuments, Candidate, SubQualification, Import, CoinsAlgo, AppliedJobs, HiringStatus, Company } = require("../../models");
const bcrypt = require("bcryptjs");
let fs = require("fs");
let path = require("path");
const candidateRoutes = require("./candidate");
const skillTestRoutes = require("./skillTest");
const careerObjectiveRoutes = require("../college/careerObjective");
const todoRoutes = require("./todo");
const smsRoutes = require("./sms");
const coverLetterRoutes = require("./coverLetter");
const mockInterviewRoutes = require("./mockInterview");
const router = express.Router();
const moment = require('moment')
router.use("/todo", isCollege, todoRoutes);
router.use("/sms", isCollege, smsRoutes);
router.use("/candidate", isCollege, candidateRoutes);
router.use("/skillTest", isCollege, skillTestRoutes);
router.use("/careerObjective", isCollege, careerObjectiveRoutes);
// router.use(isCollege);
router.use("/coverLetter", isCollege, coverLetterRoutes);
router.use("/mockInterview", isCollege, mockInterviewRoutes);
const readXlsxFile = require("read-excel-file/node");

router.route('/')
	.get(async (req, res) => {
		let user = req.session.user
		if (!user) {
			res.redirect("/college/login");
		}
		else {
			res.redirect("/college/dashboard");
		}
	})

router.get("/login", async (req, res) => {
	res.render(`${req.vPath}/app/college/login`);
});

router.route("/register")
	.get(async (req, res) => {
		res.render(`${req.vPath}/app/college/register`);
	})
	.post(async (req, res) => {
		try {
			const { collegeName, concernedPerson, email, mobile,type,password,confirmPassword } = req.body;
			const hashPass = await bcrypt.hash(password, 10);
			const hashConPass = await bcrypt.hash(confirmPassword, 10);

			const { value, error } = await CollegeValidators.register({ collegeName, concernedPerson, email, mobile })
			if (error) {
				console.log('====== register error ', error, value)
				return res.send({ status: "failure", error: "Something went wrong!" });
			}
			let checkEmail = await User.findOne({
				email: email,
				isDeleted: false,
				role: 2,
			});
			let checkNumber = await User.findOne({
				mobile,
				isDeleted: false,
				role: 2,
			});
			if (checkNumber || checkEmail) {
				return res.send({
					status: "failure",
					error: "Number Or Email already exists!",
				});
			}

			if (!checkEmail && !checkNumber) {
				const user = await User.create({
					name: concernedPerson,
					email,
					mobile,
					role: 2,
				});
				if (!user) {
					return res.send({
						status: "failure",
						error: "College user not created!",
					});
				}
				let college = await College.create({
					_concernPerson: user._id,
					name: collegeName,
					type:type,
					password:hashPass,
					confirmPassword:hashConPass
				});
				if (!college) {
					return res.send({ status: "failure", error: "College not created!" });
				}

				return res.send({
					status: "success",
					message: "College registered successfully",
				});
			}
		} catch (err) {
			console.log('====================>!err ', err)
			req.flash("error", err.message || "Something went wrong!");
			return res.send({ status: "failure", error: "Something went wrong!" });
		}
	});

router.route('/dashboard').get(isCollege, async (req, res) => {
	let college = await College.findOne({ _id: req.session.user.collegeId, status: true })

	let totalShortlisted
	let monthShortlisted
	let weekShortlisted
	let dayShortlisted
	let totalHired
	let monthHired
	let weekHired
	let dayHired
	let totalAppliedJobs
	let monthAppliedJobs
	let weekAppliedJobs
	let dayAppliedJobs
	let totalCandidates
	let monthCandidates
	let weekCandidates
	let dayCandidates
	if (college.place) {
		// Candidates

		// signups
		totalCandidates = await Candidate.find({ status: true, qualifications: { $elemMatch: { collegePlace: college.place } } }).countDocuments()
		monthCandidates = await Candidate.find({
			status: true, qualifications: { $elemMatch: { collegePlace: college.place } },
			createdAt: {
				$gte: moment().utcOffset('+05:30').startOf('month').toDate(),
				$lte: moment().utcOffset('+05:30').endOf('month').toDate()
			}
		}
		).countDocuments()
		weekCandidates = await Candidate.find({
			status: true, qualifications: { $elemMatch: { collegePlace: college.place } },
			createdAt: {
				$gte: moment().utcOffset('+05:30').startOf('week').toDate(),
				$lte: moment().utcOffset('+05:30').endOf('week').toDate()
			}
		}
		).countDocuments()
		dayCandidates = await Candidate.find({
			status: true, qualifications: { $elemMatch: { collegePlace: college.place } },
			createdAt: {
				$gte: moment().utcOffset('+05:30').startOf('day').toDate(),
				$lte: moment().utcOffset('+05:30').endOf('day').toDate()
			}
		}
		).countDocuments()



		// Shortlisted
		totalShortlisted = await HiringStatus.aggregate([
			{ $match: { status: { '$ne': 'rejected' }, isDeleted: false } },
			{
				$lookup: {
					from: 'companies',
					localField: 'company',
					foreignField: '_id',
					as: 'company'
				}
			},
			{ $match: { 'company.0.status': true, 'company.0.isDeleted': false } },
			{
				$lookup: {
					from: 'candidates',
					localField: 'candidate',
					foreignField: '_id',
					as: 'candidate'
				}
			},

			{
				$unwind: {
					path: '$candidate.0.qualifications',
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$match: {
					'candidate.0.qualifications.collegePlace': college.place
				}
			}
		])
		monthShortlisted = await HiringStatus.aggregate([
			{
				$match: {
					status: { '$ne': 'rejected' }, createdAt: {
						$gte: moment().utcOffset('+05:30').startOf('month').toDate(),
						$lte: moment().utcOffset('+05:30').endOf('month').toDate()
					}, isDeleted: false
				}
			},
			{
				$lookup: {
					from: 'companies',
					localField: 'company',
					foreignField: '_id',
					as: 'company'
				}
			},
			{ $match: { 'company.0.status': true, 'company.0.isDeleted': false } },
			{
				$lookup: {
					from: 'candidates',
					localField: 'candidate',
					foreignField: '_id',
					as: 'candidate'
				}
			},

			{
				$unwind: {
					path: '$candidate.0.qualifications',
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$match: {
					'candidate.0.qualifications.collegePlace': college.place
				}
			}

		])
		weekShortlisted = await HiringStatus.aggregate([
			{
				$match: {
					status: { '$ne': 'rejected' }, createdAt: {
						$gte: moment().utcOffset('+05:30').startOf('week').toDate(),
						$lte: moment().utcOffset('+05:30').endOf('week').toDate()
					}, isDeleted: false
				}
			},
			{
				$lookup: {
					from: 'companies',
					localField: 'company',
					foreignField: '_id',
					as: 'company'
				}
			},
			{ $match: { 'company.0.status': true, 'company.0.isDeleted': false } },
			{
				$lookup: {
					from: 'candidates',
					localField: 'candidate',
					foreignField: '_id',
					as: 'candidate'
				}
			},

			{
				$unwind: {
					path: '$candidate.0.qualifications',
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$match: {
					'candidate.0.qualifications.collegePlace': college.place
				}
			}

		])
		dayShortlisted = await HiringStatus.aggregate([
			{
				$match: {
					status: { '$ne': 'rejected' }, createdAt: {
						$gte: moment().utcOffset('+05:30').startOf('day').toDate(),
						$lte: moment().utcOffset('+05:30').endOf('day').toDate()
					}, isDeleted: false
				}
			},
			{
				$lookup: {
					from: 'companies',
					localField: 'company',
					foreignField: '_id',
					as: 'company'
				}
			},
			{ $match: { 'company.0.status': true, 'company.0.isDeleted': false } },
			{
				$lookup: {
					from: 'candidates',
					localField: 'candidate',
					foreignField: '_id',
					as: 'candidate'
				}
			},

			{
				$unwind: {
					path: '$candidate.0.qualifications',
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$match: {
					'candidate.0.qualifications.collegePlace': college.place
				}
			}

		])


		// Hired

		totalHired = await HiringStatus.aggregate([
			{ $match: { status: 'hired', isDeleted: false } },
			{
				$lookup: {
					from: 'companies',
					localField: 'company',
					foreignField: '_id',
					as: 'company'
				}
			},
			{ $match: { 'company.0.status': true, 'company.0.isDeleted': false } },
			{
				$lookup: {
					from: 'candidates',
					localField: 'candidate',
					foreignField: '_id',
					as: 'candidate'
				}
			},

			{
				$unwind: {
					path: '$candidate.0.qualifications',
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$match: {
					'candidate.0.qualifications.collegePlace': college.place
				}
			}
		])
		monthHired = await HiringStatus.aggregate([
			{
				$match: {
					status: 'hired', createdAt: {
						$gte: moment().utcOffset('+05:30').startOf('month').toDate(),
						$lte: moment().utcOffset('+05:30').endOf('month').toDate()
					}, isDeleted: false
				}
			},
			{
				$lookup: {
					from: 'companies',
					localField: 'company',
					foreignField: '_id',
					as: 'company'
				}
			},
			{ $match: { 'company.0.status': true, 'company.0.isDeleted': false } },
			{
				$lookup: {
					from: 'candidates',
					localField: 'candidate',
					foreignField: '_id',
					as: 'candidate'
				}
			},

			{
				$unwind: {
					path: '$candidate.0.qualifications',
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$match: {
					'candidate.0.qualifications.collegePlace': college.place
				}
			}

		])
		weekHired = await HiringStatus.aggregate([
			{
				$match: {
					status: 'hired', createdAt: {
						$gte: moment().utcOffset('+05:30').startOf('week').toDate(),
						$lte: moment().utcOffset('+05:30').endOf('week').toDate()
					}, isDeleted: false
				}
			},
			{
				$lookup: {
					from: 'companies',
					localField: 'company',
					foreignField: '_id',
					as: 'company'
				}
			},
			{ $match: { 'company.0.status': true, 'company.0.isDeleted': false } },
			{
				$lookup: {
					from: 'candidates',
					localField: 'candidate',
					foreignField: '_id',
					as: 'candidate'
				}
			},

			{
				$unwind: {
					path: '$candidate.0.qualifications',
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$match: {
					'candidate.0.qualifications.collegePlace': college.place
				}
			}

		])
		dayHired = await HiringStatus.aggregate([
			{
				$match: {
					status: 'hired', createdAt: {
						$gte: moment().utcOffset('+05:30').startOf('day').toDate(),
						$lte: moment().utcOffset('+05:30').endOf('day').toDate()
					}, isDeleted: false
				}
			},
			{
				$lookup: {
					from: 'companies',
					localField: 'company',
					foreignField: '_id',
					as: 'company'
				}
			},
			{ $match: { 'company.0.status': true, 'company.0.isDeleted': false } },
			{
				$lookup: {
					from: 'candidates',
					localField: 'candidate',
					foreignField: '_id',
					as: 'candidate'
				}
			},

			{
				$unwind: {
					path: '$candidate.0.qualifications',
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$match: {
					'candidate.0.qualifications.collegePlace': college.place
				}
			}

		])


		//applied jobs
		totalAppliedJobs = await AppliedJobs.aggregate([
			{
				$lookup: {
					from: 'companies',
					localField: '_company',
					foreignField: '_id',
					as: 'company'
				}
			},
			{ $match: { 'company.0.status': true, 'company.0.isDeleted': false } },
			{
				$lookup: {
					from: 'candidates',
					localField: '_candidate',
					foreignField: '_id',
					as: 'candidate'
				}
			},
			{
				$unwind: {
					path: '$candidate.0.qualifications',
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$match: {
					'candidate.0.qualifications.collegePlace': college.place
				}
			}
		])
		monthAppliedJobs = await AppliedJobs.aggregate([
			{
				$match: {
					createdAt: {
						$gte: moment().utcOffset('+05:30').startOf('month').toDate(),
						$lte: moment().utcOffset('+05:30').endOf('month').toDate()
					}
				}
			},
			{
				$lookup: {
					from: 'companies',
					localField: '_company',
					foreignField: '_id',
					as: 'company'
				}
			},
			{ $match: { 'company.0.status': true, 'company.0.isDeleted': false } },
			{
				$lookup: {
					from: 'candidates',
					localField: '_candidate',
					foreignField: '_id',
					as: 'candidate'
				}
			},
			{
				$unwind: {
					path: '$candidate.0.qualifications',
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$match: {
					'candidate.0.qualifications.collegePlace': college.place
				}
			}
		])
		weekAppliedJobs = await AppliedJobs.aggregate([
			{
				$match: {
					createdAt: {
						$gte: moment().utcOffset('+05:30').startOf('week').toDate(),
						$lte: moment().utcOffset('+05:30').endOf('week').toDate()
					}
				}
			},
			{
				$lookup: {
					from: 'companies',
					localField: '_company',
					foreignField: '_id',
					as: 'company'
				}
			},
			{ $match: { 'company.0.status': true, 'company.0.isDeleted': false } },
			{
				$lookup: {
					from: 'candidates',
					localField: '_candidate',
					foreignField: '_id',
					as: 'candidate'
				}
			},

			{
				$unwind: {
					path: '$candidate.0.qualifications',
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$match: {
					'candidate.0.qualifications.collegePlace': college.place
				}
			}
		])
		dayAppliedJobs = await AppliedJobs.aggregate([
			{
				$match: {
					createdAt: {
						$gte: moment().utcOffset('+05:30').startOf('day').toDate(),
						$lte: moment().utcOffset('+05:30').endOf('day').toDate()
					}
				}
			},
			{
				$lookup: {
					from: 'companies',
					localField: '_company',
					foreignField: '_id',
					as: 'company'
				}
			},
			{ $match: { 'company.0.status': true, 'company.0.isDeleted': false } },
			{
				$lookup: {
					from: 'candidates',
					localField: '_candidate',
					foreignField: '_id',
					as: 'candidate'
				}
			},

			{
				$unwind: {
					path: '$candidate.0.qualifications',
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$match: {
					'candidate.0.qualifications.collegePlace': college.place
				}
			}

		])
	} else {
		totalShortlisted = []
		monthShortlisted = []
		weekShortlisted = []
		dayShortlisted = []
		totalHired = []
		monthHired = []
		weekHired = []
		dayHired = []
		totalAppliedJobs = []
		monthAppliedJobs = []
		weekAppliedJobs = []
		dayAppliedJobs = []
		totalCandidates = 0
		monthCandidates = 0
		weekCandidates = 0
		dayCandidates = 0
	}

	// Company
	// signups
	const totalCompanies = await Company.find({ status: true }).countDocuments()
	const monthCompanies = await Company.find({
		status: true, createdAt: {
			$gte: moment().utcOffset('+05:30').startOf('month').toDate(),
			$lte: moment().utcOffset('+05:30').endOf('month').toDate()
		}
	}
	).countDocuments()
	const weekCompanies = await Company.find({
		status: true, createdAt: {
			$gte: moment().utcOffset('+05:30').startOf('week').toDate(),
			$lte: moment().utcOffset('+05:30').endOf('week').toDate()
		}
	}
	).countDocuments()
	const dayCompanies = await Company.find({
		status: true, createdAt: {
			$gte: moment().utcOffset('+05:30').startOf('day').toDate(),
			$lte: moment().utcOffset('+05:30').endOf('day').toDate()
		}
	}
	).countDocuments()
	// jobs
	const totalJobs = await Vacancy.find({ status: true }).countDocuments()
	const dayJobs = await Vacancy.find({
		status: true, createdAt: {
			$gte: moment().utcOffset('+05:30').startOf('day').toDate(),
			$lte: moment().utcOffset('+05:30').endOf('day').toDate()
		}
	})
		.countDocuments()
	const weekJobs = await Vacancy.find({
		status: true, createdAt: {
			$gte: moment().utcOffset('+05:30').startOf('week').toDate(),
			$lte: moment().utcOffset('+05:30').endOf('week').toDate()
		}
	})
		.countDocuments()
	const monthJobs = await Vacancy.find({
		status: true, createdAt: {
			$gte: moment().utcOffset('+05:30').startOf('month').toDate(),
			$lte: moment().utcOffset('+05:30').endOf('month').toDate()
		}
	})
		.countDocuments()


	res.render(`${req.vPath}/app/college/dashboard`, {
		menu: 'dashboard',
		totalCandidates, dayCandidates, weekCandidates, monthCandidates,
		dayCompanies, weekCompanies, monthCompanies, totalCompanies,
		totalJobs, dayJobs, weekJobs, monthJobs,
		totalShortlisted: totalShortlisted.length,
		dayShortlisted: dayShortlisted.length,
		weekShortlisted: weekShortlisted.length,
		monthShortlisted: monthShortlisted.length,
		totalHired: totalHired.length,
		dayHired: dayHired.length,
		weekHired: weekHired.length,
		monthHired: monthHired.length,
		totalAppliedJobs: totalAppliedJobs.length,
		monthAppliedJobs: monthAppliedJobs.length,
		weekAppliedJobs: weekAppliedJobs.length,
		dayAppliedJobs: dayAppliedJobs.length
	});
})

router.route("/myprofile")
	.get(isCollege, async (req, res) => {
		let college = await College.findOne({ _id: req.session.user.collegeId, status: true })
			.populate([{
				path: "_concernPerson",
				select: "name designation email mobile"
			}])

		const state = await State.find({
			countryId: "101",
			status: { $ne: false },
		});

		let hasState = false;
		let st = {};
		if (college.stateId && isObjectIdValid(college.stateId)) {
			hasState = true;
			st = await State.findOne({ _id: college.stateId, status: { $ne: false } });
		} else {
			hasState = false;
		}
		const city = hasState
			? await City.find({ stateId: st.stateId, status: { $ne: false } })
			: [];
		let university = await University.find({ status: true }, "name")
		res.render(`${req.vPath}/app/college/myprofile`, { menu: 'myprofile', college, state, city, university });
	})
	.post(authenti, isCollege, async (req, res) => {
		try {
			const { collegeInfo, concernedPerson, representativeInfo } = req.body;
			const college = await College.findOne({
				_id: req.session.user.collegeId,
			});

			if (!college) throw req.ykError("College doesn't exist!");
			const userUpdatedFields = {};
			if (concernedPerson) {
				Object.keys(concernedPerson).forEach((key) => {
					if (concernedPerson[key] !== "") {
						userUpdatedFields[key] = concernedPerson[key];
					}
				});
			}

			const userUpdate = await User.findOneAndUpdate(
				{ _id: req.session.user._id, role: "2" },
				userUpdatedFields
			);

			if (!userUpdate) throw req.ykError("User not updated!");

			const updatedFields = { isProfileCompleted: true };
			if (representativeInfo && representativeInfo.length > 0) {
				updatedFields["collegeRepresentatives"] = representativeInfo;
			}

			if (collegeInfo) {
				Object.keys(collegeInfo).forEach((key) => {
					if (req.body.collegeInfo[key] !== "") {
						updatedFields[key] = collegeInfo[key];
					}
				});
			}

			const collegeUpdate = await College.findOneAndUpdate(
				{ _id: req.session.user.collegeId },
				updatedFields,
				{ new: true }
			).populate({ path: '_concernPerson' }); console.log(collegeUpdate)

			if (!collegeUpdate) throw req.ykError("Candidate not updated!");
			req.flash("success", "Company updated successfully!");
			res.send({ status: 200, message: "Profile Updated Successfully" });
		} catch (err) {
			console.log('====================>!err ', err)
			req.flash("error", err.message || "Something went wrong!");
			return res.send({ status: "failure", error: "Something went wrong!" });
		}
	});

router.get('/availablejobs', [isCollege], async (req, res) => {
	try {
		const data = req.query
		const { qualification, experience, industry, state, jobType, minSalary, techSkills } = req.query
		const populate = [
			{
				path: "_qualification",
				select: ["name"]
			},
			{ path: "_industry" },
			{ path: "city" },
			{ path: "state" },
			{ path: "_company" },
			{ path: "_techSkills" }
		]
		let filter = { status: true, validity: { $gte: moment().utcOffset('+05:30') } }
		if (qualification) {
			filter._qualification = qualification
		}
		if (industry) {
			filter._industry = industry
		}
		if (state) {
			filter.state = state
		}
		if (jobType) {
			filter.jobType = jobType
		}
		if (experience) {
			experience == "0"
				? (filter["$or"] = [
					{ experience: { $gte: experience } },
				])
				: (filter["experience"] = { $gte: experience });
		}
		if (techSkills) {
			filter._techSkills = techSkills
		}
		if (minSalary) {
			filter["$or"] = [{ isFixed: true, amount: { $gte: minSalary } }, { isFixed: false, min: { $gte: minSalary } }]
		}
		const allQualification = await Qualification.find({ status: true }).sort({ basic: -1 })
		const allIndustry = await Industry.find({ status: true })
		const allStates = await State.find({ countryId: '101', status: { $ne: false } })
		const allJobs = await Vacancy.find(filter).populate(populate)
		let jobs = allJobs.filter(job => job._company?.isDeleted === false && job._company?.status === true)
		let skills = await Skill.find({ status: true })
		res.render(`${req.vPath}/app/college/searchjob`, { menu: 'Jobs', jobs, allQualification, allIndustry, allStates, data, skills })
	} catch (err) {
		console.log('===============> err', err)
		req.flash("error", err.message || "Something went wrong!");
		return res.redirect("back");
	}
})
router.get('/job/:jobId', [isCollege], async (req, res) => {
	try {
		const jobId = req.params.jobId
		const populate = [
			{ path: "_qualification" },
			{ path: "_industry" },
			{ path: "city" },
			{ path: "state" },
			{ path: "_jobCategory" },
			{ path: "_company", populate: "_concernPerson" },
			{ path: "_techSkills" },
			{ path: "_nonTechSkills" }
		]
		const jobDetails = await Vacancy.findById(jobId).populate(populate)
		const stateId = jobDetails._company.stateId
		const state = await State.findOne({ _id: stateId })
		const cityId = jobDetails._company.cityId
		const city = await City.findOne({ _id: cityId })

		res.render(`${req.vPath}/app/college/viewjob`, { menu: 'Jobs', jobDetails, state, city })
	} catch (err) {
		console.log('===============> err ', err)
		req.flash("error", err.message || "Something went wrong!");
		return res.redirect("back");
	}
})

router.post('/uploadfiles', [isCollege], async (req, res) => {
	try {
		let files = req.files;
		if (req.files == undefined) {
			req.flash("error", "Please select file ");
			return res.redirect("/college/uploadCandidates");
		}
		var data1 = req.files.filename;
		if (!req.files.filename) {
			req.flash("error", "Please select file ");
			return res.redirect("/college/uploadCandidates");
		}
		const college = await College.findOne({ _concernPerson: req.session.user._id, status: true, isDeleted: false })
		if (!college) {
			req.flash("error", "College not found");
			return res.redirect("/college/uploadCandidates");

		}
		if (!(college.place && college.longitude && college.latitude)) {
			req.flash("error", "Complete Your Profile")
			return res.redirect("/college/uploadCandidates");
		}
		var checkFileError = true;
		let extension = req.files.filename.name.split(".").pop();
		console.log(extension, " -- Extension --");
		if (extension !== "ods" && extension !== "xlsx" && extension !== "xls" && extension !== "xl") {
			console.log("upload excel file only");
			req.flash("error", "Excel format not matched.");
			return res.redirect("/college/uploadCandidates");
		}
		filename = new Date().getTime() + "_" + data1.name;
		const write = await fs.promises.writeFile("public/" + filename, data1.data)
			.then(() => console.log("********* File Upload successfully!"))
			.catch((err) => {
				console.log(err.message)
				return res.redirect("/college/uploadCandidates");
			});
		let errorMessages = []
		console.log(__dirname, "../../../public/" + filename)
		await readXlsxFile(
			path.join(__dirname, "../../../public/" + filename)
		).then((rows) => {
			console.log(rows[0])
			if (
				rows[0][0] !== 'name' ||
				rows[0][1] !== 'email' ||
				rows[0][2] !== 'mobile' ||
				rows[0][3] !== 'whatsapp' ||
				rows[0][4] !== 'dob' ||
				rows[0][5] !== 'state' ||
				rows[0][6] !== 'city' ||
				rows[0][7] !== 'sex' ||
				rows[0][8] !== 'pincode' ||
				rows[0][9] !== 'highestQualifcation' ||
				rows[0][10] !== 'address' ||
				rows[0][11] !== 'Experienced' ||
				rows[0][12] !== 'PassingYear' ||
				rows[0][13] !== 'Qualifications' ||
				rows[0][14] !== 'subQualification'
			) {
				checkFileError = false;
			} else {
				checkFileError = true;
			}

		}).catch(err => {
			console.log('readClsxFile error========>>>>>>', err.message)
			req.flash("error", "Caught error while reading file.");
			return res.redirect("/college/uploadCandidates");
		})

		if (checkFileError == false) {
			req.flash("error", "Please upload right pattern file");
			return res.redirect("/college/uploadCandidates");
		} else {
			let allRows = []
			await readXlsxFile(
				path.join(__dirname, "../../../public/" + filename)
			).then(async (rowsList) => {
				rowsList.shift();
				for (let [index, rows] of rowsList.entries()) {
					let message = "";
					qualification
					let highestQualification = "";
					let cityId = "";
					let stateId = "";
					let name
					if (rows[0]) {
						name = rows[0]
					} else {
						message = `Name `
					};
					let email
					if (rows[1]) {
						email = rows[1]
					}

					let mobile = rows[2] ? rows[2] : '';
					if (mobile === '') {
						message += `mobile `
					}

					let whatsapp = rows[3] ? rows[3] : '';
					let dob = rows[4] ? rows[4] : "";
					if (dob === '') {
						message += `dob `
					}

					if (rows[5] != null && rows[5] != '') {
						var state = await State.findOne({
							name: rows[5], status: { $ne: false }
						});
						stateId = state ? state._id : '';
						if (stateId === '') {
							message += `State(invalid) `
						}
					}
					if (stateId === '') {
						message += `State `
					}

					if (rows[6] != null && rows[6] != '') {
						let city = await City.findOne({
							name: rows[6], status: { $ne: false }
						});
						cityId = city ? city._id : '';
						if (cityId === '') {
							message += `City(invalid) `
						}
					}

					if (cityId === '') {
						message += `City `
					}

					let sex = rows[7] ? rows[7] : "";

					if (sex === '') {
						message += `sex `
					}

					let pincode = rows[8] ? rows[8] : "";

					if (pincode === '') {
						message += `pincode `
					}

					if (rows[9] != null) {
						var qualification = await Qualification.findOne({ name: { $regex: new RegExp(rows[9], "i") } });
						highestQualification = qualification ? qualification._id : '';
						if (highestQualification === '') {
							message += `highestQualification(invalid) `
						}
					}

					if (highestQualification === '') {
						message += `highestQualification `
					}

					let address = rows[10] ? rows[10] : "";
					if (address === '') {
						message += `address `
					}
					let isExperienced = rows[11] === 'Experienced' ? true : false

					let PassingYear = rows[12] ? rows[12] : "";

					if (PassingYear === '') {
						message += `PassingYear `
					}
					if (rows[13] != null) {
						var qualification = await Qualification.findOne({ name: { $regex: new RegExp(rows[13], "i") } });
						Qualifications = qualification ? qualification._id : '';
						if (Qualifications === '') {
							message += `Qualifications(invalid) `
						}
					}

					if (Qualifications === '') {
						message += `Qualifications `
					}

					if (rows[14] != null) {
						var qualification = await SubQualification.findOne({ name: { $regex: new RegExp(rows[14], "i") } });
						subQualification = qualification ? qualification._id : '';
						if (subQualification === '') {
							message += `subQualification(invalid) `
						}
					}

					if (subQualification === '') {
						message += `subQualification `
					}
					if (message) {
						message += ` not populated for the row ${index + 1}`
						errorMessages.push(message)
						continue;
					}

					let isExistUser = await User.findOne({
						mobile,
						role: 3,
					});
					if (isExistUser) {
						console.log('===> User exists')
						errorMessages.push(`User with mobile ${mobile} already exists for row ${index + 1}.`)
						continue;
					}

					let isExistCandidate = await Candidate.findOne({
						mobile
					});

					if (isExistCandidate) {
						console.log('==> isExistCandidate exists')
						errorMessages.push(`Candidate with mobile ${mobile} already exists for row ${index + 1}.`)
						continue;
					}

					let dup = allRows.find(can => can.mobile.toString() === mobile.toString())

					if (!isExistUser && !isExistCandidate && !dup) {
						allRows.push({ mobile, email })
						const user = await User.create({
							name,
							mobile,
							role: 3,
							isImported: true
						});

						if (!user) {
							errorMessages.push(`User not created for row ${index + 1}.`)
							continue;
						}

						const coins = await CoinsAlgo.findOne()
						let cityData = await City.findOne({ _id: cityId, status: { $ne: false } }).select({ location: 1, _id: 0 })
						let obj = cityData.toObject()
						let addCandidate = {
							isImported: true,
							isProfileCompleted: true,
							availableCredit: coins.candidateCoins,
							creditLeft: coins.candidateCoins,
							location: obj.location
						};
						let qual = {}
						if (name) { addCandidate['name'] = name }
						if (mobile) {
							addCandidate['mobile'] = mobile
							addCandidate['whatsapp'] = whatsapp || mobile
						}
						if (email) { addCandidate['email'] = email }
						if (highestQualification) { addCandidate['highestQualification'] = highestQualification }
						if (stateId) { addCandidate['state'] = stateId }
						if (cityId) { addCandidate['city'] = cityId }
						if (address) { addCandidate['address'] = address }
						if (dob) { addCandidate['dob'] = dob }
						if (sex) { addCandidate['sex'] = sex }
						if (pincode) { addCandidate['pincode'] = pincode }
						if (isExperienced) { addCandidate['isExperienced'] = isExperienced }
						if (PassingYear) { qual['PassingYear'] = PassingYear }
						if (Qualifications) { qual['Qualification'] = Qualifications }
						if (subQualification) { qual['subQualification'] = subQualification }
						let loc = {}
						loc["type"] = 'Point'
						loc["coordinates"] = [college.longitude, college.latitude]
						qual['location'] = loc
						qual['collegePlace'] = college.place

						addCandidate['qualifications'] = qual
						console.log(addCandidate)
						const candidate = await Candidate.create(addCandidate)
						if (!candidate) {
							console.log(addCandidate, "candidate not created", "row number is =>>>>>>>", recordCount)
							errorMessages.push(`Candidate not created for row ${index + 1}.`)
							continue;
						}
						// else{
						// 	let city = await City.findOne({_id:cityId}).select("name")
						// 	let state = await State.findOne({_id:stateId}).select("name")
						//  if(env.toLowerCase()==='production'){
						// 	 let dataFormat = {
						// 		Source: "mipie",
						// 		FirstName: name,
						// 		MobileNumber:mobile,
						// 		LeadSource: "Website",
						// 		LeadType:"Online",
						// 		LeadName: "app",
						// 		Course:"Mipie general",
						// 		Center:"Padget",
						// 		Location:"Technician",
						// 		Country: "India",
						// 		LeadStatus: "Signed Up",
						// 		ReasonCode:"27" ,
						// 		City: city.name,
						// 		State: state.name
						// 	  }
						// 	  let edgeBody = JSON.stringify(dataFormat)
						// 	  let header = { 'AuthToken': extraEdgeAuthToken, "Content-Type": "multipart/form-data" }
						// 	  let extraEdge = await axios.post(extraEdgeUrl,edgeBody,header).then(res=>{
						// 		console.log(res.data)
						// 	  }).catch(err=>{
						// 		console.log(err, "Couldn't send data in extraEdge","row number is ===>",recordCount)
						// 	    errorMessages.push(`Falied to send data in Extra edge for row ${index + 1}.`)
						// 	  })
						//  }
						// }
					} else {
						errorMessages.push(`Candidate/User with mobile ${mobile} already exists for row ${index + 1}.`)
					}
				}
				var imports = {
					name: req.files.filename.name,
					message: errorMessages.length <= 0 ? "success" : errorMessages.join('</br>'),
					status: "Completed",
					record: allRows.length
				};
				console.log(
					"--------------------- REcord INSERTED ---------------------------"
				);
				console.log(imports);
				await CandidateImport.create(imports);
				console.log('========================> allRows ', allRows.length)
				await fs.promises.unlink("public/" + filename).then(() => {
					return res.redirect("/college/uploadCandidates");
				})
					.catch(async (err) => {
						console.log(err)
						await fs.promises.unlink("public/" + filename).then(() => {
							return res.redirect("/college/uploadCandidates");
						})
					});
			})
		}
	} catch (err) {
		console.log(err)
		req.flash("error", err.message || "Something went wrong!");
		return res.redirect("back");
	}
})

router.get("/uploadcandidates", async (req, res) => {
	const ipAddress = req.header('x-forwarded-for') || req.socket.remoteAddress;
	console.log('======================> 1', ipAddress, req.session.user)
		
	if (req.session && req.session.user && req.session.user._id) {
		const perPage = 5;
		const p = parseInt(req.query.page, 10);
		const page = p || 1;

		let imports = await CandidateImport.find({ status: "Completed" })
			.sort({ createdAt: -1 }).skip(perPage * page - perPage).limit(perPage)

		let count = await CandidateImport.countDocuments()
		const totalPages = Math.ceil(count / perPage);
		const college = await College.findOne({ _concernPerson: req.session.user._id, status: true, isDeleted: false })
		if (!college) {
			return res.status(400).send({ status: false, message: "College not found" })
		}

		res.render(`${req.vPath}/app/college/uploadcandidates`, { menu: 'upload', perPage, totalPages, page, imports, isProfileCompleted: college.isProfileCompleted });
	} else {
		return res.status(401).send({ status: false, message: "Unauthorized" })
	}
});
router.post("/removeDocument", async (req, res) => {
	try {
		const { id } = req.body;
		await CollegeDocuments.deleteOne({ _id: ObjectId(id) })
		return res.status(200).send({ status: true });
	} catch (err) {
		req.flash("error", err.message || "Something went wrong!");
		return res.redirect("back");
	}
});

//change password
router
	.route("/changepassword2")
	.get(auth1, async (req, res) => {
		rePath = res.render(`${req.vPath}/college/setting/changePass`);
		// rePath = res.render(`${req.vPath}/front/login`);
		return rePath;
	})
	.post(auth1, async (req, res) => {
		try {
			const newpassword = req.body.newpassword;
			const oldpassword = req.body.oldpassword;
			const confirmpassword = req.body.confirmpassword;
			if (newpassword !== confirmpassword)
				throw req.ykError("Passwords must be matched ");

			const userData = await User.findOne({ _id: req.session.user._id });
			if (!userData) throw req.ykError("User not found!");

			if (!bcrypt.compareSync(oldpassword, userData.password)) {
				throw req.ykError("Old password is incorrect!");
			}

			const user = bcrypt.hash(newpassword, 10, async function (err, hash) {
				const user = await User.findByIdAndUpdate(
					{ _id: userData._id },
					{
						password: hash,
					}
				);
				if (!user) throw req.ykError("user not matched!");
				req.flash("success", "Password has been changed!");
				req.session.user = null;
				return res.redirect("/admin/login");
			});
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});

//edit profile
router
	.route("/editprofile2")
	.get(auth1, async (req, res) => {
		var user = req.session.user;
		rePath = res.render(`${req.vPath}/college/setting/editProfile`, {
			user,
		});
		// rePath = res.render(`${req.vPath}/front/login`);
		return rePath;
	})
	.post(auth1, async (req, res) => {
		try {
			const email = req.body.email;
			const name = req.body.name;
			var id = req.session.user._id;
			console.log(email, name, id);

			var userData = await User.findOne({ email: email });
			if (!userData)
				throw req.ykError("This email is already registered with us");
			var userData = await User.findByIdAndUpdate(
				{ _id: id },
				{
					// email: email,
					name: name,
				},
				{
					new: true,
				}
			);

			req.flash("success", "Profile updated successfullly");
			req.session.user = userData;
			return res.redirect("back");
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});

function isObjectIdValid(id) {
	return ObjectId.isValid(id) && new ObjectId(id) == id;
}
router.route("/candidate/:id").get(async (req, res) => {
	try {

		let menu = 'myStudents';
		let user = req.session.user;
		const populate = [
			{
				path: "techSkills.id",
				select: "name",
			},
			{
				path: "nonTechSkills.id",
				select: "name",
			},
			{
				path: "experiences.Industry_Name",
				select: "name",
			},
			{
				path: "experiences.SubIndustry_Name",
				select: "name",
			},
			{
				path: "qualifications.Qualification",
				select: "name",
			},
			{
				path: "qualifications.subQualification",
				select: "name",
			},
			{
				path: "qualifications.University",
				select: "name",
			},
			{ path: "locationPreferences.state", select: ["name"] },
			{ path: "locationPreferences.city", select: ["name"] },
			{ path: "state", select: ["name", "stateId"] },
			{ path: "city", select: ["name"] },
		];
		const candidate = await Candidate.findOne({
			_id: req.params.id,
		})
			.populate(populate);

		if (!candidate) {
			req.flash("error", "Candidate not found !");
			return res.redirect("back");
		}

		const qualification = await Qualification.find({ status: true }).sort({ basic: -1 })
		res.render(`${req.vPath}/app/college/studentProfile`, {
			candidate,
			qualification,
			menu
		});
	} catch (err) {
		console.log(err);
		return res.status(500).send({ status: false, message: err })
	}
})
router.route("/myStudents")
	.get(isCollege, async (req, res) => {
		try {
			let menu = 'myStudents';
			let user = req.session.user;


			const college = await College.findOne(
				{
					_concernPerson: user._id,
					status: true,
					isDeleted: false,
					place: { $exists: true }
				});
			const qualification = await Qualification.find()
			if (!college || college.isProfileCompleted == false) {
				req.flash('error', 'Kindly fill your College Location');
				return res.render(`${req.vPath}/app/college/myStudents`, { menu, students: [], qualification, count: 0, totalPages: 0, page: 0, isProfileCompleted: false })
			}
			const perPage = 20;
			const p = parseInt(req.query.page);
			const page = p || 1;
			const students = await Candidate.aggregate([
				{
					$unwind: {
						path: '$qualifications'
					}
				},
				{
					$match: {
						'qualifications.collegePlace': {
							"$regex": college.place,
							"$options": "i"
						}
					}
				},
				{
					$sort: {
						'createdAt': -1
					}
				},
				{
					'$facet': {
						metadata: [{ '$count': "total" }],
						data: [{ $skip: perPage * page - perPage }, { $limit: perPage }]
					}
				}
			])

			let count = students[0].metadata[0]?.total
			if (!count) {
				count = 0
			}
			const totalPages = Math.ceil(count / perPage);
			return res.render(`${req.vPath}/app/college/myStudents`, { menu, students, qualification, count, totalPages, page, isProfileCompleted: true })
		}
		catch (err) {
			console.log(err);
			return res.status(500).send({ status: false, message: err })
		}
	})
router.route("/createResume/:id").get(isCollege, authenti, async (req, res) => {
	try {

		let url = `${req.protocol}://${req.get("host")}/candidateForm/${req.params.id}`

		const candidate = await Candidate.findById(req.params.id);

		if (!candidate || !candidate._id) throw req.ykError("No candidate found!");

		let params = {};
		if (process.env.NODE_ENV !== "development") {
			params = {
				executablePath: "/usr/bin/chromium-browser",
			};
		}
		const logo = fs.readFileSync(path.join(__dirname, '../../../public/images/elements/mipie-footer.png'), { encoding: 'base64' });
		const browser = await puppeteer.launch(params);
		const page = await browser.newPage();
		await page.goto(url, { waitUntil: "networkidle2" });
		const data = await page.pdf({
			path: path.join(__dirname, `../../../public/documents/output${req.params.id}.pdf`),
			format: 'A4',
			displayHeaderFooter: true,
			preferCSSPageSize: true,
			headerTemplate: `
	   <div style="display:flex;width:90%;font-size: 10px;padding: 5px 0;margin:auto;">
		 <div style="width:25%;text-align:right"></div>
	   </div>`,
			footerTemplate: `<footer style="margin: auto; width: 100%; border-top:1px solid #666;">
	   <a href = "${baseUrl}">
	   <img width="70%" height="auto" style="float: right; padding-right: 20px; padding-left: 36px; width: 25%" src="data:image/png;base64,${logo}" alt="Pivohub" />
	   </a>
	   </footer>`,
			margin: {
				top: '30px',
				bottom: '50px',
				right: '30px',
				left: '30px',
			},
		});
		await browser.close();

		if (!data) {
			throw req.ykError("Unable to create pdf1");
		}

		req.flash("success", "Create pdf successfully!");

		res.send({
			status: 200,
			uploadData: `${req.protocol}://${req.get("host")}/documents/output${req.params.id
				}.pdf`,
		});
	} catch (err) {
		console.log(err.message);
		req.flash("error", err.message || "Something went wrong!");
		return res.send({ status: false, err });
	}
});

router.route('/uploadTemplates')
	.get(isCollege, async (req, res) => {
		try {
			const collegeDocs = await CollegeDocuments.find({ college: req.session.user.collegeId }, "name path")
			res.render(`${req.vPath}/app/college/uploadTemplates`, { menu: 'uploadTemplates', collegeDocs });
		}
		catch (err) {
			console.log(err)
			return res.status(500).send({ status: false, message: err.message })
		}
	})
	.post([isCollege, authenti], async (req, res) => {
		try {
			const { name, path } = req.body;
			const collegeDocument = await CollegeDocuments.create({
				college: req.session.user.collegeId,
				name,
				path,
			})
			return res.status(200).send({ status: true });
		}
		catch (err) {
			console.log(err);
			return res.send({ status: false, message: err.message })
		}
	})

router.route("/single").get(auth1, function (req, res) {
	res.download("public/Student.xlsx", function (err) {
		if (err) {
			console.log(err);
		}
	});
});
module.exports = router;
