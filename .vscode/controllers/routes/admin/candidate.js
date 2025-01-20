const express = require("express");
const { extraEdgeAuthToken ,extraEdgeUrl} = require("../../../config");
const axios = require("axios");
let fs = require("fs");
let path = require("path");
const moment = require("moment");
const { auth1, isAdmin } = require("../../../helpers");
const readXlsxFile = require("read-excel-file/node");
const { parseAsync } = require('json2csv');
const csv = require('fast-csv');
const candidateServices = require('../services/candidate')

const {
	Import,
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
	CandidateDoc
} = require("../../models");

const { generatePassword, sendMail, getTechSkills, getNonTechSkills,sendSms } = require("../../../helpers");
const { msg91ProfileStrengthening ,env} = require("../../../config")
const router = express.Router();
const { candidateCashbackEventName, cashbackRequestStatus, cashbackEventType, kycStatus } = require('../../db/constant');
router.use(isAdmin);

router.route("/")
	.get(auth1,async (req, res) => {
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
				isDeleted : false,
				status : true,
				isProfileCompleted:false
			}

			let numberCheck = isNaN(data?.name)
			let name = ''
			
			var format = `/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;`;
			data?.name?.split('').some(char => 
				{
					if(!format.includes(char))
					name+= char
				})
			
			if (name && numberCheck) {
				filter["$or"] = [
					{ "name":{ "$regex": name, "$options": "i"}},
				]
				smsFilter["$or"] = [
					{ "name":{ "$regex": name, "$options": "i"}},
				]
			}
			if (name && !numberCheck ) {
				filter["$or"] = [
					{ "name":{ "$regex": name, "$options": "i"}},
					{ "mobile": Number(name )},
				    { "whatsapp": Number(name) }
				]
				smsFilter["$or"] = [
					{ "name":{ "$regex": name, "$options": "i"}},
					{ "mobile": Number(name )},
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
			if( value && order ){
				sorting[value] = Number(order)
			}else{
				sorting = { createdAt: -1 }
			}
			let agg = candidateServices.adminCandidatesList(sorting, perPage, page, candidateCashbackEventName.cashbackrequestaccepted, { value, order}, filter)
			let candidates = await Candidate.aggregate(agg)
			const totalPages = Math.ceil(count / perPage);
			const smsHistory = await SmsHistory.findOne().sort({createdAt:-1}).select("createdAt count")
			return res.render(`${req.vPath}/admin/candidate`, {
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
			console.log(err)
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})


router
	.route("/deleteCSV")
	.delete(async (req, res) => {
		try {
			fs.unlink("public/documents/candidates.csv", (err) => {
				if (err) {
					console.log(err);
					return res.send({ sucess: false, err })
				}

				return res.send({ sucess: true })
			})

		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})

router.route("/listing").get(auth1, async (req, res) => {
	try {
		const perPage = 5;
		const p = parseInt(req.query.page, 10);
		const page = p || 1;
		const count = await Import.countDocuments({});
		const imports = await Import.find({})
			.sort({ createdAt: -1 })
			.skip(perPage * page - perPage)
			.limit(perPage);
		const totalPages = Math.ceil(count / perPage);

		return res.render(`${req.vPath}/admin/candidate/listing`, {
			imports,
			perPage,
			totalPages,
			page,
		});
	} catch (err) {
		req.flash("error", err.message || "Something went wrong!");
		return res.redirect("/admin/candidate/listing");
	}
});

router
	.route("/bulkUpload")
	.get(auth1, async (req, res) => {
		try {
			const perPage = 5;
			const p = parseInt(req.query.page, 10);
			const page = p || 1;
			const totalPages = 0;
			let imports = await Import.find({ status: "Completed" })
				.sort({ createdAt: -1 })
			return res.render(`${req.vPath}/admin/candidate/bulkUpload`, {
				perPage,
				totalPages,
				page,
				menu: 'candidate-upload',
				imports
			});
		} catch (err) {
			console.log('===================> err ', err)
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("/admin/candidate/bulkUpload");
		}
	})
	.post(auth1, async (req, res) => {
		try {
			if (req.files == undefined) {
				req.flash("error", "Please select file ");
				return res.redirect("/admin/candidate/bulkUpload");
			}
			var data1 = req.files.filename;
			if (!req.files.filename) {
				req.flash("error", "Please select file ");
				return res.redirect("/admin/candidate/bulkUpload");
			}
			if (req.files.filenameta1 == "") {
				req.flash("error", "Please select file ");
				return res.redirect("/admin/candidate/bulkUpload");
			}
			var checkFileError = true;
			let extension = req.files.filename.name.split(".").pop();
			if (extension !== "ods" && extension !== "xlsx" && extension !== "xls" && extension !== "xl") {
				console.log("upload excel file only");
				req.flash("error", "Excel format not matched.");
				return res.redirect("/admin/candidate/bulkUpload");
			}
			filename = new Date().getTime() + "_" + data1.name;
			const write = fs.writeFile("public/" + filename, data1.data, (err) => {
				if (err) {
					console.log(err);
				}
				console.log("********* File Upload successfully!");
			});
			// const dirPath = path.join(__dirname, "../../../public/") + filename;
			//try {
			
			let errorMessages = []
			await readXlsxFile(
				path.join(__dirname, "../../../public/" + filename)
			).then((rows) => {
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
					rows[0][11] !== 'Experienced'
				) {
					checkFileError = false;
				} else {
					checkFileError = true;
				}
			}).catch(err => {
				console.log('readClsxFile error========>>>>>>', err.message)
				req.flash("error", "Caught error while reading file.");
				return res.redirect("/admin/candidate/bulkUpload");
			})

			if (checkFileError == false) {
				req.flash("error", "Please upload right pattern file");
				return res.redirect("/admin/candidate/bulkUpload");
			} else {
				let allRows = []
				await readXlsxFile(
					path.join(__dirname, "../../../public/" + filename)
				).then(async (rowsList) => {
					rowsList.shift();
					for (const [index, rows] of rowsList.entries()) {
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
						} else {
							message += `Email `
						};
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

							if(!user) {
								errorMessages.push(`User not created for row ${index + 1}.`)
								continue;
							}

							const coins = await CoinsAlgo.findOne()
							let cityData = await City.findOne({_id:cityId,status: { $ne: false }}).select({location: 1 , _id:0})
							let obj = cityData.toObject()
							let addCandidate = {
								isImported: true,
								isProfileCompleted: true,
								availableCredit: coins.candidateCoins,
								creditLeft: coins.candidateCoins,
								location : obj.location
							};
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

							const candidate = await Candidate.create(addCandidate)
							if (!candidate) {
								console.log(addCandidate, "candidate not created", "row number is =>>>>>>>", recordCount)
								errorMessages.push(`Candidate not created for row ${index + 1}.`)
								continue;
							}
							// else{
							// 	let city = await City.findOne({_id:cityId}).select("name")
							// 	let state = await State.findOne({_id:stateId}).select("name")
							//if(env.toLowerCase()==='production'){
							// 	let dataFormat = {
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
						      //}
							// }
						} else {
							errorMessages.push(`Candidate/User with mobile ${mobile} already exists for row ${index + 1}.`)
						}
					}
					var imports = {
						name: req.files.filename.name,
						message: errorMessages.length<=0 ? "success" : errorMessages.join('</br>'),
						status: "Completed",
						record: allRows.length
					};
					console.log(
						"--------------------- REcord INSERTED ---------------------------"
					);
					console.log(imports);
					await Import.create(imports);

					console.log('========================> allRows ', allRows.length)

				if (allRows.length > 0) {
					req.flash("success", "Data uploaded successfully");
				}

				return res.redirect("/admin/candidate/bulkUpload");
				});

			}
		} catch (err) {
			console.log("error================>>>>>>>>>>>>>>>>", err.message)
		}
	});

router
	.route("/add")
	.get(auth1, async (req, res) => {
		try {
			let formData = {};
			const country = await Country.find({});
			const qualification = await Qualification.find({ status: true });
			const skill = await Skill.find({ status: true });
			const techSkill = skill.filter((x) => x.type === "technical");
			const nonTechSkill = skill.filter((x) => x.type === "non technical");
			return res.render(`${req.vPath}/admin/candidate/add`, {
				country,
				qualification,
				techSkill,
				nonTechSkill,
				formData,
				menu: 'addCandidate'
			});
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})
	.post(auth1, async (req, res) => {
		try {
			let formData = req.body;
			const { mobile, email } = req.body;
			const country = await Country.find({});
			const qualification = await Qualification.find({ status: true });
			const skill = await Skill.find({ status: true });
			const techSkill = skill.filter((x) => x.type === "technical");
			const nonTechSkill = skill.filter((x) => x.type === "non technical");
			const dataCheck = await Candidate.findOne({ mobile: mobile });
			if (dataCheck) {
				//throw req.ykError("Mobile number already exist!");
				// req.flash("Error", "Mobile number already exist!");
				return res.render(`${req.vPath}/college/candidate/add`, {
					formData,
					country,
					qualification,
					skill,
					techSkill,
					nonTechSkill,
					error: "Mobile number already exist!",
				});
			}

			const datacheck2 = await User.findOne({ email: email });
			if (datacheck2) {
				return res.render(`${req.vPath}/college/candidate/add`, {
					formData,
					country,
					qualification,
					skill,
					techSkill,
					nonTechSkill,
					error: "Candidate email already exist!",
				});
			}

			const dataCheck1 = await Candidate.findOne({ email: email });
			if (dataCheck1) {
				//throw req.ykError("Mobile number already exist!");
				// req.flash("Error", "Email already exist!");

				return res.render(`${req.vPath}/admin/candidate/add`, {
					formData,
					country,
					qualification,
					skill,
					techSkill,
					nonTechSkill,
					error: "Email already exist!",
				});
			}
			//return res.redirect("/college/candidate");


			const session = req.body.sessionStart
				.concat("-")
				.concat(req.body.sessionEnd);
			const collegedetail = await College.findOne({
				_concernPerson: req.session.user._id,
			});
			// if (!req.body._subQualification) {
			//   req.body._subQualification = '[]';
			// }

			// _subqualification check if no substream selected  eg: BCA
			// console.log(req.body._subQualification);
			let unset = {};
			if (
				req.body._subQualification == undefined ||
				req.body._subQualification == "Select Option"
			) {
				delete req.body._subQualification;
			}
			// console.log(req.body);

			// const candidate = await Candidate.create({
			// 	...req.body,
			// 	session,
			// });

			const password = await generatePassword();

			const { name } = req.body;

			const usr = await User.create({
				name,
				email,
				mobile,
				password,
				role: 3,
			});
			if (!usr) throw req.ykError("candidate user not create!");

			const candidate = await Candidate.create({
				...req.body,
				session,
				_concernPerson: collegedetail._concernPerson,
				_college: collegedetail._id,
			});

			if (!candidate) throw req.ykError("Candidate not create!");
			req.flash("success", "Candidate added successfully!");
			return res.redirect("/admin/candidate");
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});
router.route("/sendNotification")
      .post(auth1,async(req,res)=>{
		try{
			const {title,message,candidateId}=req.body;
			const notificationUpdate=await Notification.create({_candidate:candidateId,title,message,source:'Admin'})
			if(!notificationUpdate){
				res.status(400).send({status:false,message:"Notification not send"})
			}
			res.status(200).send({status:true,message:"Notification send successfully"})
		}catch(err){
			req.flash('error',err.message)
		}
	  })
router
	.route("/edit/:id")
	.get(auth1, async (req, res) => {
		try {
			const { id } = req.params;
			const country = await Country.find({});
			const qualification = await Qualification.find({ status: true });
			const skill = await Skill.find({ status: true });
			const techSkill = skill.filter((x) => x.type === "technical");
			const nonTechSkill = skill.filter((x) => x.type === "non technical");
			const candidate = await Candidate.findById(id).populate([{ path: 'state', select: ['name', 'stateId'] }]);
			if (!candidate) throw req.ykError("Candidate not found!");
			const state = await State.find({ countryId: '101', status: { $ne: false } });
			const city = await City.find({ stateId: candidate.state?.stateId, status: { $ne: false } });
			const Universities = await University.find({ status: true })
			const subqual = await SubQualification.find({
				status: true
			})
			return res.render(`${req.vPath}/admin/candidate/edit`, {
				country,
				qualification,
				techSkill,
				nonTechSkill,
				state,
				city,
				subqual,
				candidate,
				Universities,
				menu: 'candidate'
			});
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})


	router
  .route("/candidatedoc/:id")
  .get(auth1, async (req, res) => {
    try {
      const { id } = req.params; 
      
      const candidate = await Candidate.findById(id).populate([
        { path: 'state', select: ['name', 'stateId'] }
      ]);
      if (!candidate) throw req.ykError("Candidate not found!");
      
      const documents = await CandidateDoc.findOne({ _candidate: id });
    //   if (!documents) throw req.ykError	Candidate document not found!");

      return res.render(`${req.vPath}/admin/candidate/candidatedoc`, {
        candidate,
        documents,  	
        menu: 'candidatedoc'
      });
    } catch (err) {
      req.flash("error", err.message || "Something went wrong!");
      return res.redirect("back");
    }
  });

router
.route("/candidatedoc")
.delete(auth1,async(req,res)=>{
	try {
		const documentName = req.query.documentName; 
		const id=req.query.id 
		console.log(documentName, "this is document name");
		
		const updateResult = await CandidateDoc.updateOne(
		  { _id: id, [documentName]: { $exists: true } },
		  { $set: { [documentName]: "" } }
	  );
  
		const 	documents = await CandidateDoc.findOne({ _id: id }).lean();
		console.log(documents, "documents after delete");
        

		const updateadditionaldoc = await CandidateDoc.updateOne(
			{ _id: id },
			{ $pull: { AdditionalDocuments: documentName } }  
		  );
	

		const  candidate = await Candidate.findOne({_id:documents._candidate})
   
		res.render(`${req.vPath}/admin/candidate/candidatedoc`, {
			menu: 'candidatedoc',
			success:true,
			candidate,
			documents: documents || {},  
			message: "Document deleted successfully"
		});   	
	} catch (error) {
		req.flash("error",err.message || "Something went wrong!")
	}
})


router.route("/createResume/:id").get(auth1, async (req, res) => {
	try {
		const dataObj = {
			id: req.params.id,
			reCreate: !!req.query.reCreate,
			url: `${req.protocol}://${req.get("host")}/candidateForm/${req.params.id
				}`,
		};

		const candidate = await Candidate.findById(req.params.id);
		if (!candidate || !candidate._id)
			throw req.ykError("No candidate found!");
		const { data } = await axios.post(
			"http://15.206.9.185:3027/pdfFromUrl",
			dataObj
		);

		if (!data || !data.status || !data.data || !data.data.bucketFileName)
			throw req.ykError("Unable to create pdf!");
		const { bucketFileName: enrollmentFormPdfLink } = data.data;
		const cand = await Candidate.findByIdAndUpdate(req.params.id, {
			enrollmentFormPdfLink,
		});
		if (!cand) throw req.ykError("Unable to create pdf!");
		req.flash("success", "Create pdf successfully!");
		return res.redirect("/admin/candidate");
	} catch (err) {
		req.flash("error", err.message || "Something went wrong!");
		return res.redirect("back");
	}
});
router.route("/single").get(auth1, function (req, res) {
	res.download("public/StudentSampleData.xlsx", function (err) {
		if (err) {
			console.log(err);
		}
	});
});

router
	.route("/details/:id")
	.get([auth1, isAdmin], async (req, res) => {
		try {
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

			const { fromDate, toDate, status } = req.query
			let filter = {}
			if(fromDate && toDate){
			  let fdate = moment(fromDate).utcOffset("+05:30").startOf('day').toDate()
			  let tdate = moment(toDate).utcOffset("+05:30").endOf('day').toDate()
			  filter["createdAt"] = { $gte: fdate, $lte: tdate }
			}else if(fromDate){
			  let fdate = moment(fromDate).utcOffset("+05:30").startOf('day').toDate()
			  filter["createdAt"] = { $gte: fdate }
			}else if(toDate){
			  let tdate = moment(toDate).utcOffset("+05:30").endOf('day').toDate()
			  filter["createdAt"] = { $lte: tdate }
			}
			if(status){
			  filter["status"] = status
			}		
			const count = await Referral.countDocuments({referredBy:req.params.id, ...filter})
			const p = parseInt(req.query.page);
			const page = p || 1;
			let perPage = 10
			const totalPages = Math.ceil(count / perPage); 		
			const referral = await Referral.find({referredBy:req.params.id, ...filter}).populate([{path:'referredTo', select:'name mobile '}]).skip(perPage * page - perPage).limit(perPage)

			res.render(`${req.vPath}/admin/candidate/candidateProfile`, {
				candidate,
				qualification,
				menu: 'candidate',
				referral,
				count,
				data: req.query,
				totalPages,
				page
			});
		} catch (err) {
			console.log('===============> err', err)
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})

router
	.route("/downloadCSV")
	.post(auth1, async (req, res) => {
		try {
			const { FromDate, ToDate ,username,isProfileCompleted} = req.body;
			let candidates, fdate, tdate,filter = { isDeleted: false };
			if (FromDate && ToDate) {
				let fdate = moment(FromDate).utcOffset("+05:30").startOf('day').toDate()
				let tdate = moment(ToDate).utcOffset("+05:30").endOf('day').toDate()
				filter["createdAt"] = {
					$gte: fdate,
					$lte: tdate
				}
			}

			if (isProfileCompleted && isProfileCompleted !== 'All') {
				filter["isProfileCompleted"] = isProfileCompleted == 'true' ? true : false
			}

			let numberCheck = isNaN(username)
			let name = ''
			
			var format = `/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;`;
			username?.split('').some(char => 
				{
					if(!format.includes(char))
					name+= char
				})
			
			if (name && numberCheck) {
				filter["$or"] = [
					{ "name":{ "$regex": name, "$options": "i"}},
				]
			}
			if (name && !numberCheck ) {
				filter["$or"] = [
					{ "name":{ "$regex": name, "$options": "i"}},
					{ "mobile": Number(name )},
				    { "whatsapp": Number(name) }
				]
			}
			const populate = [
				{ path: "state", select: "name -_id" },
				{ path: "city", select: "name -_id" },
			]
			candidates = await Candidate.find(filter).populate(populate).select("name mobile whatsapp email sex status highestQualification totalExperience isExperienced isProfileCompleted createdAt updatedAt")
				.sort({ createdAt: -1 })

			if (candidates.length > 0) {
				const qualification = await Qualification.find({ status: true }).sort({ basic: -1 }).select("name")
				candidates.forEach((cand) => {
					qualification.find((i) => {
						if (i._id == cand.highestQualification) {
							cand.highestQualification = i.name
						}
					})
				})
			}

			const fields = ['name', 'mobile', 'whatsapp', 'email', 'sex', 'status', 'highestQualification', 'totalExperience', 'isExperienced', 'isProfileCompleted', 'createdAt', 'updatedAt', 'state', 'city'];
			const opts = { fields };

			parseAsync(candidates, opts)
				.then(csv => fs.writeFile("public/documents/candidates.csv", csv, (err) => {
					if (err) {
						console.log(err);
						return res.send({ sucess: false, err })
					}
					res.set('Content-Type', 'text/csv');
					return res.sendFile(path.join(__dirname, '../../../public/documents/candidates.csv'))
					// return res.send({ sucess: true, path: `${req.protocol}://${req.get("host")}/documents/candidates.csv` })
				}))

				.catch(err => {
					return res.send({ sucess: false, err })
				});

		} catch (err) {
			console.log(err)
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})

router
	.route('/editProfile/:id')
	.post([auth1, isAdmin], async (req, res) => {
		try {
			const { personalInfo, qualifications, technicalskills, nontechnicalskills, highestQualification } = req.body;
			const candidateId = req.params.id
			const updatedFields = {};
			Object.keys(personalInfo).forEach(async key => {
				if (personalInfo[key] !== '') {
					updatedFields[key] = personalInfo[key];
				}
			});
			const user = await Candidate.findOne({ _id: candidateId, status: true, isDeleted: false });
			if (qualifications.length > 0) {
				updatedFields['qualifications'] = qualifications;
			}
			if (highestQualification) {
				updatedFields['highestQualification'] = highestQualification
			}
			if (technicalskills.length > 0) {
				let technicalSkill = await getTechSkills(technicalskills);
				updatedFields['techSkills'] = technicalSkill;
			}
			if (nontechnicalskills.length > 0) {
				let nonTechnicalSkill = await getNonTechSkills(nontechnicalskills);
				updatedFields['nonTechSkills'] = nonTechnicalSkill;
			}
			const candidateUpdate = await Candidate.findByIdAndUpdate({ _id: candidateId, status: true, isDeleted: false }, updatedFields);
			if (!candidateUpdate) {
				return res.status(400).send({ status: false, message: "Can't update candidate" })
			}
			if (personalInfo.email) {
				await User.findOneAndUpdate({ mobile: user.mobile, role: 3 }, { email: personalInfo.email }, { new: true })
			}
			return res.send({ status: true, message: "Profile Updated Successfully" })
			//req.flash("success", "Candidate updated successfully!"); 
			// return res.redirect("/admin/candidate");
		}
		catch (err) {
			console.log(err);
			return res.status(err)
		}
	})
router.post("/changeprofilestatus",[isAdmin],async(req,res)=>{
	let {status,mobile}=req.body;
    const updateCandidate=await Candidate.findOneAndUpdate({mobile:mobile},{visibility:status})
	console.log("updatedCandidate",updateCandidate)
	res.send({status:true,message:"Visibility updated successfully!"})
})
router.get('/getcitiesbyId', async (req, res) => {
	try {
		const { stateId } = req.query
		const state = await State.findOne({ _id: stateId, status: { $ne: false } })

		const cityValues = await City.find({ stateId: state.stateId, status: { $ne: false } });
		res.status(200).send(cityValues);
	}
	catch (err) {
		console.log(err)
	}

})

router.post('/removelogo', [auth1, isAdmin], async (req, res) => {
	try {
		const { mobile } = req.query
		const candidate = await Candidate.findOne({ mobile: mobile })
		if (!candidate) throw req.ykError("candidate doesn't exist!");

		const candidateUpdate = await Candidate.findOneAndUpdate({ mobile: mobile }, { image: '' });
		if (!candidateUpdate) throw req.ykError("Candidate not updated!");
		req.flash("success", "candidate updated successfully!");
		res.send({ status: 200, message: "Profile Updated Successfully" })
	}
	catch (err) {
		console.log(err)
	}
})

router.get('/getSubQualification', async (req, res) => {
	const { qualificationId } = req.query
	const subQualification = await SubQualification.find({ status: true, _qualification: qualificationId })
	if (!subQualification) {
		res.status(200).send({ status: false, message: 'No Subqualifications present' });
	}
	res.status(200).send({ status: true, subQualification });
})
router.get('/backfill', async (req, res) => {
	try {
		const data = [];
		fs.createReadStream('public/candidates.csv')
			.pipe(csv.parse({ headers: true }))
			.on('error', error => console.error(error))
			.on('data', row => data.push(row))
			.on('end', (async (row) => {
				for (let i = 0; i < data.length; i++) {
					const phone = data[i].mobile
					let cand = await Candidate.findOne({ mobile: phone }).populate([{ path: "city", select: "name" }, { path: "state", select: "name" }])
					let loc = ''
					if (cand) {
						loc = cand?.city?.name + " ," + cand?.state?.name
						let candidate = await Candidate.findOneAndUpdate({
							mobile: data[i].mobile
						}, {
							$set: { place: loc }
						})
						if (!candidate) {
							res.send({ status: false, message: "Candidates not updated successfully!" })
						}
					}
				}
			}))
	} catch (err) {
		res.send({ status: false, err })
	}
})

router.post('/bulkSMS', async(req,res) => {
	try{
		let {isProfileCompleted , name,fromDate,toDate,count} = req.body;
		let smsCount;
		if(env.toLowerCase()!='production'){
			smsCount = 2
		  }
		let filter = {
			isDeleted: false,
			status : true,
			isProfileCompleted
		};
		if (name) {
			filter["name"] = {
				"$regex": name,
				"$options": "i"
			}
		}
		if (fromDate && toDate) {
			let fdate = moment(fromDate).utcOffset("+05:30").startOf('day')
			let tdate = moment(toDate).utcOffset("+05:30").endOf('day')
			filter["createdAt"] = {
				$gte: fdate,
				$lte: tdate
			}
		}
		let user = await User.findOne({_id:req.session.user._id,status:true})
		if (!user || user === null)
        throw req.ykError("User not found. Enter a valid credentials");

		const candidates = await Candidate.find(filter).select("name mobile").limit(smsCount)
		let recipients= []
		candidates.forEach((i)=>{
        let data = {}
		if(i.mobile){
        let phone = '91' + i.mobile.toString();
        let num = parseInt(phone)
        data["mobiles"] = num
        data["candidatename"] = i.name
        recipients.push(data)
		}
        })
        let body = {
			flow_id:msg91ProfileStrengthening,
			recipients
		}
		let sms = {
			count,
			module:'Candidate',
			userId:user._id
		}
        const data = sendSms(body);
		const smsHistory = await SmsHistory.create(sms)
        return res.status(200).send({ status: true, message: data.type });
	}
	catch(err){
		console.log(err);
		return res.status(500).send({status:false,message:err})
	}
})

router.route('/cashbackRequest')
.get(async (req, res) => {
	try{
		let view = false
		let data = req.query;
		if (req.session.user.role === 10) {
			view = true
		}
		const perPage = 10;
		const p = parseInt(req.query.page, 10);
		const page = p || 1;

		let filter = { }
		let numberCheck = isNaN(data.name)
			let name = ''
			
			var format = `/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;`;
			data.name?.split('').some(char => 
				{
					if(!format.includes(char))
					name+= char
				})
			
			if (name && numberCheck) {
				filter["$or"] = [
					{ "_candidate.name":{ "$regex": name, "$options": "i"}},
				]
			}
			if (name && !numberCheck ) {
				filter["$or"] = [
					{ "_candidate.name":{ "$regex": name, "$options": "i"}},
					{ "_candidate.mobile": Number(name )},
				    { "_candidate.whatsapp": Number(name) }
				]
			}

			if(data.date){
				let fdate = moment(data.date).utcOffset("+05:30").startOf('day').toDate()
				let tdate = moment(data.date).utcOffset("+05:30").endOf('day').toDate()
				filter["createdAt"] = {
					$gte: fdate,
					$lte: tdate
				}
			}

			if(data.status === cashbackRequestStatus.paid){
				filter["status"] = cashbackRequestStatus.paid
			}
			if(data.status === cashbackRequestStatus.rejected){
				filter["status"] = cashbackRequestStatus.rejected
			}
			if(data.status === cashbackRequestStatus.pending){
				filter["status"] = cashbackRequestStatus.pending
			}
		
		let agg = [
		{
			'$lookup':
			{
				from : 'candidates',
				localField: '_candidate',
                foreignField: '_id',
                as: '_candidate'
			}

		},
		{
			'$unwind' : '$_candidate'
		},
		{
			'$match': filter
		},
		{
		  '$facet' : {
			metadata: [ { '$count': "total" } ],
			data: [ { $skip: perPage * page - perPage }, { $limit: perPage } ] 
		  }
		}]
		let cashback = await CashBackRequest.aggregate(agg)
		let cashbackRequests = cashback[0].data
		
		let count = cashback[0].metadata[0]?.total
		const totalPages = Math.ceil(count / perPage);
		res.render(`${req.vPath}/admin/candidate/cashbackRequests`, {
			menu: 'candidate-cashbackRequest', cashbackRequests, totalPages, page, perPage, count, view,data
		})
	}catch(err){
		console.log(err.message)
		req.flash("error", err.message || "Something went wrong!");
		return res.redirect("back");
	}
})
.post(async (req, res) => {
	try{
		let { requestId, isAccepted, candidateId, comment,isPaid } = req.body
		let status = cashbackRequestStatus.rejected
		if(isAccepted == true){
			status =  cashbackRequestStatus.paid
		}
		let updates = {status, isAccepted}
		if(comment)
		updates['comment'] = comment

		if(isPaid)
		updates['isPaid'] = isPaid
		
		let updateRequest = await CashBackRequest.findOneAndUpdate(
			{_id: requestId},
			updates
			)
		if(!updateRequest){
			req.flash("error", "Updation failed!")
			return res.redirect("back")
		}
	
		if(isAccepted == false){
			let add = {
				candidateId: candidateId,
				eventType: cashbackEventType.credit,
				eventName: candidateCashbackEventName.cashbackrequestrejected,
				amount: updateRequest.amount,
				isPending: true,
			  };
			if(comment){
				add['comment'] = comment
			}
			let addCashback = await CandidateCashBack.create(add)
			if(!addCashback){
				req.flash("error", "Cashback not added!")
				return res.redirect("back")
			}
			let updateStatus = await CandidateCashBack.findOneAndUpdate(
				{_id: updateRequest._cashback},
				{isPending: false}
			)
			if(!updateStatus){
				req.flash("error", "Previous Cashbacks updation failed!")
				return res.redirect("back")
			}

		}else{
			let updateCashback = await CandidateCashBack.findOneAndUpdate(
				{_id: updateRequest._cashback},
				{isPending: false, eventName: candidateCashbackEventName.cashbackrequestaccepted}
			)
			if(!updateCashback){
				req.flash("error", "Cashbacks updation failed!")
				return res.redirect("back")
			}
		}
		req.flash("success", "Request Updated!")
		return res.status(201).send({status: true, msg: 'Request Updated!'})
	}catch(err){
		console.log(err.message)
	}
})

router.route('/kycRequest')
.get(async (req, res) => {
	try{
		let data = req.query;
		let view = false
		if (req.session.user.role === 10) {
			view = true
		}
		let filter = { }
		let numberCheck = isNaN(data.name)
			let name = ''
			
			var format = `/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;`;
			data.name?.split('').some(char => 
				{
					if(!format.includes(char))
					name+= char
				})
			
			if (name && numberCheck) {
				filter["$or"] = [
					{ "_candidate.name":{ "$regex": name, "$options": "i"}},
				]
			}
			if (name && !numberCheck ) {
				filter["$or"] = [
					{ "_candidate.name":{ "$regex": name, "$options": "i"}},
					{ "_candidate.mobile": Number(name )},
				    { "_candidate.whatsapp": Number(name) }
				]
			}

			if(data.date){
				let fdate = moment(data.date).utcOffset("+05:30").startOf('day').toDate()
				let tdate = moment(data.date).utcOffset("+05:30").endOf('day').toDate()
				filter["createdAt"] = {
					$gte: fdate,
					$lte: tdate
				}
			}

		const perPage = 10;
		const p = parseInt(req.query.page, 10);
		const page = p || 1;

		const agg = [
		{
			'$lookup':
			{
				from : 'candidates',
				localField: '_candidate',
                foreignField: '_id',
                as: '_candidate'
			}

		},
		{
			'$unwind' : '$_candidate'
		},
		{
			'$match': filter
		},
		{
		  '$facet' : {
			metadata: [ { '$count': "total" } ],
			data: [ { $skip: perPage * page - perPage }, { $limit: perPage } ] 
		  }
		}]
		let kyc = await KycDocument.aggregate(agg)
		let count = kyc[0].metadata[0]?.total
		if(!count){
		  count = 0
		}
		let kycRequests = kyc[0].data
		const totalPages = Math.ceil(count / perPage);
		res.render(`${req.vPath}/admin/candidate/kycRequests`, {
			menu: 'candidate-kycRequest', kycRequests, totalPages, page, perPage, count, view, data
		})
	}catch(err){
		console.log(err.message)
		req.flash("error", err.message || "Something went wrong!");
		return res.redirect("back");
	}
})
.post(async (req, res) => {
	try{
		let { kycCompleted, _candidate, comment } = req.body
		let add = { kycCompleted }
		if(comment){ add['comment'] = comment }
		if(kycCompleted == true){ add['status'] = kycStatus.accepted }
		else{ add['status'] = kycStatus.rejected }

		let updateRequest = await KycDocument.findOneAndUpdate(
			{_candidate},
			add
			)
		if(!updateRequest){
			req.flash("error", "Updation failed!")
			return res.redirect("back")
		}
		req.flash("success", "Request Updated!")
		return res.status(201).send({status: true, msg: 'Request Updated!'})
	}catch(err){
		console.log(err.message)
	}
})


module.exports = router;
