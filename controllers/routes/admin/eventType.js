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


// Dynamics Event Type 

router
    .route("/")
    .get(async (req, res) => {
        try {
            let view = false
            if (req.session.user.role === 10) {
                view = true
            }
            const perPage = 5;
            const p = parseInt(req.query.page, 10);
            const page = p || 1;
            const quaName = "";
            const count = await EventType.countDocuments({});
            const qualifications = await EventType.find({})
                .select("name status basic")
                .sort({ createdAt: -1 })
                .skip(perPage * page - perPage)
                .limit(perPage);

            const qual = await EventType.find({})
                .select("name status basic")
                .sort({ createdAt: -1 })
                .skip(perPage * page - perPage)
                .limit(perPage);

            const totalPages = Math.ceil(count / perPage);
            return res.render(`${req.vPath}/admin/event/eventType`, {            
                menu: 'eventType',
                quaName,
                qual,
                totalPages,
                page,
                view
            });
        } catch (err) {
            req.flash("error", err.message || "Something went wrong!");
            return res.redirect("back");
        }
    })
    .post(async (req, res) => {
        try {
            if (req.body.id) {
                const qual = await EventType.findOne({ _id: req.body.id, status: true });
                if (qual) throw req.ykError("Event Type already exist!");

                await EventType.findOneAndUpdate({ _id: req.body.id }, {
                    status: true
                });

                req.flash("success", "Course added successfully!");
                return res.redirect("/admin/eventType");
            } else {
                const qual = await EventType.findOne({ name: req.body.name });
                if (qual) throw req.ykError("Event Type already exist!");
                const eventType = await EventType.create({ name: req.body.name, status: true })
               
                if (!eventType) {
                    throw req.ykError("Event type not created!");
                }
                 console.log("==> Saved EventType:", eventType);
                req.flash("success", "Event added successfully!");
                return res.redirect("/admin/eventType");
            }
        } catch (err) {
            console.log('==> err ', err)
            req.flash("error", err.message || "Something went wrong!");
            return res.redirect("back");
        }
    });


router
  .route("/edit/:id")
  .get(async (req, res) => {
    try {
      let view = false;
      if (req.session.user.role === 10) {
        view = true;
      }

      const perPage = 5;
      const p = parseInt(req.query.page, 10);
      const page = p || 1;

      const eventTypeData = await EventType.findById(req.params.id).select("name");
      if (!eventTypeData) throw new Error("Event Type not found");

      const quaName = eventTypeData.name || ""; // safe access
      const count = await EventType.countDocuments({});
      const eventTypes = await EventType.find({})
        .select("name status basic")
        .sort({ createdAt: -1 })
        .skip(perPage * page - perPage)
        .limit(perPage);

      const totalPages = Math.ceil(count / perPage);

      return res.render(`${req.vPath}/admin/event/eventType`, {
        menu: "eventType",
        quaName,
        qual: eventTypes,
        totalPages,
        page,
        view,
      });
    } catch (err) {
      req.flash("error", err.message || "Something went wrong!");
      return res.redirect("back");
    }
  })

  .post(async (req, res) => {
    try {
      const { name } = req.body;

      const duplicate = await EventType.findOne({
        _id: { $ne: req.params.id },
        name,
      });
      if (duplicate) throw new Error("Event Type already exists!");

      const updated = await EventType.findByIdAndUpdate(
        req.params.id,
        { name },
        { new: true }
      );

      if (!updated) throw new Error("Event Type not updated!");

      req.flash("success", "Event Type updated successfully!");
      return res.redirect("/admin/eventType");
    } catch (err) {
      req.flash("error", err.message || "Something went wrong!");
      return res.redirect("back");
    }
  });

module.exports = router;