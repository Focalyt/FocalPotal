const express = require("express");
const path = require("path");
const { ObjectId } = require("mongodb");
const bcrypt = require("bcryptjs");
const {
User,
PaymentDetails
} = require("../../models");
const moment = require("moment");

const { generatePassword, sendMail, isAdmin ,isCo} = require("../../../helpers");

const router = express.Router();
router.use(isAdmin);

router.route("/").get(async (req, res) => {
	try{
		const data = req.query;

	    let filter = {
		isDeleted : false
		}

		if(data.FromDate && data.ToDate){
			let fdate = moment(data.FromDate).utcOffset("+05:30").startOf('day')
			let tdate = moment(data.ToDate).utcOffset("+05:30").endOf('day')
			filter["createdAt"] = {
				$gte: fdate,
				$lte: tdate
			}
		}
		if(data.type && data.type !=='All'){
		    if(data.type === '_candidate'){
				filter['_candidate'] ={$exists: true}
			}
			if(data.type === '_company'){
				filter['_company'] ={$exists: true}
			}
	    }
		const populate = [
			{path:"_candidate",select:"name mobile"},
			{path:"_company",select:"name",populate: "_concernPerson" },
		]

		const count = await PaymentDetails.countDocuments(filter)

		const perPage = 20;
		const p = parseInt(req.query.page, 10);
		const page = p || 1;
		const totalPages = Math.ceil(count / perPage);

		const payments = await PaymentDetails.find(filter)
                 .populate(populate)
                 .sort({createdAt: -1})
                 .skip(perPage * page - perPage)
                 .limit(perPage);
	    const sum = await PaymentDetails.find(filter)
	    const amount = sum.reduce(function (acc ,curr){ return acc + curr.amount},0)
		
		return res.render(`${req.vPath}/admin/payments`,{data,page,perPage,totalPages,payments,amount,menu:'payments'})
	}
	catch(err){
		console.log(err);
		return res.status(500).send({status:false,message:err})
	}
})


router.get('/paymentDetailsBackfill', async ( req, res) => {
	const payments = await PaymentDetails.find({ $or: [{orderId: "NA"}, {paymentId: "NA"}]}).select('_id orderId paymentId')
	for(let ele of payments){
		console.log(ele, '=====================')
		let update = await PaymentDetails.updateOne({ _id: ele._id }, { paymentId: new ObjectId, orderId: new ObjectId})
		console.log(update, '====')
	}
	res.send({count: payments.length})
})
module.exports = router;