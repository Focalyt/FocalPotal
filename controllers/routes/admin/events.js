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
            description,
            timingFrom,
            timingTo,
        } = req.body;

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
