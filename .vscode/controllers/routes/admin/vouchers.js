const express = require("express");
const { Vouchers } = require("../../models");
const { isAdmin,auth1 } = require("../../../helpers");
const router = express.Router();
router.use(isAdmin);
router.route("/candidate").get(async (req, res) => {
    const menu = 'candidateVouchers'
    const view = false;
    if(req.session.user.role === 10){
        view = true
    }
    let status
    let isChecked
    if (req.query.status == undefined) {
        status = true;
        isChecked = "false";
    } else if (req.query.status.toString() == "true") {
        status = req.query.status;
        isChecked = "false";
    } else {
        status = false;
        isChecked = "true";
    }
    const p = parseInt(req.query.page);
    const page = p || 1;
    const perPage = 10;
    const count = await Vouchers.countDocuments({
        forCandidates: true,
        status
    })
    const totalPages = Math.ceil(count / perPage);
    const vouchers = await Vouchers.find({ forCandidates: true, status })
    .sort({ createdAt: -1 })
    .skip(perPage * page - perPage)
    .limit(perPage);
    res.render(`${req.vPath}/admin/miPieVouchers/candidates/candidate`, { menu, isChecked, view, vouchers, page, totalPages })
})

router.route("/candidate/addEditVoucher/:voucherId?").get(async (req, res) => {
    const {voucherId}=req.params
    let menu = "candidateVouchers";
    let voucher = await Vouchers.findById(voucherId);
    res.render(`${req.vPath}/admin/miPieVouchers/candidates/addOrEdit`, { menu, voucher });
})
router.route('/candidate/viewVoucher/:voucherId?').get(auth1,async (req, res) => {
    let menu = "candidateVouchers";
    const { voucherId } = req.params;
    const voucher = await Vouchers.findById(voucherId);
    if (!voucher) {
        req.flash("error", "Voucher not Found");
        return res.redirect("/admin/Vouchers/candidate");
    }
    return res.render(`${req.vPath}/admin/miPieVouchers/candidates/viewVoucher`, { menu, voucher })
})
router.route("/addVoucher").post(async (req, res) => {
    const { voucherId } = req.query;
    const {
        displayVoucher,
        code,
        value,
        activationDate,
        activeTill,
        description,
        forCandidates,
        voucherType
    } = req.body;
    let add = {};
    if (displayVoucher) {
        add["displayVoucher"] = displayVoucher;
    }
    if (code) {
        add["code"] = code;
    }
    if (value) {
        add["value"] = value;
    }
    if (activationDate) {
        add["activationDate"] = activationDate;
    }
    if (activeTill) {
        add["activeTill"] = activeTill;
    }
    if (description) {
        add["description"] = description;
    }
    if (voucherType) {
        add["voucherType"] = voucherType
    }
    if (forCandidates) {
        add["forCandidates"] = forCandidates;
    }
    if (voucherId) {
        const updateVoucher = await Vouchers.findOneAndUpdate(
            { _id: voucherId },
            { $set: add }
        );
        if (!updateVoucher) {
            return res.status(400).send({ status: false, msg: 'Failed' })
        }
    } else {
        const addVoucher = await Vouchers.create(add);
        if (!addVoucher) {
            return res.status(400).send({ status: false, msg: 'Failed' })
        }
    }
    if (forCandidates == "true") {
        return res.status(302).redirect("/admin/Vouchers/candidate");
    } else {
        return res.status(302).redirect("/admin/Vouchers/company");
    }
});
router.route("/updateVoucher").put(async (req, res) => {
    try{
        let { id, status } = req.body;
        const updateVoucher = await Vouchers.findOneAndUpdate(
            { _id: id },
            { status: status }
        );
        if (!updateVoucher) {
            return res.status(400).send({ status: false, msg: "Failed" });
        }
        res.status(202).send({ status: true, msg: "Success" });

    }catch(err){
        console.log(err);
    }
})
router.route("/company").get(async(req,res)=>{
    const menu = 'companyVouchers'
    const view = false;
    if(req.session.user.role === 10){
        view = true
    }
    let status
    let isChecked
    if (req.query.status == undefined) {
        status = true;
        isChecked = "false";
    } else if (req.query.status.toString() == "true") {
        status = req.query.status;
        isChecked = "false";
    } else {
        status = false;
        isChecked = "true";
    }
    const count = await Vouchers.countDocuments({
        forCandidates: false,
        status
    })
    const p = parseInt(req.query.page);
    const page = p || 1;
    const perPage = 10;
    const totalPages = Math.ceil(count / perPage);
    const vouchers = await Vouchers.find({ forCandidates: false, status }).sort({ createdAt: -1 })
        .skip(perPage * page - perPage)
        .limit(perPage);
    res.render(`${req.vPath}/admin/miPieVouchers/company/company`, { menu, isChecked, view, vouchers, page, totalPages, count })
})
router.route("/company/addEditVoucher/:voucherId?").get(async (req, res) => {
    const {voucherId}=req.params
    let menu = "companyVouchers";
    let voucher = await Vouchers.findById(voucherId);
    res.render(`${req.vPath}/admin/miPieVouchers/company/addOrEdit`, { menu, voucher });
})
router.route('/company/viewVoucher/:voucherId?').get(auth1,async (req, res) => {
    let menu = "companyVouchers";
    const { voucherId } = req.params;
    const voucher = await Vouchers.findById(voucherId);
    if (!voucher) {
        req.flash("error", "Voucher not Found");
        return res.redirect("/admin/Vouchers/company");
    }
    return res.render(`${req.vPath}/admin/miPieVouchers/company/viewVoucher`, { menu, voucher })
})
module.exports = router