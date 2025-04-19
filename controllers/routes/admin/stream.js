const express = require("express");
const { CRMLeadStatus } = require("../../models");
const { isAdmin } = require("../../../helpers");
const router = express.Router();
router.use(isAdmin);

router.route("/stream").get(async (req, res) => {
    try {
      const view = req.session.user.role === 10;
      const perPage = 5;
      const p = parseInt(req.query.page, 10);
      const page = p || 1;
  
      const count = await CRMLeadStatus.countDocuments({});
      const leadStatuses = await CRMLeadStatus.find()
        .sort({ createdAt: -1 })
        .skip(perPage * page - perPage)
        .limit(perPage);
  
      const totalPages = Math.ceil(count / perPage);
  
      return res.render(`${req.vPath}/admin/crmStream/stream`, {
        leadStatuses,
        strName: "", // used in input value (if needed)
        perPage,
        totalPages,
        page,
        menu: "stream",
        view,
      });
    } catch (err) {
      req.flash("error", err.message || "Something went wrong!");
      return res.redirect("back");
    }
  }).post(async (req, res) => {
    try {
      const { name } = req.body;
      console.log("👉 Form Data Received:", req.body);
  
      if (!name || name.trim() === "") {
        req.flash("error", "Stream name is required!");
      } else {
        const existing = await CRMLeadStatus.findOne({ leadCategory: name.trim() });
        if (existing) {
          req.flash("error", "Stream already exists!");
        } else {
          const newStream = await CRMLeadStatus.create({
            leadCategory: name.trim(),
            status: {},
            subStatus:{}, 
          });
          console.log("✅ New Stream Added:", newStream);
          req.flash("success", "Stream added successfully!");
        }
      }
  
      // Refresh same GET view after adding
      const perPage = 5;
      const p = parseInt(req.query.page, 10);
      const page = p || 1;
      const count = await CRMLeadStatus.countDocuments({});
      const leadStatuses = await CRMLeadStatus.find()
        .sort({ createdAt: -1 })
        .skip(perPage * page - perPage)
        .limit(perPage);
  
      const totalPages = Math.ceil(count / perPage);
  
      return res.render(`${req.vPath}/admin/crmStream/stream`, {
        leadStatuses,
        strName: "", // for form input reuse if needed
        perPage,
        totalPages,
        page,
        menu: "stream",
        view: req.session.user.role === 10,
      });
    } catch (err) {
      console.log("==> POST /stream error:", err);
      req.flash("error", err.message || "Something went wrong!");
      return res.redirect("back");
    }
  });
  

  router
  .route("/addStream")
  .get(async (req, res) => {
    try {
      const view = req.session.user.role === 10;
      const streams = await CRMLeadStatus.find().sort({ createdAt: -1 });

      return res.render(`${req.vPath}/admin/crmStream/course`, {
        menu: 'addedu',
        course: [],        
        coursedata: "",
        view,
        streams
      });

    } catch (err) {
      console.log("🔥 Error in GET /addStream:", err);
      req.flash("error", err.message || "Something went wrong!");
      return res.redirect("back");
    }
  })
  .post(async (req, res) => {
    try {
      const { leadCategory, subStatus } = req.body;
      console.log("Received body:", req.body);

      if (!leadCategory || !subStatus) {
        req.flash("error", "Both stream and sub-stream are required!");
        return res.redirect("back");
      }

      const existing = await CRMLeadStatus.findOne({ leadCategory, subStatus });
      if (existing) {
        req.flash("error", "This sub-stream already exists!");
        return res.redirect("back");
      }

      await CRMLeadStatus.create({
        leadCategory,
        subStatus,
        status: "Active",
      });

      req.flash("success", "Sub Stream added successfully!");
      return res.redirect("back");

    } catch (err) {
      console.log("🔥 Error in POST /addStream:", err);
      req.flash("error", err.message || "Something went wrong!");
      return res.redirect("back");
    }
  });


// router
//     .route("/addStream")
//     .get(async (req, res) => {
//         try {
//             let view = false
//             if (req.session.user.role === 10) {
//                 view = true
//             }

//             // const qualifications = await Qualification.find({
//             //     status: true,
//             // }).select("name");
//             // const course = await QualificationCourse.find().populate("_qualification")
//             //     .sort({ createdAt: -1 });
//             const coursedata = ""

//             return res.render(`${req.vPath}/admin/crmStream/course`, {
//                 menu: 'addedu',
//                 qualifications,
//                 course,
//                 coursedata,
//                 view
                
//             });

//         } catch (err) {
//             req.flash("error", err.message || "Something went wrong!");
//             return res.redirect("back");
//         }

//     })
//     .post(async (req, res) => {
//         try {
//             const { _qualification, name } = req.body;
//             const body = {
//                 _qualification, name
//             }
//             console.log("body", body)
//             // Check if the name already exists
//             const existing = await QualificationCourse.findOne({ name: name.trim() });
//             if (existing) {
//                 req.flash('error', 'This Course already exists.');
//                 return res.redirect('back');
//             }

//             // const addRecord = await QualificationCourse.create(body);


//             // res.json({ status: true, message: "Record added!" });
//             req.flash('success', 'Record added!');
//             return res.redirect("back");

//         } catch (err) {
//             console.log(err)
//             req.flash("error", err.message || "Something went wrong!");
//             return res.redirect("back");

//         }

//     })





module.exports = router;