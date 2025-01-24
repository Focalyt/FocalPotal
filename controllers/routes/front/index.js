const express = require("express");
const AWS = require("aws-sdk");
const uuid = require("uuid/v1");
const moment = require("moment");
// const pdf = require('pdf-parse');
// const fs = require('fs');
// const multer = require('multer');
// const upload = multer();
// const OpenAI = require('openai');

const {
	User,
	Company,
	College,
	Candidate,
	SkillTest,
	CareerObjective,
	CoverLetter,
	MockInterview,
	Vacancy,
	State,
	City,
	Qualification,
	Industry,
	Courses,
	CourseSectors,
	Contact, Post
} = require("../../models");
const bcrypt = require("bcryptjs");
const router = express.Router();
const {
	bucketName,
	accessKeyId,
	secretAccessKey,
	region,
	mimetypes,
	bucketURL
} = require("../../../config");
const CompanyExecutive = require("../../models/companyExecutive");
const collegeRepresentative = require("../../models/collegeRepresentative");
const { generatePassword, sendMail } = require("../../../helpers");
const { Translate } = require('@google-cloud/translate').v2;
const { translateProjectId, translateKey } = require('../../../config')

AWS.config.update({ accessKeyId, secretAccessKey, region });
const s3 = new AWS.S3({ region, signatureVersion: "v4" });

const nodemailer = require("nodemailer");
const { ObjectId } = require("mongoose").Types;

var transporter = nodemailer.createTransport({
	service: '"gmail"',
	port: 587,
	secure: true,
	auth: {
		user: "lovepreetlavi697@gmail.com",
		pass: "blwwclfkawgmbwwk",
	},
});

router.get("/", async (req, res) => {
	try {
		const data = req.query
		let { qualification, experience, industry, jobType, state, Salary } = req.query
		if (qualification && !ObjectId.isValid(qualification)) {
			qualification = ''
		}
		if (experience && isNaN(experience)) {
			experience = ''
		}
		if (industry && !ObjectId.isValid(industry)) {
			industry = ''
		}
		if (jobType && (jobType != 'Part Time' && jobType != 'Full Time')) {
			jobType = ''
		}
		if (state && !ObjectId.isValid(state)) {
			state = ''
		}
		if (Salary && isNaN(Salary)) {
			Salary = ''
		}
		let filter = { status: true, _company: { $ne: null }, validity: { $gte: moment().utcOffset('+05:30') },verified:true }
		if (qualification) {
			filter._qualification = qualification
		}
		if (industry) {
			filter._industry = industry
		}
		if (jobType) { 
			filter.jobType = jobType
		}
		if (experience) {
			experience == "0"
				? (filter["$or"] = [
					{ experience: { $lte: experience } },
				])
				: (filter["experience"] = { $lte: experience });
		}
		if (state) {
			filter.state = state
		}
		if (Salary) {
			filter["$or"] = [{ isFixed: true, amount: { $gte: Salary } }, { isFixed: false, max: { $gte: Salary } }]
		}

		const allQualification = await Qualification.find({ status: true }).sort({ basic: -1 })
		const allIndustry = await Industry.find({ status: true })
		const allStates = await State.find({ countryId: '101', status: { $ne: false } })
		const countJobs = await Vacancy.find(filter).countDocuments()
		const perPage = 10;
		const p = parseInt(req.query.page);
		const page = p || 1;
		const totalPages = Math.ceil(countJobs / perPage);
		let recentJobs = await Vacancy.find(filter).populate([
			{
				path: '_company',
				select: "name logo stateId cityId"
			},
			{
				path: "_industry",
				select: "name",
			},
			{
				path: "_jobCategory",
				select: "name",
			},
			{
				path: "_qualification",
				select: "name",
			},
			{
				path: "state",
				select: "name",
			},
			{
				path: "city",
				select: "name",
			},]).sort({ sequence: 1, createdAt: -1 }).skip(perPage * page - perPage).limit(perPage);

		rePath = res.render(`${req.vPath}/front`, {
			recentJobs, allQualification, allIndustry, allStates, data, totalPages, page,
		});
	} catch (err) {
		const ipAddress = req.header('x-forwarded-for') || req.socket.remoteAddress;
		console.log('======================> 1', ipAddress, req.user?.mobile, req.user?.name, err)
		req.flash("error", err.message || "Something went wrong!");
		// return res.redirect("back");
	}
});

router.get("/corporate-pricing-plan", (req, res) => {
	rePath = res.render(`${req.vPath}/front/corporatePricingPlan`, {
	});
});
router.get("/community", async (req, res) => {
	let filter = { status: true}
     	// const countPosts = await Post.find(filter).countDocuments()
		// const perPage = 18;
		// const p = parseInt(req.query.page);
		// const page = p || 1;
		// const totalPages = Math.ceil(countPosts / perPage);
		let posts = await Post.find(filter).sort({  createdAt: -1 });
		
		
		
		
		rePath =res.render(`${req.vPath}/front/blog`, {
		posts
		
	});
});

router.get("/employersTermsofService", (req, res) => {
	rePath = res.render(`${req.vPath}/front/employersTermsofService`, {
	});
});

router.get("/userAgreement", (req, res) => {
	rePath = res.render(`${req.vPath}/front/userAgreement`, {
	});
});
router.get("/joblisting", async (req, res) => {
	const data = req.query;	
		let { experience, sector, salary } = req.query	

		if (experience && isNaN(experience)) {
			experience = ''
		}

		if (salary && isNaN(salary)) {
			salary = ''
		}
		if (sector && isNaN(sector)) {
			sector = ''
		}

		let filter = { status: true, _company: { $ne: null }, validity: { $gte: moment().utcOffset('+05:30') },verified:true }
	   
		if (salary) {
			filter["$or"] = [{ isFixed: true, amount: { $gte: salary } }, { isFixed: false, max: { $gte: salary } }]
		}

		if (experience) {
			experience == "0"
				? (filter["$or"] = [
					{ experience: { $lte: experience } },
				])
				: (filter["experience"] = { $lte: experience });
		}
		
		let populate = [
			{
				path: '_company',
				select: "name logo stateId cityId"
			},
			{
				path: "_industry",
				select: "name",
			},
			{
				path: "_jobCategory",
				select: "name",
			},
			{
				path:"_courses",
				select: "name"	
			},
			{
				path: "_qualification",
				select: ["name"],
			},
			{
				path: "state"
			},
			{
				path: "city",
				select: "name",
			}
		]
		
		const countJobs = await Vacancy.find(filter).countDocuments()
		const perPage = 9;
		const p = parseInt(req.query.page);
		const page = p || 1;
		const totalPages = Math.ceil(countJobs / perPage);

		const sectors = await CourseSectors.find({})
				.select("name image status")
				.sort({ createdAt: -1 })
				.skip(perPage * page - perPage)
				.limit(perPage);
                console.log(sectors, "sectors")
		let recentJobs = await Vacancy.find(filter).populate(populate).sort({ sequence: 1, createdAt: -1 }).skip(perPage * page - perPage).limit(perPage)
	rePath = res.render(`${req.vPath}/front/joblisting`, {
		recentJobs,
		totalPages,
		page,
		data,
		sectors
	});
});

router.get("/about_us", (req, res) => {
    
	rePath = res.render(`${req.vPath}/front/about_us`, {
	});
});
router.get("/futureTechnologyLabs", (req, res) => {
    
	rePath = res.render(`${req.vPath}/front/labs.ejs`, {
	});
});
router.get("/jobsearch", (req, res) => {
    
	rePath = res.render(`${req.vPath}/front/jobsearch`, {
	});
});
router.post("/jobsearch", (req, res) => {
    const {body}=req.body;
	
	rePath = res.render(`${req.vPath}/front/jobsearch`, {
	});
});
router.get("/courses", async (req, res) => {
	let filter = { status: true}
     	const countJobs = await Courses.find(filter).countDocuments()
		 const contact = await Contact.find({ status: true, isDeleted: false }).sort({ createdAt: 1 })
		const perPage = 18;
		const p = parseInt(req.query.page);
		const page = p || 1;
		const totalPages = Math.ceil(countJobs / perPage);
		let courses = await Courses.find(filter).sort({  createdAt: -1 }).skip(perPage * page - perPage).limit(perPage)
		rePath = res.render(`${req.vPath}/front/courses`, {
		courses,
		phoneToCall: contact[0]?.mobile,
		totalPages,
		page
	});
});
router.get("/coursedetails/:id", async(req, res) => {
	const {id}=req.params
    let course=await Courses.findOne({_id:id})
	rePath = res.render(`${req.vPath}/front/coursedetails`, {
		course
	});
});
router.get("/contact", (req, res) => {
	rePath = res.render(`${req.vPath}/front/contact`, {
	});
});
router.get("/contactt", (req, res) => {
	rePath = res.render(`${req.vPath}/front/contactUs`, {
	});
});
router.get("/sampleVideoProfile", (req, res) => {
	rePath = res.render(`${req.vPath}/front/sampleVideoProfile`, {
	});
});
router.get("/coursedetailmore", (req, res) => {
	console.log('=========== reached')
	rePath = res.render(`${req.vPath}/front/coursedetailmore`, {
	});
});
router.get("/jobdetailsmore/:jobId", async(req, res) => {
	try{
		let jobId = req.params.jobId 
		
			if (!jobId) {
				throw req.ykError("Invalid Job Id");
			}
			const populate = [
				{
					path: '_company',
					select: "name description logo stateId cityId mediaGallery mediaGalaryVideo "
				},
				{
					path: "_industry",
					select: "name",
				},
				{
					path: "_jobCategory",
					select: "name",
				},
				{
					path: "_qualification",
					select: "name",
				},
				{
					path: "state",
					select: "name",
				},
				{
					path: "city",
					select: "name",
				},
				{
					path: "_techSkills",
					select: "name",
				},
				{
					path: "_nonTechSkills",
					select: "name",
				},
	
			];
			const job = await Vacancy.findOne({ _id: jobId }).populate(populate)
			let state = '';
			let city = '';
			if (job._company?.stateId && job._company?.cityId) {
				state = await State.findOne({ _id: job._company.stateId, status: true })
				city = await City.findOne({ _id: job._company.cityId, status: true, stateId: job._company.stateId })
			}
			const recentJobs = await Vacancy.find({ status: true, _id: { $ne: jobId } }).populate([
				{
					path: '_company',
					select: "name logo"
				},
				{
					path: "city",
					select: "name",
				}]).sort({ createdAt: -1 }).limit(5)

		const courses = await Courses.find({ status: true}).sort({ createdAt: -1 }).limit(10)
	

		rePath = res.render(`${req.vPath}/front/jobdetailmore`, {
			job, recentJobs, state, city, courses
		});
	}catch(err){
		console.log(err,'err>>>>>>>>>>>>')
	}
});
router.get("/contact", (req, res) => {
	rePath = res.render(`${req.vPath}/front/contact`, {
	});
});

router.get("/jobdetails/:jobId", async (req, res) => {
	try {
		let jobId = req.params.jobId //63d8cb2e421777708eaed0d8
		if (jobId && !ObjectId.isValid(jobId)) {
			throw req.ykError("Invalid Job Id");
		}
		const populate = [
			{
				path: '_company',
				select: "name logo stateId cityId mediaGallery mediaGalaryVideo"
			},
			{
				path: "_industry",
				select: "name",
			},
			{
				path: "_jobCategory",
				select: "name",
			},
			{
				path: "_qualification",
				select: "name",
			},
			{
				path: "state",
				select: "name",
			},
			{
				path: "city",
				select: "name",
			},
			{
				path: "_techSkills",
				select: "name",
			},
			{
				path: "_nonTechSkills",
				select: "name",
			},

		];
		const job = await Vacancy.findOne({ _id: jobId }).populate(populate)
		let state = '';
		let city = '';
		if (job._company?.stateId && job._company?.cityId) {
			state = await State.findOne({ _id: job._company.stateId, status: true })
			city = await City.findOne({ _id: job._company.cityId, status: true, stateId: job._company.stateId })
		}
		const recentJobs = await Vacancy.find({ status: true, _id: { $ne: jobId } }).populate([
			{
				path
					: '_company',
				select: "name logo"
			},
			{
				path: "city",
				select: "name",
			}]).sort({ createdAt: -1 }).limit(5)

		return res.render(`${req.vPath}/front/jobdetails`, { job, recentJobs, state, city });
	} catch (err) {
		const ipAddress = req.header('x-forwarded-for') || req.socket.remoteAddress;
		console.log('======================> 2', ipAddress, req.user?.mobile, req.user?.name, err)
		req.flash("error", err.message || "Something went wrong!");
		return res.redirect("back");
	}
});
router.get("/jobdetails", async (req, res) => {
	try {
		const data = req.query
		let { qualification, experience, industry, jobType, state, Salary } = req.query
		if (qualification && !ObjectId.isValid(qualification)) {
			qualification = ''
		}
		if (experience && isNaN(experience)) {
			experience = ''
		}
		if (industry && !ObjectId.isValid(industry)) {
			industry = ''
		}
		if (jobType && (jobType != 'Part Time' && jobType != 'Full Time')) {
			jobType = ''
		}
		if (state && !ObjectId.isValid(state)) {
			state = ''
		}
		if (Salary && isNaN(Salary)) {
			Salary = ''
		}
		let populate = [
			{
				path: '_company',
				select: "name logo stateId cityId"
			},
			{
				path: "_industry",
				select: "name",
			},
			{
				path: "_jobCategory",
				select: "name",
			},
			{
				path: "_qualification",
				select: ["name"],
			},
			{
				path: "state"
			},
			{
				path: "city",
				select: "name",
			}
		]

		let filter = { status: true, _company: { $ne: null }, validity: { $gte: moment().utcOffset('+05:30') } }
		if (qualification) {
			filter._qualification = qualification
		}
		if (industry) {
			filter._industry = industry
		}
		if (jobType) {
			filter.jobType = jobType
		}
		if (experience) {
			experience == "0"
				? (filter["$or"] = [
					{ experience: { $lte: experience } },
				])
				: (filter["experience"] = { $lte: experience });
		}
		if (state) {
			filter.state = state
		}
		if (Salary) {
			filter["$or"] = [{ isFixed: true, amount: { $gte: Salary } }, { isFixed: false, min: { $gte: Salary } }]
		}
		const allQualification = await Qualification.find({ status: true }).sort({ basic: -1 })
		const allIndustry = await Industry.find({ status: true })
		const allStates = await State.find({ countryId: '101', status: { $ne: false } })
		const countJobs = await Vacancy.find(filter).countDocuments()
		const perPage = 10;
		const p = parseInt(req.query.page);
		const page = p || 1;
		const totalPages = Math.ceil(countJobs / perPage);
		let recentJobs = await Vacancy.find(filter).populate(populate).sort({ sequence: 1, createdAt: -1 }).skip(perPage * page - perPage).limit(perPage)
		return res.render(`${req.vPath}/front/joblist`, {
			recentJobs,
			totalPages,
			page,
			data,
			allQualification,
			allIndustry,
			allStates
		});
	} catch (err) {
		const ipAddress = req.header('x-forwarded-for') || req.socket.remoteAddress;
		console.log('======================> 3', ipAddress, req.user?.mobile, req.user?.name, err)
		req.flash("error", err.message || "Something went wrong!");
		// return res.redirect("back");
	}
});
router.get("/jobdetailslist", async (req, res) => {
	try {
		let recentJobs = await Vacancy.find({ status: true, _company: { $ne: null } }).populate([
			{
				path: '_company',
				select: "name logo stateId cityId"
			},
			{
				path: "_industry",
				select: "name",
			},
			{
				path: "_jobCategory",
				select: "name",
			},
			{
				path: "_qualification",
				select: "name",
			},
			{
				path: "state",
				select: "name",
			},
			{
				path: "city",
				select: "name",
			},]).sort({ sequence: 1, createdAt: -1 }).limit(5);
		recentJobs.forEach((item) => {
			if (item.displayCompanyName) {
				item._company.name = item.displayCompanyName
			}
			if (item._company.logo && item._company.logo.indexOf(bucketURL) < 0) {
				item._company.logo = bucketURL + "/" + item._company.logo
			}
			if (item.updatedAt) {
				item.updatedAt = moment(item.updatedAt).utcOffset('+05:30').format('DD MMM YYYY')
			}
		})
		return res.send({ status: true, recentJobs });
	} catch (err) {
		return res.send({ status: false, err })
	}
});
router
	.route("/admin/login")
	.get(async (req, res) => {
		let rePath;
		if (req.session.user && req.session.user.status) {
			rePath = res.render(`${req.vPath}/front/login`);
		} else {
			if (req.session.user && req.session.user.role === 0) {
				rePath = res.redirect("/admin");
			} else if (req.session.user && req.session.user.role === 1) {
				rePath = res.redirect("/company/dashboard");
			} else if (req.session.user && req.session.user.role === 3) {
				rePath = res.redirect("/candidate/dashboard");
			} else if (req.session.user && req.session.user.role === 2) {
				rePath = res.redirect("/college/dashboard");
			} else {
				rePath = res.render(`${req.vPath}/front/login`);
			}
		}
		return rePath;
	})
	.post(async (req, res) => {
		try {
			const user = await User.findOne({
				email: req.body.email,
				role: { $in: [0, 10] },
				status: true,
			});
			// if (!user || user === null)
			// 	throw req.ykError("You are blocked by super admin");

			if (!user || user === null)
				throw req.ykError("User not found. Enter a valid credentials");

			if (user && user.status == false)
				throw req.ykError("Please Contact With Your Admin");

			if (!user.validPassword(req.body.password))
				throw req.ykError("Enter a valid password");

			if (user) {
				if (user.role === 10 || user.role === 0) {
					let userData = { role: user.role, name: user.name, _id: user._id, email: user.email }
					req.session.user = userData;
					return res.redirect("/admin");
				}
			}
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});

router.get("/admin/logout", async (req, res) => {
	try {
		req.session.user = null;
		return res.redirect("/admin/login");
	} catch (err) {
		req.flash("error", err.message || "Something went wrong!");
		return res.redirect("back");
	}
});

router.post("/admin/changestatus", async (req, res) => {
	try {
		const Model = require(`../../models/` + req.body.model); // eslint-disable-line
		const updata = { $set: { status: req.body.status } };
		const data = await Model.findByIdAndUpdate(req.body.id, updata);
		if (req.body.model == "company" || req.body.model == "college") {
			const user = await User.findByIdAndUpdate(data._concernPerson, updata);
			if (req.body.status == 'false') {
				const updateJobs = await Vacancy.updateMany({ _company: data._id }, updata)
			}
		}
		return res.send(data);
	} catch (err) {
		console.log('err is ', err)
		req.flash("error", "Something went wrong!");
		return res.redirect("back");
	}
});

// Delete user : Nitin sehgal
router.post("/admin/deleteRecord", async (req, res) => {
	try {
		const Model = require(`../../models/` + req.body.model); // eslint-disable-line
		const updata = { $set: { isDeleted: true } };
		const data = await Model.findByIdAndUpdate(req.body.id, updata);
		if (req.body.model == "candidate") {
			const user0 = await User.findByIdAndUpdate(
				{ _id: data._concernPerson },
				updata
			);
		}

		if (req.body.model == "company" || req.body.model == "college") {
			const user = await User.findByIdAndUpdate(data._concernPerson, updata);

			if (req.body.model == "company") {
				const user0 = await CompanyExecutive.updateMany(
					{ _company: data._id },
					updata
				);
			}
			if (req.body.model == "college") {
				//	console.log("innn", data);
				const user1 = await collegeRepresentative.updateMany(
					{
						_college: data._id,
					},
					updata
				);
			}
			//console.log(user1, "seconndddd");
		}
		return res.send(data);
	} catch (err) {
		req.flash("error", "Something went wrong!");
		return res.redirect("back");
	}
});

router.post("/admin/deleteArchieve", async (req, res) => {
	try {
		if (req.body.model == "college") {
			// console.log("data.id = ", data._id);
			const user3 = await College.findOneAndDelete({ _id: req.body.id });
		}

		if (req.body.model == "company") {
			// console.log("data.id = ", data._id);
			const user3 = await Company.findOneAndDelete({ _id: req.body.id });
		}

		if (req.body.model == "candidate") {
			// console.log("data.id = ", data._id);
			const user3 = await Candidate.findOneAndDelete({ _id: req.body.id });
		}

		if (req.body.model == "skillTest") {
			// console.log("data.id = ", data._id);
			const user3 = await SkillTest.findOneAndDelete({ _id: req.body.id });
		}

		if (req.body.model == "careerObjective") {
			// console.log("data.id = ", data._id);
			const user3 = await CareerObjective.findOneAndDelete({
				_id: req.body.id,
			});
		}

		if (req.body.model == "coverLetter") {
			// console.log("data.id = ", data._id);
			const user3 = await CoverLetter.findOneAndDelete({ _id: req.body.id });
		}

		if (req.body.model == "mockInterview") {
			// console.log("data.id = ", data._id);
			const user3 = await MockInterview.findOneAndDelete({
				_id: req.body.id,
			});
		}

		if (req.body.model == "vacancy") {
			// console.log("data.id = ", data._id);
			const user3 = await Vacancy.findOneAndDelete({ _id: req.body.id });
		}

		return res.send(data);
	} catch (err) {
		req.flash("error", "Something went wrong!");
		return res.redirect("back");
	}
});

router.get("/admin/s3upload", async (req, res) => {
	try {
		const { user } = req.session;
		const { type, ext } = req.query;

		if (!user || !user._id) throw req.ykError("You are not authorized!");
		if (!type || !ext || !mimetypes.includes(ext))
			throw req.ykError("Invalid or unsupported file!");

		const key = `uploads/${user._id}/${uuid()}.${ext}`;
		const params = {
			Bucket: bucketName,
			ContentType: type,
			Key: key,
		};
		return s3.getSignedUrl("putObject", params, (err, url) => {
			if (err) throw err;
			if (!url) throw req.ykError();
			return res.send({ status: true, data: { url, key } });
		});
	} catch (err) {
		return req.errFunc(err);
	}
});

router.post("/admin/uploadVideo", (req, res) => {
	try {
		const { name, mimetype: ContentType } = req.files.file;
		const ext = name.split(".").pop();
		const key = `uploads/${uuid()}.${ext}`;
		const data = req.files.file.data;
		const params = {
			Bucket: bucketName,
			Body: data,
			Key: key,
			ContentType
		};
		s3.upload(params, function (err, data) {
			return res.send({ status: true, data });
		})
	}
	catch (err) {
		console.log(err);
		res.status(500).send({ status: false, message: err })
	}
})

//forget password

router
	.route("/admin/forgotpassword")
	.get(async (req, res) => {
		rePath = res.render(`${req.vPath}/front/forPass`);
		return rePath;
	})
	.post(async (req, res) => {
		try {
			const email = req.body.email;
			const tempPassword = await generatePassword();
			const userData = await User.findOne({ email: email });
			if (!userData)
				throw req.ykError(
					"Invalid email, please enter your registered email"
				);

			if (userData.role == "3") throw req.ykError("You are not registered");

			bcrypt.hash(tempPassword, 10, async function (err, hash) {
				let user = await User.findOneAndUpdate(
					{ email: email },
					{
						password: hash,
					}
				);
			});

			var subject = "Focalyt - Forgot Password!";
			var message = `
			<html lang="en">
			<head>
			<meta charset="utf-8">
			<meta name="viewport" content="width=device-width, initial-scale=1">
			</head>
			<body>
			<div>
			<table border="0" cellpadding="0" cellspacing="0" style="height: 100%; width: 100%;">
                <tbody> 
                    <tr>
                        <td align="center" valign="top">
                            <table border="0" cellspacing="0" style="width: 600px; ">
                                <tbody>
                                    <tr>
                                        <td align="center" valign="top" style="font-family:'Manrope',sans-serif!important">
                                            <table border="0" cellspacing="0" cellpadding="0 ="
                                                style="background-color: #F4F3F3; border-radius: 4px; overflow: hidden; text-align: center; width: 620px;">
                                                <tbody>
                                                    <tr>
                                                        <td style="background-color:#FC2B5A;color:#ffffff!important"
                                                            valign="top">
                                                            <a>
                                                                <img src="http://35.160.1.29:8004/images/logo/logo.png" alt="pic"
                                                                    style="position: relative; background-color: #FC2B5A; display: block; margin: 40px auto 0; width: 170px!important;background-repeat: no-repeat;padding-bottom: 50px; ">
                                                            </a>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style="font-family:'Manrope',sans-serif!important;text-align:left;padding-left:65px;padding-top:70px" >
														<p style="line-height:32px;font-size:18px!important;font-family:'Manrope',sans-serif!important">
														Hi ${userData.name},<br/><br/>				
														Your Temporary  Password : ${tempPassword}<br/>  <br/> 
														</p>
														<p style="line-height:32px;font-size:18px!important;font-family:'Manrope',sans-serif!important">
														Thank you,<br/> 
														Focalyt Group<br/> <br/> 
														Please contact mentory@support.com if you have any questions.
														</p>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style="font-family: 'manrope',sans-serif!important;text-align:left">
                                                            <ul style="list-style-type: none;padding-left: 0px;margin: 20px 50px!important;">
                                                                <li style="padding-top:0px">
                                                                    <span style="line-height:32px;font-size:18px!important;font-family:'Manrope',sans-serif!important">
                                                                        Sincerely, <br/> Focalyt Group 
                                                                    </span>
                                                                </li>                                                                
                                                            </ul>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                </tbody>
            </table>
		</div>
		</body>
		</html>
			`;

			sendMail(subject, message, email);

			req.flash(
				"success",
				"Your new password has been sent to your registered email. Please check your email."
			);
			res.redirect("/admin/forgotpassword");
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});

//change password
router
	.route("/admin/changepassword")
	.get(async (req, res) => {
		rePath = res.render(`${req.vPath}/admin/setting/changePass`, { menu: 'dashboard' });
		// rePath = res.render(`${req.vPath}/front/login`);
		return rePath;
	})
	.post(async (req, res) => {
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
	.route("/admin/editprofile")
	.get(async (req, res) => {
		var user = req.session.user;
		rePath = res.render(`${req.vPath}/admin/setting/editProfile`, {
			user,
			menu: 'dashboard'
		});
		// rePath = res.render(`${req.vPath}/front/login`);
		return rePath;
	})
	.post(async (req, res) => {
		try {
			const email = req.body.email;
			const name = req.body.name;
			var id = req.session.user._id;

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


router.route('/about')
	.get(async (req, res) => {
		rePath = res.render(`${req.vPath}/front/about`, {
		});
	})
router.route('/about-us')
	.get(async (req, res) => {
		rePath = res.render(`${req.vPath}/front/aboutUs`, {
		});
	})

router.route('/termsandconditions')
	.get(async (req, res) => {
		rePath = res.render(`${req.vPath}/front/termsAndConditions`, {
		});
	})

router.route('/privacy-policy')
	.get(async (req, res) => {
		rePath = res.render(`${req.vPath}/front/privacyPolicy`, {
		});
	})

router.route('/return-and-refund-policy')
	.get(async (req, res) => {
		rePath = res.render(`${req.vPath}/front/returnAndRefundPolicy`, {
		});
	})

router.route('/contact-us')
	.get(async (req, res) => {
		rePath = res.render(`${req.vPath}/front/contactUs`, {
		});
	})

router.route('/signs')
	.get(async (req, res) => {
		res.setHeader('X-FRAME-OPTIONS', 'ALLOW-FROM *');
		res.setHeader('Content-Security-Policy', "frame-ancestors *");
		rePath = res.render(`${req.vPath}/front/signs`, {
		});
	})

router.route('/signConverter')
	.get(async (req, res) => {
		res.setHeader('X-FRAME-OPTIONS', 'ALLOW-FROM *');
		res.setHeader('Content-Security-Policy', "frame-ancestors *");

		rePath = res.render(`${req.vPath}/front/signConverter`, {
		});
	})

router.route('/voice')
	.get(async (req, res) => {
		res.setHeader('X-FRAME-OPTIONS', 'ALLOW-FROM *');
		res.setHeader('Content-Security-Policy', "frame-ancestors *");
		rePath = res.render(`${req.vPath}/front/voice`, {
		});
	})

router.route('/translate')
	.post(async (req, res) => {
		res.setHeader('X-FRAME-OPTIONS', 'ALLOW-FROM *');
		res.setHeader('Content-Security-Policy', "frame-ancestors *");
		const lang = req.body.lang ? req.body.lang : 'hi'
		const message = req.body.message?.toLowerCase();
		console.log('I received this message ', message)
		const translate = new Translate({ projectId: translateProjectId, key: translateKey });

		translate.translate(message, lang).then(result => {
			return res.send({ status: true, message: result[0] });
		})
			.catch(err => {
				console.log('=========> Err', err)
				return res.send({ status: false, message: 'caught an error' });
			});

	})

router.route('/parser')
	.get(async (req, res) => {
		res.setHeader('X-FRAME-OPTIONS', 'ALLOW-FROM *');
		res.setHeader('Content-Security-Policy', "frame-ancestors *");

		rePath = res.render(`${req.vPath}/front/parser`, {
		});
	})

// router.post('/parsedocument', async (req, res) => {
// 	res.setHeader('X-FRAME-OPTIONS', 'ALLOW-FROM *');
// 	res.setHeader('Content-Security-Policy', "frame-ancestors *");

// 	let output = await pdf(req.files.file.data)
// 	const prompt = `Extract the name, email, phone, linkedin, skype, companies with name position and start/end date, address, total experience, technical_skills and non_technical_skills skills from the following resume and
// 	 calculate total experience in numbers, skills in array then return as json object:\n"${output.text}"`;
// 	const openai = new OpenAI({
// 		apiKey: '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', // defaults to process.env["OPENAI_API_KEY"]
// 	  });

// 	const response = await openai.chat.completions.create({
// 		messages: [{ role: 'user', content: prompt }],
// 		model: 'gpt-3.5-turbo',
// 	  });

// 	const extractedInfo = response.choices[0].message;
// 	return res.send({ status: true, output: JSON.parse(extractedInfo.content) });
// })

module.exports = router;
