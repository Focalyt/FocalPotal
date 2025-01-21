const {
  Candidate,
  CandidateCashBack,
  CashBackLogic,
  AppliedJobs,
} = require("../../models");
const moment = require("moment");
const ObjectId = require("mongodb").ObjectId;
const { candidateCashbackEventName, cashbackRequestStatus, cashbackEventType } = require('../../db/constant')
const { sendNotification } = require('./notification')

module.exports.candidateProfileCashBack = async (candidateData) => {
  try {
    let event = candidateCashbackEventName.profilecomplete;
    let candidate = await Candidate.findOne({ _id: candidateData._id });
    if (
      candidateData.isProfileCompleted == false &&
      candidate.isProfileCompleted == true
    ) {
      let cashbackDetails = await CashBackLogic.findOne({});
      let add = {
        candidateId: candidateData._id,
        eventType: cashbackEventType.credit,
        eventName: event,
        amount: cashbackDetails[event],
        isPending: true,
      };
      let cashbackGiven = await CandidateCashBack.findOne({
        candidateId: candidateData._id,
        eventName: event,
      });
      if (cashbackGiven) {
        return false;
      }
      await CandidateCashBack.create(add);
      let data = {
        title:'Profile Completion',
        message: 'Congratulations! Your profile is completed. Start applying for the Job.__बधाई हो! आपका प्रोफ़ाइल पूरा हो गया है। नौकरी के लिए आवेदन करना शुरू करें।',
        _candidate: candidateData._id
      }
      await sendNotification(data)
      let totalCashback = await CandidateCashBack.aggregate([
        { $match: { candidateId: ObjectId(candidateData._id) } },
        { $group: { _id: "", totalAmount: { $sum: "$amount" } } },
      ]);
      data.title = 'Focalyt Earnings'
      data.message = `Congratulations! You have earned रु ${add.amount}/- Your current Wallet Balance is रु ${totalCashback[0].totalAmount}/-.`
      await sendNotification(data)
      return true;
    } else {
      return false;
    }
  } catch (err) {
    console.log(err.message);
  }
};

module.exports.candidateReferalCashBack = async (referral) => {
  try {
    let event = candidateCashbackEventName.referral;
    let candidate = await Candidate.findOne({ _id: referral.referredBy });
      let cashbackDetails = await CashBackLogic.findOne({});
      let add = {
        candidateId: candidate._id,
        eventType: cashbackEventType.credit,
        eventName: event,
        amount: cashbackDetails['Referral'],
        isPending: true,
      };
      
      await CandidateCashBack.create(add);
      let totalCashback = await CandidateCashBack.aggregate([
        { $match: { candidateId: ObjectId(candidate._id) } },
        { $group: { _id: "", totalAmount: { $sum: "$amount" } } },
      ]);
      let data = {
        title:'Referral Earning',
        _candidate: candidate._id,
        message : `Congratulations! You have earned रु ${add.amount}/- Your current Wallet Balance is रु ${totalCashback[0].totalAmount}/-.`
      }
      await sendNotification(data)
      return true;
    
  } catch (err) {
    console.log(err.message);
  }
};


module.exports.candidateVideoCashBack = async (candidateData) => {
  try {
    let event = candidateCashbackEventName.videoprofile;
    let candidate = await Candidate.findOne({ _id: candidateData._id });
    if (!candidateData.profilevideo && candidate.profilevideo) {
      let cashbackDetails = await CashBackLogic.findOne({});
      let add = {
        candidateId: candidateData._id,
        eventType: cashbackEventType.credit,
        eventName: event,
        amount: cashbackDetails[event],
        isPending: true,
      };
      let cashbackGiven = await CandidateCashBack.findOne({
        candidateId: candidateData._id,
        eventName: event,
      });
      if (cashbackGiven) {
        return false;
      }
      await CandidateCashBack.create(add);
      let totalCashback = await CandidateCashBack.aggregate([
        { $match: { candidateId: ObjectId(candidateData._id) } },
        { $group: { _id: "", totalAmount: { $sum: "$amount" } } },
      ]);
      let data = {
        title:'Focalyt Earnings',
        message: `Congratulations! You have earned रु ${add.amount}/- Your current Wallet Balance is रु ${totalCashback[0].totalAmount}/-.__बधाई हो! आपने रु ${add.amount}/- अर्जित किए हैं | आपका वर्तमान वॉलेट बैलेंस रु ${totalCashback[0].totalAmount}/- है।`,
        _candidate: candidateData._id
      }
      await sendNotification(data)
      return true;
    } else {
      return false;
    }
  } catch (err) {
    console.log(err.message);
  }
};

module.exports.candidateApplyCashBack = async (candidateData) => {
  try {
    let event = candidateCashbackEventName.apply;
    let cashbackDetails = await CashBackLogic.findOne({});
    let streakDuration = cashbackDetails.streakDuration - 1

    let lastApplyCashback = await CandidateCashBack.findOne({
      candidateId: candidateData._id,
      eventType: cashbackEventType.credit,
      eventName: event,
      createdAt: {
        $gt: moment().subtract(streakDuration, "d").utcOffset("+05:30").startOf("day"),
      },
    });
    if (!lastApplyCashback) {
      let add = {
        candidateId: candidateData._id,
        eventType: cashbackEventType.credit,
        eventName: event,
        amount: cashbackDetails[event],
        isPending: true,
      };
      await CandidateCashBack.create(add);
      let totalCashback = await CandidateCashBack.aggregate([
        { $match: { candidateId: ObjectId(candidateData._id) } },
        { $group: { _id: "", totalAmount: { $sum: "$amount" } } },
      ]);
      let data = {
        title:'Focalyt Earnings',
        message: `Congratulations! You have earned रु ${add.amount}/- Your current Wallet Balance is रु ${totalCashback[0].totalAmount}/-.__बधाई हो! आपने रु ${add.amount}/- अर्जित किए हैं | आपका वर्तमान वॉलेट बैलेंस रु ${totalCashback[0].totalAmount}/- है।.`,
        _candidate: candidateData._id
      }
      await sendNotification(data)

      return true;
    } else {
      return false;
    }
  } catch (err) {
    console.log(err.message);
  }
};

module.exports.candidateHiringStatusCashBack = async (candidateData, event) => {
  try {
    let cashbackDetails = await CashBackLogic.findOne({});
    let add = {
      candidateId: candidateData._id,
      eventType: cashbackEventType.credit,
      eventName: event,
      amount: cashbackDetails[event],
      isPending: true,
    };
    let cashbackGiven = await CandidateCashBack.create(add);
    let totalCashback = await CandidateCashBack.aggregate([
      { $match: { candidateId: ObjectId(candidateData._id) } },
      { $group: { _id: "", totalAmount: { $sum: "$amount" } } },
    ]);
    let data = {
      title:'Focalyt Earnings',
      message: `Congratulations! You have earned रु ${add.amount}/- Your current Wallet Balance is रु ${totalCashback[0].totalAmount}/-.__बधाई हो! आपने रु ${add.amount}/- अर्जित किए हैं | आपका वर्तमान वॉलेट बैलेंस रु ${totalCashback[0].totalAmount}/- है।.`,
      _candidate: candidateData._id
    }
    await sendNotification(data)

    if (cashbackGiven) {
      return true;
    } else {
      return false;
    }
  } catch (err) {
    console.log(err.message);
  }
};

module.exports.checkCandidateCashBack = async (candidateData) => {
  try {
    let candidateCashbackDetails = await CandidateCashBack.find({ candidateId: candidateData._id, eventName: candidateCashbackEventName.apply, isPending: true })
    let totalCashback = await CandidateCashBack.aggregate([
      { $match: { candidateId: ObjectId(candidateData._id)} },
      { $group: { _id: "", totalAmount: { $sum: "$amount" } } },
    ]);
    let cashback = totalCashback.length ? totalCashback[0].totalAmount : 0
    let cashbackDetails = await CashBackLogic.findOne({});
    let streakDuration = cashbackDetails.streakDuration

    if(!candidateCashbackDetails.length){
      let firstCashback = await CandidateCashBack.find({ candidateId: candidateData._id, eventType: cashbackEventType.credit, isPending: true }).sort({createdAt: 1}).limit(1)
      if(!firstCashback.length){
        return
      }
      let compare =  moment().subtract(streakDuration, "d").startOf("day").isAfter(moment(firstCashback[0].createdAt).startOf("day"))
      if(compare){
        await CandidateCashBack.updateMany(
          { candidateId: candidateData._id, isPending: true, eventType: cashbackEventType.credit },
          { isPending: false }
        );
        let add = {
          candidateId: candidateData._id,
          eventType: cashbackEventType.debit,
          eventName: candidateCashbackEventName.inactive,
          amount: -cashback,
          isPending: false,
        };
        await CandidateCashBack.create(add)
        return
      }
    }else{
      let lastApplyJob = await AppliedJobs.findOne({
        _candidate: candidateData._id,
        createdAt: {
          $gt: moment().subtract(streakDuration, "d").utcOffset("+05:30").startOf("day"),
        },
      });
      if (!lastApplyJob) {
        await CandidateCashBack.updateMany(
          { candidateId: candidateData._id, isPending: true, eventType: cashbackEventType.credit },
          { isPending: false }
        );
        let add = {
          candidateId: candidateData._id,
          eventType: cashbackEventType.debit,
          eventName: candidateCashbackEventName.inactive,
          amount: -cashback,
          isPending: false,
        };
        await CandidateCashBack.create(add)
      }
    }
  } catch (err) {
    console.log(err.message);
  }
};
