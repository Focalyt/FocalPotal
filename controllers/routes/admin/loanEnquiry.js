const express = require("express")
const router = express.Router()
const ObjectId = require("mongodb").ObjectId;
const  { LoanEnquiry } = require("../../models")
const { loanEnquiryPurpose, loanEnquiryStatus} = require("../../db/constant");
const moment = require('moment')

router.route('/')
.get(async (req,res)=>{
    try{ 
        let view = false;
        if(req.session.role === 10){
            view = true
        }
        const populate = [
            { 
                path : '_candidate' ,
                select:"name mobile city state",
                populate: [{
                    path:'state',
                    select : 'name'
                },
                {
                    path:'city',
                    select:'name'
                }]
            }
        ]
        let data = req.query
        let filter = {}
        if( data.fromDate && data.toDate ){
            let fdate = moment(data.fromDate).utcOffset("+05:30").startOf('day')
			let tdate = moment(data.toDate).utcOffset("+05:30").endOf('day')
			filter["createdAt"] = { $gte: fdate, $lte: tdate }
        }

        const perPage = 20;
        const p = parseInt(req.query.page);
        const page = p || 1;
        const loans = await LoanEnquiry.find(filter)
        .populate(populate)
        .sort({ createdAt: -1 })
        .skip(perPage * page - perPage)
        .limit(perPage);

        const count = await LoanEnquiry.countDocuments(filter)
        const totalPages = Math.ceil(count / perPage);

        let loanStatus = Object.keys(loanEnquiryStatus)
        return res.render(`${req.vPath}/admin/loanEnquiry`,{
            menu:'loanEnquiry', totalPages,loans,count,page,view,loanStatus, data
        })
    }
    catch(err){
        console.log(err);
        req.flash("error",err.message || 'Something went wrong');
        return res.redirect("back");
    }
})

router.route('/createLoan')
.post(async (req,res)=>{
    try{
       const body = req.body;
       const loan = await LoanEnquiry.create(body)
       if(!loan){
        res.status(400).send({status : false,message:'Something went wrong'})
       }
       return res.status(200).send({ status:true,data:loan})
    }
    catch(err){
    console.log(err)
    res.status(500).send({status : false,message:err.message})
    }
})

router.route('/updateStatus')
.put(async (req,res)=>{
    try{
        const { comment, loanId, status } = req.body
        let loanEnquiry = await LoanEnquiry.findOne({ _id: loanId})
        if(!loanEnquiry){
            return res.send({status:false,message:"Something went wrong"})
        }

        let updatedLoan = await LoanEnquiry.findOneAndUpdate({ _id: loanId },{ comment , status , new:true })
        if(!updatedLoan){
            return res.send({status:false,message:"Something went wrong while updating"})
        }
        return res.send({ status:true ,message: "Status Updated Successfully" })
    }
    catch(err){
        console.log(err);
        return res.status(500).send({ status :false, message:err.message })
    }
})
module.exports = router