const express = require("express");
const { auth1, isAdmin } = require("../../../helpers");
const CoinsOffers = require("../../models/coinsOffers");
const { PaymentDetails } = require("../../models");
const router = express.Router();
const ObjectId = require("mongodb").ObjectId;
const mongoose = require('mongoose');
const moment = require("moment")

router.route("/candidate").get(auth1, async (req, res) => {
  let view = false
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
  const perPage = 10;
  const p = parseInt(req.query.page);
  const page = p || 1;
  const count = await CoinsOffers.countDocuments({
    forCandidate: true,
    status,
  });
  const totalPages = Math.ceil(count / perPage);

  const offers = await CoinsOffers.find({
    forCandidate: true,
    status,
  })
    .sort({ createdAt: -1 })
    .skip(perPage * page - perPage)
    .limit(perPage);
  return res.render(`${req.vPath}/admin/miPieCoins/candidate/candidate`, {
    menu: "candidate",
    offers,
    totalPages,
    page,
    isChecked,
    menu:'candidateCoins',
    view
  });
});

router.route("/candidate/addEditOffer/:offerId?").get(auth1, async (req, res) => {
  let { offerId } = req.params;
  let offer = {};
  if (offerId) {
    offer = await CoinsOffers.findById(offerId);
  }
  return res.render(`${req.vPath}/admin/miPieCoins/candidate/addEditOffer`, {
    menu: "candidateCoins",
    offer,
  });
});

router.route("/candidate/viewOffer/:offerId").get(auth1, async (req, res) => {
  try {
    let { offerId } = req.params;
    let offer = await CoinsOffers.findById(offerId);
    if (!offer) {
      req.flash("error", "Offer not Found");
      return res.redirect("/admin/Coins/candidate");
    }
    return res.render(`${req.vPath}/admin/miPieCoins/candidate/viewOffer`, {
      menu: "candidateCoins",
      offer,
    });
  } catch (err) {
    req.flash("error", err.message);
    return res.redirect("/admin/Coins/candidate");
  }
});

router.route("/company").get(auth1, async (req, res) => {
  let view = false
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
  const perPage = 10;
  const p = parseInt(req.query.page);
  const page = p || 1;
  const count = await CoinsOffers.countDocuments({
    forCandidate: false,
    status,
  });
  const totalPages = Math.ceil(count / perPage);

  const offers = await CoinsOffers.find({
    forCandidate: false,
    status,
  })
    .sort({ createdAt: -1 })
    .skip(perPage * page - perPage)
    .limit(perPage);

  return res.render(`${req.vPath}/admin/miPieCoins/company/company`, {
    menu: "company",
    offers,
    isChecked,
    totalPages,
    page,
    menu:'companyCoins',
    view
  });
});

router.route("/company/addEditOffer/:offerId?").get(auth1, async (req, res) => {
  let { offerId } = req.params;
  let offer = {};
  if (offerId) {
    offer = await CoinsOffers.findById(offerId);
  }
  return res.render(`${req.vPath}/admin/miPieCoins/company/addEditOffer`, {
    menu: "companyCoins",
    offer,
  });
});

router.route("/company/viewOffer/:offerId").get(auth1, async (req, res) => {
  try {
    let { offerId } = req.params;
    let offer = await CoinsOffers.findById(offerId);
    if(!offer){
      req.flash("error", 'Offer not found');
      return res.status(302).redirect("/admin/Coins/company");
  
    }
    return res.render(`${req.vPath}/admin/miPieCoins/company/viewOffer`, {
      menu: "companyCoins",
      offer,
    });
  } catch (err) {
    req.flash("error", err.message);
    return res.status(302).redirect("/admin/Coins/company");
  }
});

router.route("/addOffer").post(auth1, async (req, res) => {
  const { offerId } = req.query;
  const {
    displayOffer,
    payAmount,
    getCoins,
    activationDate,
    activeTill,
    description,
    forCandidate,
  } = req.body;
  let add = {};
  if (displayOffer) {
    add["displayOffer"] = displayOffer;
  }
  if (payAmount) {
    add["payAmount"] = payAmount;
  }
  if (getCoins) {
    add["getCoins"] = getCoins;
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
  if (forCandidate) {
    add["forCandidate"] = forCandidate;
  }
  if (offerId) {
    const updateOffer = await CoinsOffers.findOneAndUpdate(
      { _id: offerId },
      { $set: add }
    );
    if(!updateOffer){
      return res.status(400).send({status: false, msg: 'Failed'})
    }
  } else {
    const addOffer = await CoinsOffers.create(add);
    if(!addOffer){
      return res.status(400).send({status: false, msg: 'Failed'})
    }
  }
  if (forCandidate == "true") {
    return res.status(302).redirect("/admin/Coins/candidate");
  } else {
    return res.status(302).redirect("/admin/Coins/company");
  }
});

router.route("/updateOffer").put(auth1, async (req, res) => {
  let { id, status } = req.body;
  const updateOffer = await CoinsOffers.findOneAndUpdate(
    { _id: id },
    { status: status }
  );
  if(!updateOffer){
    return res.status(400).send({ status: false, msg: "Failed" });
  }
  res.status(202).send({ status: true, msg: "Success" });
});

router.route("/availedCandidates/:id").get(auth1 ,async(req,res)=>{
  try{
    const _offer = req.params.id;
    let data = req.query
    
    let filter = { '_offer._id': new mongoose.Types.ObjectId(_offer), isDeleted: false }

    let numberCheck = isNaN(data.name)
			let name = ''
			
			var format = `/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;`;
			data.name?.split('').some(char => 
				{
					if(!format.includes(char))
					name+= char
				})
			
			if (name && numberCheck) {
				filter["$or"] = [
					{ "_candidate.name":{ "$regex": name, "$options": "i"}},
				]
			}
			if (name && !numberCheck ) {
				filter["$or"] = [
					{ "_candidate.name":{ "$regex": name, "$options": "i"}},
					{ "_candidate.mobile": Number(name )},
				  { "_candidate.whatsapp": Number(name) }
				]
			}

			if(data.date){
				let fdate = moment(data.date).utcOffset("+05:30").startOf('day').toDate()
				let tdate = moment(data.date).utcOffset("+05:30").endOf('day').toDate()
				filter["createdAt"] = {
					$gte: fdate,
					$lte: tdate
				}
			}

		const perPage = 10;
		const p = parseInt(req.query.page, 10);
		const page = p || 1;

    let { value, order } = req.query
    let sorting = [] , sort ={}
    sort[`${value}`] = Number(order)
			if( value && order ){
        sorting.push({'$sort': sort})
			}

    let agg = [
      {
        '$lookup':
        {
          from : 'candidates',
          localField: '_candidate',
          foreignField: '_id',
          as: '_candidate'
        }
  
      },
      {
        '$unwind' : '$_candidate'
      },
      {
        '$lookup':
        {
          from : 'coinsoffers',
          localField: '_offer',
          foreignField: '_id',
          as: '_offer'
        }
      },
      {
      '$unwind' : '$_offer'
      },
      {
        '$match': filter
      },
      ...sorting,
      {
        '$facet' : {
        metadata: [ { '$count': "total" } ],
        data: [ { $skip: perPage * page - perPage }, { $limit: perPage } ] 
        }
      }
    ]

  let PaymentData = await PaymentDetails.aggregate(agg)
  let count = PaymentData[0].metadata[0]?.total
  if(!count){
    count = 0
  }
  let payments = PaymentData[0].data
  const totalPages = Math.ceil(count / perPage);

   return res.render(`${req.vPath}/admin/miPieCoins/candidate/candidateList`, {
    menu: "candidateCoins",
    payments,
    data,
    totalPages,
    page,
    count,
    offerId : _offer,
    sortingOrder : order,
    sortingValue : value
  });
  }
  catch(err){
    console.log(err)
    req.flash("error",err.message)
    return res.redirect("back")
  }
})

router.get('/availedCompanies/:id',auth1 , async(req,res)=>{
  try{
    const _offer = req.params.id;
    let data = req.query
    
    let filter = { '_offer._id': new mongoose.Types.ObjectId(_offer), isDeleted: false }

    let numberCheck = isNaN(data.name)
			let name = ''
			
			var format = `/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;`;
			data.name?.split('').some(char => 
				{
					if(!format.includes(char))
					name+= char
				})
        if (name && numberCheck) {
          filter["$or"] = [
            { "_company.name":{ "$regex": name, "$options": "i"}},
          ]
        }
        if (name && !numberCheck ) {
          filter["$or"] = [
            { "_company.name":{ "$regex": name, "$options": "i"}},
            { "_company.mobile": Number(name)},
            { "_company.whatsapp": Number(name) }
          ]
        }
  
        if(data.date){
          let fdate = moment(data.date).utcOffset("+05:30").startOf('day').toDate()
          let tdate = moment(data.date).utcOffset("+05:30").endOf('day').toDate()
          filter["createdAt"] = {
            $gte: fdate,
            $lte: tdate
          }
        }
  
      const perPage = 10;
      const p = parseInt(req.query.page, 10);
      const page = p || 1;
  
      let { value, order } = req.query
      let sorting = [] , sort ={}
      sort[`${value}`] = Number(order)
        if( value && order ){
          sorting.push({'$sort': sort})
        }
        let agg = [
          {
            '$lookup':
            {
              from : 'companies',
              localField: '_company',
              foreignField: '_id',
              as: '_company'
            }
      
          },
          {
            '$unwind' : '$_company'
          },
          {
            '$lookup':
            {
              from : 'coinsoffers',
              localField: '_offer',
              foreignField: '_id',
              as: '_offer'
            }
          },
          {
          '$unwind' : '$_offer'
          },
          {
            '$lookup':
            {
              from : 'users',
              localField: '_company._concernPerson',
              foreignField: '_id',
              as: 'user'
            }
          },
          {
            '$match': filter
          },
          ...sorting,
          {
            '$facet' : {
            metadata: [ { '$count': "total" } ],
            data: [ { $skip: perPage * page - perPage }, { $limit: perPage } ] 
            }
          }
        ]
    
      let PaymentData = await PaymentDetails.aggregate(agg)
      let count = PaymentData[0].metadata[0]?.total
      if(!count){
        count = 0
      }
      let payments = PaymentData[0].data
      const totalPages = Math.ceil(count / perPage);
       return res.render(`${req.vPath}/admin/miPieCoins/company/companyList`, {
        menu: "companyCoins",
        payments,
        data,
        totalPages,
        page,
        count,
        offerId : _offer,
        sortingOrder : order,
        sortingValue : value
      });
			
  }
  catch(err){
    console.log(err)
    req.flash("error",err.message)
    return res.redirect("back")
  }
})
module.exports = router;
