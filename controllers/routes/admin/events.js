const express = require("express");
const moment = require("moment");
const router = express.Router();
const { auth1 } = require("../../../helpers");
const { Event, AppliedEvent , Qualification , EventType} = require("../../models"); // your Event model path
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
        const eventType = await EventType.find({status: true});
        return res.render("admin/event/add", { menu: 'event' ,eventType });
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
        //   const events = await Event.find({ isDeleted: false }).sort({ createdAt: -1 });
        const events = await Event.find({
            $or: [
                { isDeleted: false },
                { isDeleted: { $exists: false } }
            ]
        }).sort({ createdAt: -1 });
        // console.log("Events found:", events.length);
        // console.log("Events found:", events);
        return res.render("admin/event/allEvents", {
            menu: "allevent",
            events,
            moment,
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
        const candidates = await AppliedEvent.find().sort({ createdAt: -1 }).populate('_candidate').populate('_event');
        let view = false

        console.log("candidate", candidates);
        return res.render("admin/event/registration", {
            menu: "registration",
            candidates,
            view,
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

router
    .route("/edit/:id")

    .get(async (req, res) => {
        console.log("Edit route called with id:", req.params.id);
          
        try {
            const { id } = req.params;
            let event = await Event.findById(id);
            const eventType = await EventType.find({status: true});
            if (!event) throw new Error("Event not found!");
            console.log("Event found:", event);
            // course = await Event.findById(id).populate('sectors').populate('center');
            // course.docsRequired = course.docsRequired.filter(doc => doc.status === true);;

            return res.render(`${req.vPath}/admin/event/editEvent`, {
                event,
                eventType,
                menu: 'editevent'
            });

        } catch (err) {
            req.flash("error", err.message || "Something went wrong!");
            return res.redirect("back");
        }
    })
    .post(async (req, res) => {

        try {
            const { id } = req.params;

            // Extract fields from req.body
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
                registrationFrom,
                registrationTo,
            } = req.body;

            // Parse date fields
            const timingFromDate = new Date(timingFrom);
            const timingToDate = new Date(timingTo);
            const registrationFromDate = new Date(registrationFrom);
            const registrationToDate = new Date(registrationTo);

            // Find the event first
            let event = await Event.findById(id);
            if (!event) {
                req.flash("error", "Event not found");
                return res.redirect("back");
            }

            // Helper function to upload files to S3 (if new files are sent)
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

            // Update media URLs if new files uploaded
            let videoURL = event.video;
            let thumbnailURL = event.thumbnail;
            let guidelinesURL = event.guidelines;

            if (req.files?.video) {
                videoURL = await uploadToS3(req.files.video);
            }
            if (req.files?.thumbnail) {
                thumbnailURL = await uploadToS3(req.files.thumbnail);
            }
            if (req.files?.guidelines) {
                guidelinesURL = await uploadToS3(req.files.guidelines);
            }

            // Update event fields
            event.eventType = eventType;
            event.eventTitle = eventTitle;
            event.eventMode = mode;
            event.url = url;
            event.location = {
                latitude,
                longitude,
                state,
                city,
                fullAddress,
            };
            event.description = description;
            event.timing = {
                from: timingFromDate,
                to: timingToDate,
            };
            event.registrationPeriod = {
                from: registrationFromDate,
                to: registrationToDate,
            };
            event.video = videoURL;
            event.thumbnail = thumbnailURL;
            event.guidelines = guidelinesURL;

            await event.save();

            req.flash("success", "Event updated successfully!");
            return res.redirect("/admin/event/allevents");
        } catch (err) {
            console.error("Error updating event:", err);
            req.flash("error", err.message || "Something went wrong!");
            return res.redirect("back");
        }
    });

router.get("/view/:id", auth1, async (req, res) => {
    try {
        const eventId = req.params.id;

        const event = await Event.findById(eventId);
        if (!event) {
            req.flash("error", "Event not found");
            return res.redirect("/admin/event/allevents");
        }

        // Render the view page with event data
        return res.render("admin/event/viewEvent", {
            event,
            menu: "viewevent"
        });
    } catch (error) {
        console.error("Error fetching event:", error);
        req.flash("error", "Something went wrong while fetching event details");
        return res.redirect("/admin/event/allevents");
    }
});


module.exports = router;