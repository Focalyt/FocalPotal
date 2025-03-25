const express = require("express");
const { ObjectId } = require("mongodb");
const uuid = require('uuid/v1');
const mongoose = require('mongoose');
const bcrypt = require("bcryptjs");
const fs = require('fs');
const path = require("path");
const { auth1, isAdmin } = require("../../../helpers");
const moment = require("moment");
const { Courses, Country, Qualification, CourseSectors, Candidate, AppliedCourses, Center } = require("../../models");
const candidateServices = require('../services/candidate')
const { candidateCashbackEventName } = require('../../db/constant');
const router = express.Router();
router.use(isAdmin);

const AWS = require("aws-sdk");
const multer = require('multer');
const {
  accessKeyId,
  secretAccessKey,
  bucketName,
  region,
  authKey,
  msg91WelcomeTemplate,
} = require("../../../config");

AWS.config.update({
  accessKeyId,
  secretAccessKey,
  region,
});
const s3 = new AWS.S3({ region, signatureVersion: 'v4' });
const allowedVideoExtensions = ['mp4', 'mkv', 'mov', 'avi', 'wmv'];
const allowedImageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
const allowedDocumentExtensions = ['pdf', 'doc', 'docx']; // ✅ PDF aur DOC types allow karein

const allowedExtensions = [...allowedVideoExtensions, ...allowedImageExtensions, ...allowedDocumentExtensions];
const destination = path.resolve(__dirname, '..', '..', '..', 'public', 'temp');

if (!fs.existsSync(destination)) fs.mkdirSync(destination);

const storage = multer.diskStorage({
  destination,
  filename: (req, file, cb) => {
	const ext = path.extname(file.originalname);
	const basename = path.basename(file.originalname, ext);
	cb(null, `${basename}-${Date.now()}${ext}`);
  },
});

const upload = multer({ storage }).single('file');



router.route("/").get(async (req, res) => {
	try {
		let view = false
		const user = req.session.user
		if (user.role === 10) {
			view = true
		}
		const data = req.query;
		const fields = {
			isDeleted: false
		}
		if (data['name'] != '' && data.hasOwnProperty('name')) {
			fields["name"] = { "$regex": data['name'], "$options": "i" }
		}
		if (data.FromDate && data.ToDate) {
			let fdate = moment(data.FromDate).utcOffset("+05:30").startOf('day').toDate()
			let tdate = moment(data.ToDate).utcOffset("+05:30").endOf('day').toDate()
			fields["createdAt"] = {
				$gte: fdate,
				$lte: tdate
			}
		}

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
		fields["status"] = status;
		let courses;
    // ✅ Role 11 specific filtering
    if (user.role === 11) {
        let courseFilter = [];

        // Check if courseAccess has data
        if (user.access?.courseAccess?.length) {
            courseFilter = user.access.courseAccess;
            fields['_id'] = { $in: courseFilter };
        }
        // Else filter by centerAccess
        else if (user.access?.centerAccess?.length) {
            courses = await Courses.find({
                ...fields,
                centers: { $in: user.access.centerAccess }
            }).populate("sectors");
        } else {
            courses = []; // No access, empty result
        }

        // If courseFilter is filled, fetch based on that
        if (courseFilter.length) {
            courses = await Courses.find(fields).populate("sectors");
        }
    } else {
        // For Admin/other roles
        courses = await Courses.find(fields).populate("sectors");
    }
		// console.log(courses, "this is courses")
		return res.render(`${req.vPath}/admin/course`, {
			menu: 'course',
			view,
			courses,
			isChecked,
			data
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
			const sectors = await CourseSectors.find({ status: true })
			const center = await Center.find({ status: true })
			
			return res.render(`${req.vPath}/admin/course/add`, {
				menu: 'addCourse',
				sectors,
				center
			});
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})
	.post(async (req, res) => {
		try {
			console.log(req.body, "this is body of post data>>>>><><><><><")
			let photos = req.body.photos?.split(',')
			let testimonialvideos = req.body.testimonialvideos?.split(',')
			let videos = req.body.videos?.split(',')
			let body = req.body;
			body.photos = photos
			body.testimonialvideos = testimonialvideos
			body.videos = videos

			const addRecord = await Courses.create(body);
			console.log(JSON.stringify(addRecord), "create coursessssssss")
			if (addRecord) {
				return res.json({ status: true, message: "Record added!" })
			} else {
				return res.json({ status: false, message: "Record not added!" })
			}
		} catch (err) {
			console.log(err)
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");

		}
	});
router.route("/changeStatus").patch(async (req, res) => {
	try {
		const updata = { $set: { status: req.body.status } };

		const data = await Courses.findByIdAndUpdate(req.body.id, updata);

		if (!data) {
			return res.status(500).send({
				status: false,
				message: "Can't update status of this course",
			});
		}

		return res.status(200).send({ status: true, data: data });
	} catch (err) {
		req.flash("error", err.message || "Something went wrong!");
		return res.status(500).send({ status: false, message: err.message });
	}
});

router
	.route("/edit/:id")
	.get(async (req, res) => {
		try {
			const { id } = req.params;
			let course = await Courses.findById(id);
			if (!course) throw req.ykError("course not found!");
			const sectors = await CourseSectors.find({
				status: true, _id: {
					$nin: course.sectors
				}
			})
			const center = await Center.find({
				status: true, _id: {
					$nin: course.center
				}
			})
			course = await Courses.findById(id).populate('sectors').populate('center');
			
			return res.render(`${req.vPath}/admin/course/edit`, {
				course,
				sectors,
				id,
				center,
				menu: 'course'
			});

		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})
	.post(async (req, res) => {
		try {
			let { id } = req.params
			let body = req.body;
			console.log("body data", body)
			body.photos = req.body.photos?.split(',')
			body.videos = req.body.videos?.split(',')
			body.testimonialvideos = req.body.testimonialvideos?.split(',')
			if (req.body.center === "") {
				body.center = null;  // Center remove कर दो
			} else {
				body.center = req.body.center;
			}
			const updateCourse = await Courses.findByIdAndUpdate(id, { $set: body }, { new: true });
			if (updateCourse) {
				req.flash("success", "Course updated successfully!");
				return res.json({ status: true, message: "Record added!" })
			} else {
				return res.json({ status: false, message: "Record not added!" })
			}
		} catch (err) {
			console.log('err: ', err);
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});
router.route("/getCourseViaSector").get(async (req, res) => {
	try {
		const { sectorId } = req.query;
		const courses = await Courses.find({
			sectors: {
				$in: [new mongoose.Types.ObjectId(sectorId)]
			},
			isDeleted: false
		});
		return res.status(200).json({ status: true, data: courses });
	} catch (error) {
		req.flash("error", err.message || "Something went wrong!");
		return res.redirect("back");
	}
})
router.route("/getCourseDetailById").get(async (req, res) => {
	try {
		const { courseId } = req.query;
		const courses = await Courses.findOne({
			_id: {
				$in: [new mongoose.Types.ObjectId(courseId)]
			},
			isDeleted: false
		});
		return res.status(200).json({ status: true, data: [courses] });
	} catch (error) {
		req.flash("error", err.message || "Something went wrong!");
		return res.redirect("back");
	}
});
router.route("/registrations")
	.get(auth1, async (req, res) => {
		try {
			const data = req.query
			const perPage = 20;
			const p = parseInt(req.query.page, 10);
			const page = p || 1;
			let view = false
			if (req.session.user.role === 10) {
				view = true
			}
			const filter = {};
			let numberCheck = isNaN(data?.name);
			if (data['name'] != '' && data.hasOwnProperty('name')) {
				const regex = new RegExp(data['name'], 'i');
				filter["name"] = regex;
			}
			if (data['name'] && !numberCheck) {
				filter["$or"] = [
					{ "name": { "$regex": data['name'], "$options": "i" } },
					{ "mobile": Number(data['mobile']) },
					{ "whatsapp": Number(data['whatsapp']) }
				];
			}

			const count = await AppliedCourses.countDocuments(filter)
			let { value, order } = req.query
			let sorting = {}
			if (value && order) {
				sorting[value] = Number(order)
			} else {
				sorting = { createdAt: -1 }
			}
			let agg = candidateServices.candidateCourseList(sorting, perPage, page, filter)
			let candidates = await AppliedCourses.aggregate(agg);
			const totalPages = Math.ceil(count / perPage);
			console.log(candidates)

			return res.render(`${req.vPath}/admin/course/registration`, {
				candidates,
				perPage,
				totalPages,
				page,
				count,
				data,
				menu: 'courseRegistrations',
				view,
				sortingValue: Object.keys(sorting),
				sortingOrder: Object.values(sorting),
			});
		} catch (err) {
			console.log(err)
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});

router.route("/:courseId/:candidateId/docsview")
	.get(auth1, async (req, res) => {
		try {
			const { candidateId } = req.params;
			const { courseId } = req.params;
			const candidate = await Candidate.findById(candidateId);

			if (!candidate) {
				console.log("You have not applied for this course.")
				res.redirect("/candidate/searchcourses");
			};
			const course = await Courses.findById(courseId);
			let docsRequired = null
			if (course) {
				docsRequired = course.docsRequired; // requireDocs array fetch ho jayega

			} else {
				console.log("Course not found");
			};

			let uploadedDocs = [];
			if (candidate.docsForCourses && candidate.docsForCourses.length > 0) {
				const courseEntry = candidate.docsForCourses.find(
					entry => entry.courseId.toString() === courseId.toString()
				);
				if (courseEntry && courseEntry.uploadedDocs) {
					uploadedDocs = courseEntry.uploadedDocs;
				}
			}
			let mergedDocs = [];

			if (course && course.docsRequired) {
				docsRequired = course.docsRequired;

				// Create a merged array with both required docs and uploaded docs info
				mergedDocs = docsRequired.map(reqDoc => {
					// Convert Mongoose document to plain object
					const docObj = reqDoc.toObject ? reqDoc.toObject() : reqDoc;

					// Find matching uploaded docs for this required doc
					const matchingUploads = uploadedDocs.filter(
						uploadDoc => uploadDoc.docsId.toString() === docObj._id.toString()
					);

					return {
						_id: docObj._id,
						Name: docObj.docName || 'Document',
						description: docObj.description || '',
						uploads: matchingUploads || []
					};
				});


			} else {
				console.log("Course not found or no docs required");
			};



			// ✅ Fix: Use candidate.docsForCourses instead of undefined docsForCourses
			const countDocsByCourseId = (docsForCourses, targetCourseId) => {
				const courseEntry = docsForCourses.find(course => course.courseId.toString() === targetCourseId.toString());

				let courseDocCount = 0;
				let pendingCount = 0;
				let rejectedCount = 0;
				let approvedCount = 0;

				if (courseEntry && courseEntry.uploadedDocs) {
					courseDocCount = courseEntry.uploadedDocs.length;
					approvedCount = courseEntry.uploadedDocs.filter(doc => doc.status === "Verified").length;
					pendingCount = courseEntry.uploadedDocs.filter(doc => doc.status === "Pending").length;
					rejectedCount = courseEntry.uploadedDocs.filter(doc => doc.status === "Rejected").length;
				}

				return {
					totalDocs: courseDocCount,
					pendingDocs: pendingCount,
					rejectedDocs: rejectedCount,
					verifiedDocs: approvedCount
				};
			};




			// ✅ Fix Applied: Use candidate.docsForCourses
			const courseWiseDocumentCounts = countDocsByCourseId(candidate.docsForCourses || [], courseId);


			console.log(courseWiseDocumentCounts);




			return res.render(`${req.vPath}/admin/course/listview`, {
				menu: 'listview',
				mergedDocs,
				courseWiseDocumentCounts,
				candidate, course, courseId
			});
		} catch (err) {
			console.log("Error:", err);
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}


	})
	.put(async (req, res) => {
		try {
			const { candidateId, courseId, objectId, status, reason } = req.body;

			const verifiedBy = req.session?.user?._id; // Fetch logged-in user ID from session
			console.log(verifiedBy)
			if (!verifiedBy) {
				return console.log("message:", "Missing verifiedBy fields");
			}
			console.log("body data", req.body);

			if (!candidateId || !courseId || !objectId || !status) {
				return res.status(400).json({ message: "Missing required fields" });
			}

			if (status === "Rejected" && !reason) {
				return res.status(400).json({ message: "Rejection reason is required when status is 'Rejected'" });
			}

			// 🔍 Step 1: Find the candidate
			const candidate = await Candidate.findById(candidateId);
			if (!candidate) {
				return res.status(404).json({ message: "Candidate not found" });
			}

			// 🔍 Step 2: Find the course inside `docsForCourses`
			const course = candidate.docsForCourses.find(course => course.courseId.toString() === courseId);
			if (!course) {
				return res.status(404).json({ message: "Course not found in candidate's docsForCourses" });
			}

			// 🔍 Step 3: Find the document inside `uploadedDocs` using `_id`
			const document = course.uploadedDocs.find(doc => doc._id.toString() === objectId);
			if (!document) {
				return res.status(404).json({ message: "Document not found in uploadedDocs" });
			}

			// ✅ Step 4: Update the document fields
			document.status = status;
			document.verifiedBy = verifiedBy || null; // Set verifiedBy from session or null
			document.verifiedDate = new Date(); // Update timestamp

			if (status === "Rejected") {
				document.reason = reason; // Set rejection reason if status is "Rejected"
			} else {
				document.reason = undefined; // Clear reason for other statuses
			}

			// ✅ Step 5: Save the updated candidate document
			await candidate.save();

			return res.status(200).json({
				message: `Document status updated successfully to ${status}`,
				updatedDocument: document
			});

		} catch (error) {
			console.error("Error updating document status:", error);
			return res.status(500).json({ message: "Internal server error", error });
		}
	})

router.route("/assignCourses/:id")
	.put(async (req, res) => {
		try {
			const { id } = req.params;
			const { url, remarks, assignDate } = req.body;

			const updateFields = {
				courseStatus: 1
			};
			if (url) updateFields.url = url;
			if (remarks) updateFields.remarks = remarks;
			if (assignDate) updateFields.assignDate = assignDate;
			const updateCourse = await AppliedCourses.findByIdAndUpdate(id, { $set: updateFields }, { new: true });
			if (updateCourse) {
				return res.status(200).json({ status: true, data: updateCourse });
			} else {
				return res.json({ status: false, message: "Record not found!" });
			}
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});

router.post("/removetestimonial", isAdmin, async (req, res) => {
	const { courseId, key } = req.body;
	let course = await Courses.findById(courseId);
	if (!course) throw req.ykError("Company doesn't exist!");

	let gallery = course.testimonialvideos.filter((i) => i !== key);
	const courseUpdate = await Courses.findOneAndUpdate(
		{ _id: courseId },
		{ testimonialvideos: gallery }
	);
	if (!courseUpdate) throw req.ykError("Course not updated!");
	req.flash("success", "Course updated successfully!");
	res.send({ status: 200, message: "Course Updated Successfully" });
});
router.post("/removevideo", isAdmin, async (req, res) => {
	const { courseId, key } = req.body;
	let course = await Courses.findById(courseId);
	if (!course) throw req.ykError("Company doesn't exist!");

	let gallery = course.videos.filter((i) => i !== key);
	const courseUpdate = await Courses.findOneAndUpdate(
		{ _id: courseId },
		{ videos: gallery }
	);
	if (!courseUpdate) throw req.ykError("Course not updated!");
	req.flash("success", "Course updated successfully!");
	res.send({ status: 200, message: "Course Updated Successfully" });
});

router.post("/removebrochure", isAdmin, async (req, res) => {
	const { courseId, key } = req.body;
	let course = await Courses.findById(courseId);
	if (!course) throw req.ykError("Company doesn't exist!");

	const courseUpdate = await Courses.findOneAndUpdate(
		{ _id: courseId },
		{ brochure: '' }
	);
	if (!courseUpdate) throw req.ykError("Course not updated!");
	req.flash("success", "Course updated successfully!");
	res.send({ status: 200, message: "Course Updated Successfully" });
});

router.post("/removethumbnail", isAdmin, async (req, res) => {
	const { courseId, key } = req.body;
	let course = await Courses.findById(courseId);
	if (!course) throw req.ykError("course doesn't exist!");

	const courseUpdate = await Courses.findOneAndUpdate(
		{ _id: courseId },
		{ thumbnail: '' }
	);
	if (!courseUpdate) throw req.ykError("Course not updated!");
	req.flash("success", "Course updated successfully!");
	res.send({ status: 200, message: "Course Updated Successfully" });
});

router.post("/removephoto", isAdmin, async (req, res) => {
	const { courseId, key } = req.body;
	let course = await Courses.findById(courseId);
	if (!course) throw req.ykError("Course doesn't exist!");

	let gallery = course.photos.filter((i) => i !== key);
	const courseUpdate = await Courses.findOneAndUpdate(
		{ _id: courseId },
		{ photos: gallery }
	);
	if (!courseUpdate) throw req.ykError("Course not updated!");
	req.flash("success", "Course updated successfully!");
	res.send({ status: 200, message: "Course Updated Successfully" });
});

// add leads 
router.route('/:courseId/candidate/addleads')
    .get(async ( req, res) => {
		
        try {
			let {courseId} = req.params
			const country = await Country.find({});
			const highestQualification = await Qualification.find({status:true})
			
			if (typeof courseId === 'string' && mongoose.Types.ObjectId.isValid(courseId)) {
				courseId = new mongoose.Types.ObjectId(courseId);
			} 
	        let course = await Courses.findById(courseId).populate('center');
			
			
            res.render('admin/course/addleads', { menu: 'course', courseId, course, country, highestQualification });
        } catch (err) {
            console.log("Error rendering addleads page:", err);
            res.redirect('back');
        }
    });

router.route('/:courseId/candidate/upload-docs')
    .post(async ( req, res) => {
		
        try {
			 const { docsName, courseId, docsId } = req.body;
					console.log("docsId:", docsId, "Type:", typeof docsId, "Valid:", mongoose.Types.ObjectId.isValid(docsId));
			
					if (!mongoose.Types.ObjectId.isValid(docsId)) {
						return res.status(400).json({ error: "Invalid document ID format." });
					}
			
					
					const candidateMobile = req.body.mobile;

					if(!candidateMobile){

						return res.status(400).json({ error: "mobile number required." });				

					}
			
					const candidate = await Candidate.findOne({
						mobile: candidateMobile,
						appliedCourses: courseId
					});
			
					if (!candidate) {
						return res.status(400).json({ error: "You have not applied for this course." });
					}
			
					let files = req.files?.file;
					if (!files) {
						return res.status(400).send({ status: false, message: "No files uploaded" });
					}
			
					console.log("Files", files)
			
					const filesArray = Array.isArray(files) ? files : [files];
					const uploadedFiles = [];
					const uploadPromises = [];
					const candidateId = candidate._id;
			
					filesArray.forEach((item) => {
						const { name, mimetype } = item;
						const ext = name?.split('.').pop().toLowerCase();
			
						console.log(`Processing File: ${name}, Extension: ${ext}`);
			
						if (!allowedExtensions.includes(ext)) { // ✅ Now includes PDFs
							console.log("File type not supported")
							throw new Error(`File type not supported: ${ext}`);
						}
			
						let fileType = "document"; // ✅ Default to "document"
						if (allowedImageExtensions.includes(ext)) {
							fileType = "image";
						} else if (allowedVideoExtensions.includes(ext)) {
							fileType = "video";
						}
			
						const key = `Documents for course/${courseId}/${candidateId}/${docsId}/${uuid()}.${ext}`;
						const params = {
							Bucket: bucketName,
							Key: key,
							Body: item.data,
							ContentType: mimetype,
						};
			
						uploadPromises.push(
							s3.upload(params).promise().then((uploadResult) => {
								uploadedFiles.push({
									fileURL: uploadResult.Location,
									fileType,
								});
							})
						);
					});
			
					await Promise.all(uploadPromises);
					console.log(uploadedFiles)
			
					const fileUrl = uploadedFiles[0].fileURL;
			
					const existingCourseDoc = await Candidate.findOne({
						mobile: candidateMobile,
						"docsForCourses.courseId": courseId
					});
			
					if (existingCourseDoc) {
						const updatedCandidate = await Candidate.findOneAndUpdate(
							{ mobile: candidateMobile, "docsForCourses.courseId": courseId },
							{
								$push: {
									"docsForCourses.$.uploadedDocs": {
										docsId: new mongoose.Types.ObjectId(docsId),
										fileUrl: fileUrl,
										status: "Pending",
										uploadedAt: new Date()
									}
								}
							},
							{ new: true }
						);
			
						return res.status(200).json({
							status: true,
							message: "Document uploaded successfully",
							data: updatedCandidate
						});
					} else {
						const updatedCandidate = await Candidate.findOneAndUpdate(
							{ mobile: candidateMobile },
							{
								$push: {
									"docsForCourses": {
										courseId: new mongoose.Types.ObjectId(courseId),
										uploadedDocs: [{
											docsId: new mongoose.Types.ObjectId(docsId),
											fileUrl: fileUrl,
											status: "Pending",
											uploadedAt: new Date()
										}]
									}
								}
							},
							{ new: true }
						);
			
						return res.status(200).json({
							status: true,
							message: "Document uploaded successfully",
							data: updatedCandidate
						});
					}
			
        } catch (err) {
            console.log("Error rendering addleads page:", err);
            res.redirect('back');
        }
    });




module.exports = router;
