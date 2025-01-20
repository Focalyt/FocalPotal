const express = require("express");
const axios = require("axios");
let fs = require("fs");
let path = require("path");
const { auth1 } = require("../../../helpers");
const fileupload = require("express-fileupload");
const readXlsxFile = require("read-excel-file/node");
// const csv = require("csv-parser");
const csv = require("fast-csv");

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
} = require("../../models");

const { generatePassword, sendMail } = require("../../../helpers");
const users = require("../../models/users");

const router = express.Router();
// router.use(isAdmin);

router.route("/").get(auth1, async (req, res) => {
	try {
		// for archieve data
		if (req.query.isDeleted == undefined) {
			var isDeleted = false;
			var isChecked = "false";
		} else if (req.query.isDeleted.toString() == "true") {
			var isDeleted = req.query.isDeleted;
			var isChecked = "true";
		} else if (req.query.isDeleted.toString() == "false") {
			var isDeleted = false;
			var isChecked = "false";
		}
		const perPage = 5;
		const p = parseInt(req.query.page, 10);
		const page = p || 1;
		const count = await Candidate.countDocuments({
			_college: req.session.college._id,
			isDeleted: isDeleted,
		});
		const populate = [
			{
				path: "_qualification",
				select: "name",
			},
			{
				path: "_subQualification",
				select: "name",
			},
		];
		const candidates = await Candidate.find({
			_college: req.session.college._id,
			isDeleted: isDeleted,
		})
			.populate(populate)
			.select("name image session mobile email semester status")
			.sort({ createdAt: -1 })
			.skip(perPage * page - perPage)
			.limit(perPage);
		const totalPages = Math.ceil(count / perPage);
		// console.log(candidates);
		return res.render(`${req.vPath}/college/candidate`, {
			candidates,
			perPage,
			totalPages,
			page,
			isChecked,
		});
	} catch (err) {
		req.flash("error", err.message || "Something went wrong!");
		return res.redirect("back");
	}
});

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

		return res.render(`${req.vPath}/college/candidate/listing`, {
			imports,
			perPage,
			totalPages,
			page,
		});
	} catch (err) {
		req.flash("error", err.message || "Something went wrong!");
		return res.redirect("/college/candidate/listing");
	}
});

router
	.route("/bulkUpload")
	.get(auth1, async (req, res) => {
		try {
			const country = await Country.find({});
			const qualification = await Qualification.find({ status: true });
			const skill = await Skill.find({ status: true });
			const techSkill = skill.filter((x) => x.type === "technical");
			const nonTechSkill = skill.filter((x) => x.type === "non technical");

			const perPage = 5;
			const p = parseInt(req.query.page, 10);
			const page = p || 1;

			const collegedetail = await College.findOne({
				_concernPerson: req.session.user._id,
			});
			if (!collegedetail) throw req.ykError("College detail not found!");

			const count = await Import.countDocuments({
				_college: collegedetail._id,
			});
			const imports = await Import.find({ _college: collegedetail._id })
				.sort({ createdAt: -1 })
				.skip(perPage * page - perPage)
				.limit(perPage);
			const totalPages = Math.ceil(count / perPage);

			return res.render(`${req.vPath}/college/candidate/bulkUpload`, {
				country,
				qualification,
				techSkill,
				nonTechSkill,
				imports,
				perPage,
				totalPages,
				page,
				collegedetail,
			});
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("/panel/college/candidate/bulkUpload");
		}
	})
	.post(auth1, async (req, res) => {
		if (req.files == undefined) {
			req.flash("error", "Please select file ");
			return res.redirect("/panel/college/candidate/bulkUpload");
		}
		var data1 = req.files.filename;
		const collegedetail = await College.findOne({
			_concernPerson: req.session.user._id,
		});

		if (!req.files.filename) {
			req.flash("error", "Please select file ");
			return res.redirect("/panel/college/candidate/bulkUpload");
		}
		if (req.files.filenameta1 == "") {
			req.flash("error", "Please select file ");
			return res.redirect("/panel/college/candidate/bulkUpload");
		}
		var checkFileError = true;

		let extension = req.files.filename.name.split(".").pop();
		if (extension !== "xlsx" && extension !== "xls" && extension !== "xl") {
			console.log("upload excel file only");
			req.flash("error", "Excel format not matched.");
			return res.redirect("/panel/college/candidate/bulkUpload");
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
		let message = "";
		await readXlsxFile(
			path.join(__dirname, "../../../public/" + filename)
		).then((rows) => {
			if (
				rows[0][0] !== "S. no." ||
				rows[0][1] !== "College Roll No." ||
				rows[0][2] !== "First Name" ||
				rows[0][3] !== "Last Name" ||
				rows[0][4] !== "Gender(M/F/Not Disclose)" ||
				rows[0][5] !== "College Official Email ID" ||
				rows[0][6] !== "Registered Mobile no." ||
				rows[0][7] !==
					"Courses(Doctorate, Certificate, Post Graduation, Diploma, PhD etc.)" ||
				rows[0][8] !==
					"Streams(Computer Course, Pharmacy,Phd In English etc.)" ||
				rows[0][9] !== "Aggregate CGPA till last Semester on 10 point scale"
			) {
				checkFileError = false;
			} else {
				checkFileError = true;
			}
		});
		console.log("checkFileError1", checkFileError);
		if (checkFileError == false) {
			req.flash("error", "Please upload right pattern file");
			return res.redirect("/panel/college/candidate/bulkUpload");
		} else {
			//check qualification in database
			if (checkFileError == true) {
				await readXlsxFile(
					path.join(__dirname, "../../../public/" + filename)
				).then(async (rowss) => {
					var index = 0;
					for (var i = 0; i < rowss.length; i++) {
						for (var j = 0; j < rowss[i].length; j++) {
							if (
								rowss[i][5] === null ||
								rowss[i][2] === null ||
								rowss[i][3] === null ||
								rowss[i][6] === null ||
								rowss[i][7] === null ||
								rowss[i][8] === null
							) {
								// console.log(rowss[i][j]);
								message =
									// " Please fill " + rowss[0][j] + " at row " + i + "</br>";
									"There is an error occurred while uploading file";
								checkFileError = false;
							}
						}

						if (rowss[i][7] !== null && rowss[i][8] !== null && i !== 0) {
							var checkQ = await Qualification.findOne({
								name: rowss[i][7],
							});
							var checkSQ = await SubQualification.findOne({
								name: rowss[i][8],
								_qualification: checkQ,
							});
						}

						if (checkQ == null && i !== 0) {
							//find courses
							const course = await Qualification.find({});

							let courseString = [];

							course.forEach((data) => {
								// console.log(data.name, "---------------");
								courseString.push(data.name);
							});


							// stream.forEach((data1) => {
							// 	console.log(data1.name, "---------------");
							// });
							message += ` Please fill correct Course
								at row ${i}. Courses such as (${courseString.toString()}) .`;

							checkFileError = false;
						}
						if (checkSQ == null && i !== 0) {
							//find stream
							const stream = await SubQualification.find({});
							let streamString = [];
							stream.forEach((data1) => {
								// console.log(data.name, "---------------");
								streamString.push(data1.name);
							});

							message += ` Please fill correct Stream
								at row ${i}. Streams such as (${streamString.toString()}).`;
							checkFileError = false;
						}

						var imports = {
							name: req.files.filename.name,
							message: message,
							status: "Failed",
							record: 0,
							_college: collegedetail._id,
						};
					}
					if (checkFileError == false) {
						const data = await Import.create(imports);
						// console.log(data);
						req.flash("error", message);
						fs.unlinkSync(
							path.join(__dirname, "../../../public/" + filename)
						);
						return res.redirect("/panel/college/candidate/bulkUpload");
					}
				});
			}

			var recordCount = 0;
			// console.log("checkFileError", checkFileError);
			if (checkFileError == true) {
				await readXlsxFile(
					path.join(__dirname, "../../../public/" + filename)
				).then(async (rows) => {
					rows.shift();
					var totalRows = rows.length;
					rows.forEach(async (rows) => {
						var fullName = rows[2] + " " + rows[3];
						//qualifications
						let ID = "";
						let SQID = "";

						if (rows[7] != null) {
							var qualification = await Qualification.findOne({
								name: rows[7],
							});
							ID = qualification ? qualification._id : "";
							if (ID != "") {
								var subQualification = await SubQualification.findOne({
									_qualification: qualification._id,
									name: rows[8],
								});
								SQID = subQualification ? subQualification._id : "";
							}
						}
						let FullName = fullName ? fullName : "";
						let Email = rows[5] ? rows[5] : "";
						let Mobile = rows[6] ? rows[6] : "";
						let CGPA = rows[9] ? rows[9] : "";
						let SNO = rows[0] ? rows[0] : "";
						let SUBQ = rows[8] ? rows[8] : "";
						let CNO = rows[1] ? rows[1] : "";
						let GENDER = rows[4] ? rows[4] : "";
						let checkEmail = await users.findOne({
							email: Email,
							isDeleted: false,
						});
						let checkNumber = await users.findOne({
							mobile: Mobile,
							isDeleted: false,
						});
						if (checkEmail && checkNumber) {
							let update = await users.findOneAndUpdate(
								{
									mobile: Mobile,
									isDeleted: false,
								},
								{
									name: FullName,
									email: Email,
									mobile: Mobile,
								}
							);
							let Update = {
								sNo: SNO,
								collegeRollno: CNO,
								name: FullName,
								gender: GENDER,
								email: Email,
								mobile: Mobile,
								cgpa: rows[9],
							};
							if (ID != "") {
								Update._qualification = ID;
							}
							if (SQID != "") {
								Update._subQualification = SQID;
							}
							// console.log(Update, "Update");
							let update1 = await Candidate.findOneAndUpdate(
								{
									mobile: Mobile,
									isDeleted: false,
								},
								Update
							);
							// console.log(update1, "update1");
							// console.log(recordCount, "- recordCount IF" + totalRows);
							if (totalRows == recordCount + 1) {
								var imports = {
									name: req.files.filename.name,
									message: "success",
									status: "Updated",
									record: recordCount + 1,
									_college: collegedetail._id,
								};
								console.log(
									"--------------------- REcord INSERTED ---------------------------"
								);
								console.log(imports);
								await Import.create(imports);
							}
							recordCount++;

							// console.log(update1, "update", ID, SQID);
						}

						if (!checkEmail) {
							let checkMobile = await users.findOne({
								mobile: Mobile,
								isDeleted: false,
							});
							if (!checkMobile) {
								let usr = await User.create({
									name: FullName,
									email: Email,
									mobile: Mobile,
									role: 3,
								});
								let tutorial = {
									sNo: SNO,
									collegeRollno: CNO,
									name: FullName,
									gender: GENDER,
									email: Email,
									mobile: Mobile,
									cgpa: rows[9],
									_concernPerson: usr._id,
									_college: collegedetail._id,
									session: "2022-2022",
								};
								console.log(tutorial, "tutorial");
								if (ID != "") {
									tutorial._qualification = ID;
								}
								if (SQID != "") {
									tutorial._subQualification = SQID;
								}
								const candidate = await Candidate.create(tutorial);
								console.log(candidate);
								if (totalRows == recordCount + 1) {
									var imports = {
										name: req.files.filename.name,
										message: "success",
										status: "Completed",
										record: recordCount + 1,
										_college: collegedetail._id,
									};
									console.log(
										"--------------------- REcord INSERTED ---------------------------"
									);
									console.log(imports);
									await Import.create(imports);
								}
								recordCount++;
								console.log(recordCount, "- recordCount");
							}
							// req.flash("success", "Data uploaded successfully");
						}
					});
				});
				req.flash("success", "Data uploaded successfully");
				fs.unlinkSync(path.join(__dirname, "../../../public/" + filename));
				return res.redirect("/panel/college/candidate/bulkUpload");
			}
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
			return res.render(`${req.vPath}/college/candidate/add`, {
				country,
				qualification,
				techSkill,
				nonTechSkill,
				formData,
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

				return res.render(`${req.vPath}/college/candidate/add`, {
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
			return res.redirect("/panel/college/candidate");
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});

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
			const candidate = await Candidate.findById(id);
			if (!candidate) throw req.ykError("Candidate not found!");
			const state = await State.find({ countryId: candidate.countryId });
			const city = await City.find({ stateId: candidate.stateId });
			const subqual = await SubQualification.find({
				_qualification: candidate._qualification,
			});
			return res.render(`${req.vPath}/college/candidate/edit`, {
				country,
				qualification,
				techSkill,
				nonTechSkill,
				state,
				city,
				subqual,
				candidate,
			});
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})
	.post(auth1, async (req, res) => {
		try {
			const { mobile } = req.body;
			const { id } = req.params;
			const dataCheck = await Candidate.findOne({
				_id: { $ne: id },
				mobile,
			});
			if (dataCheck) throw req.ykError("Mobile number already exist!");
			const session = req.body.sessionStart
				.concat("-")
				.concat(req.body.sessionEnd);

			// _subqualification check if no substream selected  eg: BCA
			let unset = {};
			if (req.body._subQualification == undefined) {
				unset = { $unset: { _subQualification: "" } };
				const remove = await Candidate.findByIdAndUpdate(id, unset);
			}
			const candidateUpdate = await Candidate.findByIdAndUpdate(
				id,
				{ ...req.body, session },
				unset
			);

			if (!candidateUpdate) throw req.ykError("Candidate not updated!");

			await User.findOneAndUpdate(
				{ email: req.body.email },
				{
					email: req.body.email,
					mobile: req.body.mobile,
				}
			);

			req.flash("success", "Candidate updated successfully!");
			return res.redirect("/panel/college/candidate");
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});

router.route("/createResume/:id").get(auth1, async (req, res) => {
	try {
		const dataObj = {
			id: req.params.id,
			reCreate: !!req.query.reCreate,
			url: `${req.protocol}://${req.get("host")}/candidateForm/${
				req.params.id
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
		return res.redirect("/college/candidate");
	} catch (err) {
		req.flash("error", err.message || "Something went wrong!");
		return res.redirect("back");
	}
});
router.route("/single").get(auth1, function (req, res) {
	res.download("public/CollegeStudentsDataTemplate.xlsx", function (err) {
		if (err) {
			console.log(err);
		}
	});
});
router.route("/clearlog").post(auth1, async function (req, res) {
    const college = await College.findOne({
        _concernPerson: req.session.user._id,
    });
    const clearlogs = await Import.deleteMany({
        _college: college._id,
    });
    return res.json({ status: true });
});
module.exports = router;
