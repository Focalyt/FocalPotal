const express = require("express");
const path = require("path");
const {
  PaymentDetails,
  Company,
  Candidate,
  coinsOffers,
  AppliedCourses
} = require("../../models");
const { isAdmin } = require("../../../helpers");
const router = express.Router();
const Razorpay = require("razorpay");
const moment = require("moment");
const apiKey = process.env.MIPIE_RAZORPAY_KEY;
const razorSecretKey = process.env.MIPIE_RAZORPAY_SECRET;

router.use(isAdmin);

router.route("/").get(async (req, res) => {
  try {
    let { fromDate, endDate } = req.query;

    // Default dates if not provided
    if (!fromDate) {
      fromDate = moment().utcOffset("+05:30").startOf("day").format("YYYY-MM-DD");
    }
    if (!endDate) {
      endDate = moment().utcOffset("+05:30").endOf("day").format("YYYY-MM-DD");
    }
    let fromTimestamp = moment(fromDate).utcOffset("+05:30").startOf("day").unix();;
    let toTimestamp = moment(endDate).utcOffset("+05:30").endOf("day").unix();;
    
    let instance = new Razorpay({
      key_id: apiKey,
      key_secret: razorSecretKey,
    });
    let paymentsData = await instance.payments.all({
      from: fromTimestamp,
      to: toTimestamp,
      count: 100,
    });

    let filteredPayments = paymentsData.items.filter((ele) => ele.status == 'captured')
return res.render(`${req.vPath}/admin/razorpayPayments`, {
      menu: "razorpayPayments",
      paymentsData: filteredPayments,
      fromDate, // Pass 'fromDate' to the template for display
      endDate,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ status: false, message: err });
  }
});

router.get("/checkCoinsAllocation/:paymentId", async (req, res) => {
  try {
    let view = false
    if (req.session.user.role === 10) {
      view = true
    }
    const paymentId = req.params.paymentId;
    const paymentStatus = await PaymentDetails.findOne({ paymentId });
    res.send({ paymentStatus, view });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ status: false, message: err });
  }
});

router.post("/allocateCoins", async (req, res) => {
  try {
    const { userId, paymentId, orderId, amount, paymentStatus, offerId, courseId } =
      req.body;
    let isAlreadyAllocated = await PaymentDetails.findOne({paymentId})
    if(isAlreadyAllocated){
      return res.send({ msg: "Coins already allocated!" });
    }
    const offerDetails = offerId ? await coinsOffers.findOne({ _id: offerId }) : '';
    let addPayment = {
      paymentId,
      orderId,
      amount,
      coins: offerDetails?.getCoins || 0,
      _offer: offerId,
      _course: courseId,
      paymentStatus,
    };

    let appliedCourse = await AppliedCourses.findOne({_candidate:userId, _course:courseId})
    if(courseId && appliedCourse) {
        addPayment["_candidate"] = userId;
        delete addPayment._offer
        await PaymentDetails.create(addPayment);
        await AppliedCourses.findOneAndUpdate(
          { _id: appliedCourse._id },
          {
            registrationFee: 'Paid'         
          }
        );
        return res.status(201).send({ msg: "Success" });
      }
    let isCompany = await Company.findOne({ _id: userId });
    if (!isCompany) {
      let candidate = await Candidate.findOne({ _id: userId });
      if (!candidate) {
        return res.send({ msg: "User not found!" });
      }
      addPayment["_candidate"] = userId;
    } else {
      addPayment["_company"] = userId;
    }
    await PaymentDetails.create(addPayment);
    if (addPayment._candidate) {
      await Candidate.findOneAndUpdate(
        { _id: addPayment._candidate },
        {
          $inc: {
            availableCredit: offerDetails.getCoins,
            creditLeft: offerDetails.getCoins,
          },
        }
      );
    } else {
      await Company.findOneAndUpdate(
        { _id: addPayment._company },
        {
          $inc: {
            availableCredit: offerDetails.getCoins,
            creditLeft: offerDetails.getCoins,
          },
        }
      );
    }
    await coinsOffers.findOneAndUpdate(
      { _id: offerId },
      { $inc: { availedCount: 1 } }
    );
    res.status(201).send({ msg: "Success" });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ status: false, message: err });
  }
});
module.exports = router;
