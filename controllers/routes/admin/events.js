const express = require("express");
const moment = require("moment");
const router = express.Router();
const { auth1 } = require("../../../helpers");
const Event = require("../../models/event"); // your Event model path
const fs = require('fs');
const multer = require('multer');
const templates = require("../../models/templates")
const AWS = require("aws-sdk");

const uuid = require("uuid/v1");
const puppeteer = require("puppeteer");
const path = require("path");
const {
    accessKeyId,
    secretAccessKey,
    bucketName,
    region,
    msg91ShortlistedTemplate,
    msg91Rejected,
    msg91Hired,
    msg91InterviewScheduled,
    msg91OnHoldTemplate,
    env
} = require("../../../config");

AWS.config.update({
    accessKeyId: accessKeyId, // id
    secretAccessKey: secretAccessKey, // secret password
    region: region,
});

// Define the custom error
class InvalidParameterError extends Error {
    constructor(message) {
        super(message);
        this.name = 'InvalidParameterError';
    }
}

const s3 = new AWS.S3({ region, signatureVersion: 'v4' });
const allowedVideoExtensions = ['mp4', 'mkv', 'mov', 'avi', 'wmv'];
const allowedImageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];

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




router.get("/add", auth1, async (req, res) => {
    try {
        return res.render("admin/event/add", { menu: 'event' });
    } catch (err) {
        console.error("Error loading Add Event page:", err);
        req.flash("error", "Something went wrong!");
        return res.redirect("back");
    }
});


router.post("/add", async (req, res) => {
    try {

        console.log("files", req.files)
        const {
            eventType,
            eventTitle,
            mode,
            url,
            latitude,
            longitude,
            state,
            city,
            fullAddress,
            description
        } = req.body;

        const timingFrom = new Date(req.body.timingFrom);  // Auto parses "2025-04-01T14:30"
        const timingTo = new Date(req.body.timingTo);
        const registrationFrom = new Date(req.body.registrationFrom);  // Auto parses "2025-04-01T14:30"
        const registrationTo = new Date(req.body.registrationTo);


        let videoURL = "";
        let thumbnailURL = "";
        let guidelinesURL = "";

        const uploadToS3 = async (file) => {
            const ext = file.name.split(".").pop().toLowerCase();
            const key = `Events/${eventTitle}/${uuid()}.${ext}`;
            const params = {
                Bucket: bucketName,
                Key: key,
                Body: file.data,
                ContentType: file.mimetype,
            };
            const data = await s3.upload(params).promise();
            return data.Location;
        };


        if (req.files?.video) {
            videoURL = await uploadToS3(req.files.video);
        }
        if (req.files?.thumbnail) {
            thumbnailURL = await uploadToS3(req.files.thumbnail);
        }
        if (req.files?.guidelines) {
            guidelinesURL = await uploadToS3(req.files.guidelines);
        }

        console.log("videoURL", videoURL)
        console.log("thumbnailURL", thumbnailURL)
        console.log("guidelinesURL", guidelinesURL)

        const newEvent = new Event({
            eventType,
            eventTitle,
            eventMode: mode,
            url,
            location: {
                latitude,
                longitude,
                state,
                city,
                fullAddress,
            },
            description,
            timing: {
                from: timingFrom,
                to: timingTo,
            },
            registrationPeriod: {
                from: registrationFrom,
                to: registrationTo,
            },
            video: videoURL,
            thumbnail: thumbnailURL,
            guidelines: guidelinesURL,
        });

        await newEvent.save();
        req.flash("success", "Event created successfully!");
        return res.redirect("/admin/event/add");
    } catch (error) {
        console.error("Error creating event:", error);
        req.flash("error", "Failed to create event");
        return res.redirect("back");
    }
});

router.get("/allevents", auth1, async (req, res) => {
    try {
      const events = await Event.find({ isDeleted: false }).sort({ createdAt: -1 });
      return res.render("admin/event/allEvents", {
        menu: "event",
        events,
        canEdit: true, // optionally make this role-based
        isChecked: false,
        data: {}
      });
    } catch (err) {
      console.error("Error loading Events page:", err);
      req.flash("error", "Something went wrong!");
      return res.redirect("back");
    }
  });

  router.get("/registration", auth1, async (req, res) => {
    try {
      const events = await Event.find({ isDeleted: false }).sort({ createdAt: -1 });
      return res.render("admin/event/registration", {
        menu: "event",
        events,
        canEdit: true, // optionally make this role-based
        isChecked: false,
        data: {}
      });
    } catch (err) {
      console.error("Error loading Events page:", err);
      req.flash("error", "Something went wrong!");
      return res.redirect("back");
    }
  });

// router.route("/allevent").get(async (req, res) => {
//     try {
//         let view = false
//         let canEdit = false
//         const user = req.session.user
//         console.log("user", user)
//         if (user.role === 0) {

//             canEdit = true
//         }

//         if (user.role === 10) {
//             view = true;

//         }
//         const data = req.query;
//         const fields = {
//             isDeleted: false
//         }
//         if (data['name'] != '' && data.hasOwnProperty('name')) {
//             fields["name"] = { "$regex": data['name'], "$options": "i" }
//         }
//         if (data.FromDate && data.ToDate) {
//             let fdate = moment(data.FromDate).utcOffset("+05:30").startOf('day').toDate()
//             let tdate = moment(data.ToDate).utcOffset("+05:30").endOf('day').toDate()
//             fields["createdAt"] = {
//                 $gte: fdate,
//                 $lte: tdate
//             }
//         }

//         if (req.query.status == undefined) {
//             var status = true;
//             var isChecked = "false";
//         } else if (req.query.status.toString() == "true") {
//             var status = true;
//             var isChecked = "false";
//         } else if (req.query.status.toString() == "false") {
//             var status = false;
//             var isChecked = "true";
//         }
//         fields["status"] = status;
//         let courses;
//         // ✅ Role 11 specific filtering
//         if (user.role === 11) {
//             const userDetails = req.session.user;
//             let courseIds = userDetails.access.courseAccess.map(id => id.toString());
//             let centerIds = userDetails.access.centerAccess.map(id => id.toString());

//             const allCourses = await Courses.find(fields).populate("sectors");

//             console.log("All courses before filter =>");
//             allCourses.forEach(course => {
//                 console.log({
//                     courseId: course._id.toString(),
//                     centerId: course.center?.toString()
//                 });
//             });


//             let filteredCourses = allCourses.filter(course => {
//                 const courseId = course._id?.toString();
//                 const courseCenterIds = Array.isArray(course.center)
//                   ? course.center.map(c => c.toString())
//                   : [];
              
//                 const hasMatchingCenter = courseCenterIds.some(cid => centerIds.includes(cid));
//                 const hasMatchingCourse = courseIds.includes(courseId);
              
//                 return hasMatchingCenter && hasMatchingCourse;
//               });
              
              
              

//             courses = filteredCourses;
//             console.log("filteredCourses:", filteredCourses);
//         } else {
//             courses = await Courses.find(fields).populate("sectors");
//         }


//         // console.log(courses, "this is courses")
//         // ${req.vPath}
//         return res.render('admin/event/allEvents', {
//             menu: 'course',
//             view,
//             courses,
//             isChecked,
//             data,
//             canEdit
//           });
          

//     } catch (err) {
//         req.flash("error", err.message || "Something went wrong!");
//         return res.redirect("back");
//     }
// });

module.exports = router;




// const express = require("express");
// const router = express.Router();
// const { auth1 } = require("../../../helpers");

// router.get("/add", auth1, async (req, res) => {
//     try {
//         return res.render("admin/addEvent/add", { menu: 'event' });
//     } catch (err) {
//         console.error("Error loading Add Event page:", err);
//         req.flash("error", "Something went wrong!");
//         return res.redirect("back");
//     }
// });

// module.exports = router;
