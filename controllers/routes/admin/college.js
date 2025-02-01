const express = require("express");
const bcrypt = require("bcryptjs");
const { isAdmin } = require("../../../helpers");
const { ObjectId } = require("mongodb");
const mongoose = require('mongoose');
const {
	College,
	Qualification,
	CollegeRepresentative,
	Country,
	University,
	User,
	State,
	City,
	CollegeDocuments
} = require("../../models");

const { generatePassword, sendMail } = require("../../../helpers");
const { baseUrl } = require("../../../config");

const collegeRepresentative = require("../../models/collegeRepresentative");
const moment = require("moment");
const router = express.Router();
router.use(isAdmin);

router.route("/").get(async (req, res) => {
	try {
		let view = false
		if(req.session.user.role === 10){
			view = true
		}
		const data = req.query;
		// for archieve data
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
		let filter = {
			isDeleted: false ,
			status,
		};
		if(data.name){
			filter["name"] ={
				"$regex": data.name,
				"$options": "i"
			 }
		}
		if(data.FromDate && data.ToDate){
			let fdate = moment(data.FromDate).utcOffset("+05:30").startOf('day')
			let tdate = moment(data.ToDate).utcOffset("+05:30").endOf('day')
			filter["createdAt"] = {
				$gte: fdate,
				$lte: tdate
			}
		}
		if(data.Profile && data.Profile !=='All'){
		    filter["isProfileCompleted"]=data.Profile
	    }
	    
		const perPage = 20;
		const p = parseInt(req.query.page, 10);
		const page = p || 1;
		const count = await College.countDocuments(filter);
		const colleges = await College.find(filter)
			.populate({ path: "_concernPerson", select: "name email" })
			.populate({ path: "_university", select: "name" })
			.select("name website status university isDeleted createdAt")
			.sort({ createdAt: -1 })
			.skip(perPage * page - perPage)
			.limit(perPage);
		const totalPages = Math.ceil(count / perPage);

		return res.render(`${req.vPath}/admin/college`, {
			colleges,
			perPage,
			totalPages,
			page,
			isChecked,
			data,
			menu:'college',
			view
		});
	} catch (err) {
		req.flash("error", err.message || "Something went wrong!");
		return res.redirect("back");
	}
});

router
	.route("/add")
	.get(async (req, res) => {
		try {
			const country = await Country.find({});
			const qualification = await Qualification.find({ status: true });
			const university = await University.find({ status: true });
			let formData = {};
			return res.render(`${req.vPath}/admin/college/add`, {
				country,
				qualification,
				university,
				formData,
				menu:'addCollege'
			});
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})
	.post(async (req, res) => {
		try {
			const country = await Country.find({});
			const qualification = await Qualification.find({ status: true });
			const university = await University.find({ status: true });
			let formData = req.body;
			const {
				website,
				name,
				designation,
				email,
				mobile,
				collegeName,
			} = req.body;

			const userCheck = await User.findOne({
				email: email,
				isDeleted: false,
			});

			if (userCheck) {
				console.log("asdasdas");
				req.flash("error", "Email is already registered with us!");
				// return res.redirect("/admin/college/add");
				return res.render(`${req.vPath}/admin/college/add`, {
					formData,
					country,
					qualification,
					university,
					error: "Email is already registered with us!",
					menu:'addCollege'
				});
			}

			// throw req.ykError("Email is already registered with us!");

			// const userCheck2 = await User.findOne({ email: email });
			// console.log('------------college email check with user---------------');
			// if (userCheck2) {
			// 	return res.render(
			// 		`${req.vPath}/admin/college/add`,
			// 		{
			// 			formData,
			// 			country,
			// 			qualification,
			// 			university,
			// 			error: "Email is already registered with us!"
			// 		}
			// 	);
			// }

			const userCheckM = await User.findOne({
				mobile: mobile,
				isDeleted: false,
			});
			if (userCheckM) {
				req.flash("error", "Mobile is already registered with us!");
				// return res.redirect("/admin/college/add");
				return res.render(`${req.vPath}/admin/college/add`, {
					formData,
					country,
					qualification,
					university,
					error: "Mobile is already registered with us!",
					menu:'addCollege'
				});
			}

			// throw req.ykError("Mobile is already registered with us!");
			const pass = await generatePassword();

			const usr = await User.create({
				name,
				mobile,
				email,
				designation,
				role: 2,
			});
			bcrypt.hash(pass, 10, async function (err, hash) {
				let user = await User.findOneAndUpdate(
					{ email: usr.email },
					{
						password: hash,
					}
				);
			});

			if (!usr) throw req.ykError("College not create!");
			const dataCheck = await College.findOne({ website });
			// if (dataCheck) throw req.ykError("Website already exist!");
			const college = await College.create({
				...req.body,
				name: collegeName,
				_concernPerson: usr._id,
			});
			if (!college) throw req.ykError("College not create!");

			const { repName, repDesignation, repImage, repEmail, repMobile } =
				req.body;

			if (repName && repName.length > 0) {
				repName.forEach(async (s, i) => {
					if (s) {
						const objs = {
							_college: college._id,
							name: s,
							designation: repDesignation[i],
							image:
								repImage != undefined || repImage != null
									? repImage[i]
									: "",
							email: repEmail[i],
							mobile: repMobile[i],
						};
						const exe = await CollegeRepresentative.create(objs);
						if (!exe) throw req.ykError("Representative not create!");
					}
				});
			}

			// Send EMail - Nitin
			let web_url = `${baseUrl}/college/login`;
			let subject = "Welcome to College Panel!";
			let message = `<html lang="en">
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
                                                                <img src="${baseUrl}/images/logo/logo.png" alt="pic"
                                                                    style="position: relative; background-color: #FC2B5A; display: block; margin: 40px auto 0; width: 170px!important;background-repeat: no-repeat;padding-bottom: 50px; ">
                                                            </a>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td align="left" style="font-family:'Manrope',sans-serif!important">
                                                            <br/>
                                                            <p
                                                                style="text-align:left;line-height:32px;font-size:18px!important;font-family:'Manrope',sans-serif!important;margin:10px 50px 21px">
                                                                Dear ${name},</p>
                                                            <ul style="list-style-type:none;padding-left:0px;margin:20px 50px">
                                                                <li style="padding-top:0px;margin-left:0px !important"><span
                                                                        style="line-height:32px;font-size:18px!important;font-family:'Manrope',sans-serif!important">
                                                                        Welcome to Focalyt Portal, a self-service tool
                                                                        designed for your ease.</span></li>
                                                                <br/>
                                                                <li style="padding-top:0px;margin-left:0px !important"><span
                                                                        style="line-height:32px;color:#4d4d4d;font-size:18px!important;font-family:'Manrope',sans-serif!important">Email
                                                                        : <a href="mailto:chandan.xperge@gmail.com"
                                                                            target="_blank">${email}</a></span>
                                                                </li>
                                                                <li style="padding-top:0px;margin-left:0px !important"><span
                                                                        style="line-height:32px;color:#4d4d4d;font-size:18px!important;font-family:'Manrope',sans-serif!important">Temporary
                                                                        Password : ${pass}
                                                                    </span></li>
                                                                <br/>
                                                                <li style="padding-top:35px; text-align: center;">
                                                                    <span style="line-height:32px;color:#4d4d4d;font-size:18px!important;font-family:'Manrope',sans-serif!important">
                                                                      
																	<a
																	href="${baseUrl}/college/login" style="background-color: #FC2B5A; border-radius: 50px;
                                                                        text-decoration: none; color: white;padding: 10px 10px 10px 10px ;margin-left:-42px">
                                                                        Click here to login
                                                                        </a>
                                                                    </span>
																	<br/><br/>
                                                                </li>
                                                            </ul>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style="font-family: 'manrope',sans-serif!important;text-align:left">
                                                            <ul style="list-style-type: none;padding-left: 0px;margin: 20px 50px!important;">
                                                                <li style="padding-top:0px;margin-left:0px !important">
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
		<script>
        function redirect(){
            window.location.href = "${baseUrl}/college/login"
        }
    </script>
					`;
			sendMail(subject, message, req.body.email);

			req.flash("success", "College added successfully!");
			return res.redirect("/admin/college");
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});

// Edit - Nitin sehgal
router
	.route("/edit/:id")
	.get(async (req, res) => {
		try {
			const { id } = req.params;

			// const industry = await Industry.find({ status: true });

			const populate = {
				path: "_concernPerson",
				select: "name mobile designation email",
			};
			const college = await College.findById(id)
				.populate(populate)
				.populate({
					path: "_university",
					select: "name",
				});

			if (!college) throw req.ykError("college not found!");
			const CompanyExec = await CollegeRepresentative.find(
				{ _college: college._id },
				{}
			);

			const state = await State.find({ countryId: college.countryId });
			const city = await City.find({ stateId: college.stateId });
			// console.log(CompanyExec)
			const country = await Country.find({});
			const qualification = await Qualification.find({ status: true });
			const university = await University.find({ status: true });

			return res.render(`${req.vPath}/admin/college/edit`, {
				country,
				college,
				CompanyExec,
				state,
				city,
				university,
				qualification,
				id,
				menu:'college'
			});
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})
	.post(async (req, res) => {
		try {
			// const cmpyUpdate = await College.findByIdAndUpdate(req.params.id, req.body);
			// if (!cmpyUpdate) throw req.ykError('College not updated!');
			req.body.cname = req.body.name;

			req.body.name = req.body.collegeName;
			const cmpyUpdate = await College.findByIdAndUpdate(
				req.params.id,
				req.body
			);
			req.body._exeid = req.body._exeid.filter(function (el) {
				return el != "";
			});
			if (req.body._exeid.length > 0) {
				await CollegeRepresentative.remove({
					_id: { $nin: req.body._exeid },
					_college: req.params.id,
				});
			}
			if (!cmpyUpdate) throw req.ykError("College not updated!");

			let concerObj = {
				name: req.body.cname,
				designation: req.body.designation,
				email: req.body.email,
				mobile: req.body.mobile,
			};

			let exe = await User.findByIdAndUpdate(
				{ _id: cmpyUpdate._concernPerson },
				concerObj
			);
			req.body._exeid = req.body._exeid.filter(function (el) {
				return el != "";
			});
			if (req.body._exeid.length > 0) {
				await CollegeRepresentative.remove({
					_id: { $nin: req.body._exeid },
					_college: req.params.id,
				});
			}
			if (req.body.repName && req.body.repName.length > 0) {
				req.body.repName.forEach(async (s, i) => {
					if (s != "") {
						if (
							req.body._exeid[i] != "" &&
							req.body._exeid[i] != undefined
						) {
							let objs = {
								name: s,
								designation: req.body.repDesignation[i],
								image:
									req.body.exeImage != undefined ||
									req.body.exeImage != null
										? req.body.exeImage[i]
										: "",
								mobile: req.body.repMobile[i],
								email: req.body.repEmail[i],
							};
							//	console.log(objs);
							var id = new mongoose.Types.ObjectId(req.body._exeid[i]);
							// var id = ObjectId.fromString(req.body._id[i]);
							let exe = await CollegeRepresentative.findByIdAndUpdate(
								{ _id: id },
								objs
							);

							//	if (!exe) throw req.ykError("Executive not create!");
						} else {
							let objs = {
								_college: req.params.id,
								name: s,
								designation: req.body.repDesignation[i],
								image:
									req.body.exeImage != undefined ||
									req.body.exeImage != null
										? req.body.exeImage[i]
										: "",
								mobile: req.body.repMobile[i],
								email: req.body.repEmail[i],
							};
							let exe = await CollegeRepresentative.create(objs);
						}
					}
				});
			}
			if (!cmpyUpdate) throw req.ykError("Company not updated!");

			req.flash("success", "College updated successfully!");
			return res.redirect("/admin/college");
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});

router.route("/view/:id").get(async (req, res) => {
	try {
		const { id } = req.params;

		const populate = {
			path: "_concernPerson",
			select: "name mobile designation email",
		};

		const college = await College.findById(id).populate(populate).populate({
			path: "_university",
			select: "name",
		});

		const collegeDocuments =  await CollegeDocuments.find({college: id}, "path name createdAt")

		if (!college) throw req.ykError("college not found!");
		const CompanyExec = await CollegeRepresentative.find(
			{ _college: college._id },
			{}
		);

		const state = await State.find({ countryId: college.countryId });
		const city = await City.find({ stateId: college.stateId });
		// console.log(CompanyExec)
		const country = await Country.find({});
		const qualification = await Qualification.find({ status: true });
		const university = await University.find({ status: true });

		return res.render(`${req.vPath}/admin/college/view`, {
			country,
			college,
			CompanyExec,
			state,
			city,
			university,
			qualification,
			collegeDocuments,
			menu:'college'
		});
	} catch (err) {
		req.flash("error", err.message || "Something went wrong!");
		return res.redirect("back");
	}
});

module.exports = router;
