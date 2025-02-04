const express = require("express");
const { ObjectId } = require("mongodb");
const mongoose = require('mongoose');
const bcrypt = require("bcryptjs");
const {
	User,
	Company,
	Industry,
	SubIndustry,
	CompanyExecutive,
	Country,
	State,
	City,
	Vacancy,
	HiringStatus,
	Candidate,
	CoinsAlgo
} = require("../../models");

const { generatePassword, sendMail, isAdmin ,isCo} = require("../../../helpers");
const { left } = require("inquirer/lib/utils/readline");
const { baseUrl } = require("../../../config");
const moment = require("moment");
const router = express.Router();
router.use(isAdmin);

router.route("/").get(async (req, res) => {
	try {
		let view = false
		if(req.session.user.role === 10){
			view = true
		}
		const data = req.query
		if (req.query.status == undefined) {
			var status = true;
			var isChecked = "false";
		} else if (req.query.status.toString() == "true") {
			var status =true;
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
		const count = await Company.countDocuments(filter);
		
		const companies = await Company.find(filter)
			.populate({
				path: "_industry",
				select: "name",
			})
			.sort({ createdAt: -1 })
			.skip(perPage * page - perPage)
			.limit(perPage);

		let shortlisted = await HiringStatus.aggregate([
			{$match: {status: {$ne: 'rejected'}, isDeleted: false}},
			{$group: {
			    _id: {company:'$company'},
				'count': {'$sum': 1}
			}}])

		companies.forEach((company, i) => {
			let shortlistedData = shortlisted.find(
						(ele) => ele._id.company.toString() === company._id.toString()
					  );
			if(shortlistedData){
				companies[i]['shortlisted'] = shortlistedData['count']
			}else{
				companies[i]['shortlisted'] = 0
			}
		})
		const totalPages = Math.ceil(count / perPage);
		const jobs = await Vacancy.find({status: true}).select('_company')
		let obj = {}
		if(companies.length > 0){
			for(let i =0;i <companies.length;i++){
			let id = companies[i]._id;
			const jobs = await Vacancy.find({_company: id, status: true}).select('_id')
		
		let appliedCandidatesArray = jobs.map(job => job._id)
		
		  let count = await Candidate.find({isDeleted: false, status: true, appliedJobs: {$in: appliedCandidatesArray}}).countDocuments() ;
		  obj[id] = count
		};
	} ;
		 return res.render(`${req.vPath}/admin/company`, {
			companies,
			jobs,
			perPage,
			totalPages,
			page,
			isChecked,
			count,
			data,
			obj,
			menu:'company',
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
			const industry = await Industry.find({ status: true });

			let formData = {};
			return res.render(`${req.vPath}/admin/company/add`, {
				country,
				industry,
				formData,
				menu:'addCompany'
			});
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})
	.post(async (req, res) => {
		try {
			const country = await Country.find({});
			const industry = await Industry.find({ status: true });

			let formData = req.body;
			const { email, mobile, designation, name } = req.body;

			const dataCheck = await User.findOne({
				email: email,
				isDeleted: false,
			});

			// console.log("dataattt", formData.companyName);
			if (dataCheck) {
				// req.flash("error", "Concerned Person email is already registered with us!");
				// return res.redirect("/admin/company/add");
				return res.render(`${req.vPath}/admin/company/add`, {
					formData,
					country,
					industry,
					error: "Concerned Person email is already registered with us!",
					menu:'addCompany'
				});
			}
			// throw req.ykError("Email already exist!");

			const dataCheckM = await User.findOne({ mobile, isDeleted: false });
			if (dataCheckM) {
				req.flash("error", "Mobile is already registered with us!!");
				return res.render(`${req.vPath}/admin/company/add`, {
					formData,
					country,
					industry,
					error: "Mobile is already registered with us!!",
					menu:'addCompany'
				});
			} // throw req.ykError("Mobile already exist!");

			const dataCheckM2 = await Company.findOne({
				email,
				isDeleted: false,
			});

			if (dataCheckM2) {
				req.flash("error", "CompanyEmail is already registered with us!");
				return res.render(`${req.vPath}/admin/company/add`, {
					formData,
					country,
					industry,
					error: "CompanyEmail is already registered with us!",
					menu:'addCompany'
				});
			}

			const pass = await generatePassword();

			const usr = await User.create({
				name,
				mobile,
				email,
				designation,
				role: 1,
			});

			bcrypt.hash(pass, 10, async function (err, hash) {
				let user = await User.findOneAndUpdate(
					{ email: usr.email },
					{
						password: hash,
					}
				);
			});
			// Send email here
			if (!usr) throw req.ykError("Company not create!");

			const {
				companyName,
				_industry,
				_subIndustry,
				companyEmail,
				linkedin,
				twitter,
				facebook,
				countryId,
				stateId,
				cityId,
				zipcode,
				headOAddress,
				description,
				logo,
				mediaGallery,
			} = req.body;

			let coins = await CoinsAlgo.findOne()

			const comp = await Company.create({
				_concernPerson: usr._id,
				name: companyName,
				email: companyEmail,
				_industry,
				_subIndustry,
				linkedin,
				twitter,
				facebook,
				countryId,
				stateId,
				cityId,
				zipcode,
				headOAddress,
				description,
				logo,
				mediaGallery,
				availableCredit: coins.companyCoins,
                creditLeft: coins.companyCoins
			});
			if (!comp) throw req.ykError("Company not create!");

			const { exeName, exeDesignation, exeImage, exeLinkedin } = req.body;

			if (exeName && exeName.length > 0) {
				exeName.forEach(async (s, i) => {
					if (s) {
						const objs = {
							_company: comp._id,
							name: s,
							designation: exeDesignation[i],
							image:
								exeImage != undefined || exeImage != null
									? exeImage[i]
									: "",
							linkedinUrl: exeLinkedin[i],
						};

						const exe = await CompanyExecutive.create(objs);
						if (!exe) throw req.ykError("Executive not create!");
					}
				});
			}

			// Send EMail - Nitin
			var web_url = `${baseUrl}/company/login`;
			var subject = "Welcome to Company Panel!";
			var message = ` 
			<html>
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
							<table border="0" cellspacing="0" style="width: 600px;">
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
																	style="position: relative; background-color: #FC2B5A; display: block; margin: 40px auto 0; width: 170px!important;background-repeat: no-repeat;padding-bottom: 40px; ">
															</a>
														</td>
													</tr>
													<tr>
														<td align="left" style="font-family:'Manrope',sans-serif!important">
															<br>
															<p
																style="text-align:left;line-height:32px;font-size:18px!important;font-family:'Manrope',sans-serif!important;margin:10px 50px !important;">
																Dear ${name},</p>
															<ul style="list-style-type:none;margin:10px 50px !important;padding-left:0px !important">
																<li style="padding-top:0px;margin-left:0px !important"><span
																		style="line-height:32px;font-size:18px!important;font-family:'Manrope',sans-serif!important">
																		Welcome to Focalyt Portal, a self-service tool
																		designed for your ease.</span></li>
																<br>
																<li style="padding-top:0px;margin-left:0px !important"><span
																		style="line-height:32px;color:#4d4d4d;font-size:18px!important;font-family:'Manrope',sans-serif!important">Email
																		: <a href="#"
																			target="_blank">${email}</a></span>
																</li>
																<li style="padding-top:0px;margin-left:0px !important"><span
																		style="line-height:32px;color:#4d4d4d;font-size:18px!important;font-family:'Manrope',sans-serif!important">Temporary
																		Password : ${pass}
																	</span></li>
																<br>
																<li style="padding-top:35px; text-align: center;">
                                                                    <span style="line-height:32px;color:#4d4d4d;font-size:18px!important;font-family:'Manrope',sans-serif!important">
                                                                      
																	<a
                                                                        href="${baseUrl}/company/login" style="background-color: #FC2B5A; border-radius: 50px;
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
														<td align="left"
															style=" font-family: 'manrope',sans-serif!important;">
															<ul
																style="list-style-type: none;margin:10px 50px !important;padding-left:0px !important;padding-top: 20!important;">
																<li style="padding-top:0px; margin-left:0px!important"><span
																		style="line-height:32px;font-size:18px!important;font-family:'Manrope',sans-serif!important">
																		Sincerely, <br/> Focalyt Group </span>
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
            window.location.href = "${baseUrl}/company/login"
        }
    </script>
					`;

			sendMail(subject, message, email);

			req.flash("success", "Company added successfully!");
			return res.redirect("/admin/company");
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
			const country = await Country.find({});
			const industry = await Industry.find({ status: true });

			const populate = {
				path: "_concernPerson",
				select: "name mobile designation email",
			};
			const company = await Company.findOne({_id: id})
				.populate(populate)
				.populate({
					path: "_industry ",
					select: "name",
				});

			const subindustry = await SubIndustry.find({
				_industry: company._industry,
			});
			if (!company) throw req.ykError("company not found!");
			const CompanyExec = await CompanyExecutive.find(
				{ _company: company._id },
				{}
			);
			const state = await State.find({ countryId: 101 });
			const selectedState = await State.findOne({_id: company.stateId})
			let city = []
			
			if(selectedState){
				city = await City.find({ stateId: selectedState.stateId });
			}

			return res.render(`${req.vPath}/admin/company/edit`, {
				country,
				industry,
				subindustry,
				company,
				CompanyExec,
				state,
				city,
				menu:'company'
			});
		} catch (err) {
			console.log('=========> err ', err)
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})
	.post(async (req, res) => {
		try {
			req.body.cname = req.body.name;
			req.body.name = req.body.companyName;
			req.body.concerEmail = req.body.email;
			req.body.email = req.body.companyEmail;
			const cmpyUpdate = await Company.findByIdAndUpdate(
				req.params.id,
				req.body
			);
			req.body._exeid = req.body._exeid.filter(function (el) {
				return el != "";
			});
			if (req.body._exeid.length > 0) {
				await CompanyExecutive.remove({
					_id: { $nin: req.body._exeid },
					_company: req.params.id,
				});
			}

			let concerObj = {
				name: req.body.cname,
				designation: req.body.designation,
				email: req.body.concerEmail,
				mobile: req.body.mobile,
			};
			let exe = await User.findByIdAndUpdate(
				{ _id: cmpyUpdate._concernPerson },
				concerObj
			);

			if (req.body.exeName && req.body.exeName.length > 0) {
				req.body.exeName.forEach(async (s, i) => {
					if (s != "") {
						if (
							req.body._exeid[i] != "" &&
							req.body._exeid[i] != undefined
						) {
							let objs = {
								name: s,
								designation: req.body.exeDesignation[i],
								image:
									req.body.exeImage != undefined ||
									req.body.exeImage != null
										? req.body.exeImage[i]
										: "",
								linkedinUrl: req.body.exeLinkedin[i],
							};
							var id = new mongoose.Types.ObjectId(req.body._exeid[i]);
							// var id = ObjectId.fromString(req.body._id[i]);
							let exe = await CompanyExecutive.findByIdAndUpdate(
								{ _id: id },
								objs
							);

							//	if (!exe) throw req.ykError("Executive not create!");
						} else {
							let objs = {
								_company: req.params.id,
								name: s,
								designation: req.body.exeDesignation[i],
								image:
									req.body.exeImage != undefined ||
									req.body.exeImage != null
										? req.body.exeImage[i]
										: "",
								linkedinUrl: req.body.exeLinkedin[i],
							};
							let exe = await CompanyExecutive.create(objs);
						}
					}
				});
			}
			if (!cmpyUpdate) throw req.ykError("Company not updated!");
			req.flash("success", "Company updated successfully!");
			return res.redirect("/admin/company");
		} catch (err) {
			console.log(err);
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});

//view company
router.route("/view/:id").get(async (req, res) => {
	try {
		const { id } = req.params;
		const country = await Country.find({});
		const industry = await Industry.find({ status: true });
		const populate = {
			path: "_concernPerson",
			select: "name mobile designation email",
		};
		const company = await Company.findById(id).populate(populate).populate({
			path: "_industry",
			select: "name",
		});
		const subindustry = await SubIndustry.find({
			_industry: company._industry,
		});
		if (!company) throw req.ykError("company not found!");
		const CompanyExec = await CompanyExecutive.find(
			{ _company: company._id },
			{}
		);
		const state = await State.find({ countryId: company.countryId });
		const city = await City.find({ stateId: company.stateId });
		return res.render(`${req.vPath}/admin/company/view`, {
			country,
			industry,
			subindustry,
			company,
			CompanyExec,
			state,
			city,
			menu:'company'
		});
	} catch (err) {
		req.flash("error", err.message || "Something went wrong!");
		return res.redirect("back");
	}
});
router.route("/getApplicationCount/:companyId").get(async (req, res) => {
	try {
		const { companyId } = req.params;

		const jobs = await Vacancy.find({_company: companyId, status: true}).select('_id')

		let applicationCount = 0
		let appliedCandidatesArray = jobs.map(job => job._id)
		
		  applicationCount = await Candidate.find({isDeleted: false, status: true, appliedJobs: {$in: appliedCandidatesArray}}).countDocuments()
			res.send({ status: 200, applicationCount });
	} catch (err) {
		console.log('==================> err ', err)
	}
});


router.get('/backfill', async (req, res) => {
			try{
				let cand = await Candidate.updateMany({},{$set: {isProfileCompleted: false, flag: true}},{new:true})
				let all = await Candidate.updateMany(
					{
						name: {$exists: true, $ne: null, $ne:''},
						mobile: {$exists: true, $ne: null},
						state: {$exists: true, $ne: null},
						city: {$exists: true, $ne: null},
						sex:{$exists:true,$ne:null,$ne:''},
						whatsapp:{$exists: true, $ne: null},
						highestQualification:{$exists: true, $ne: null, $ne:''},
						isExperienced:{$exists: true, $ne: null},
					}, {$set: {isProfileCompleted: true, flag: true}},{new:true})
		
				res.send({msg: "Backfill done", allTrue: all, all: cand})
		
			}catch(err){
				console.log(err)
			}
		
		})


module.exports = router;
