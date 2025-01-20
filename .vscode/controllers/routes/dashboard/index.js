const express = require('express');

const userRoutes = require('./user');

const { isAdmin } = require('../../../helpers');

const router = express.Router();
router.use('/user', userRoutes);
router.use(isAdmin);

router.get('/', async (req, res) => {
  try {
    // const totalBills = await Bill.countDocuments({ is_deleted: false });
    // const errorBills = await Bill.countDocuments({ is_deleted: false, billStatus: 'Error' });
    // const matchs = {
    //   $match: {
    //     $or: [{ status: 1 }, { status: 2 }],
    //   },
    // };
    // const groups = {
    //   $group: {
    //     _id: 'null',
    //     totalAmount: {
    //       $sum: '$paidAmount',
    //     },
    //   },
    // };
    // const paymentDone = await Payment.aggregate([matchs, groups]);
    // let amount = 0;
    // if (paymentDone && paymentDone.length > 0) {
    //   amount = paymentDone[0].totalAmount;
    // }
    // const find = {
    //   $match: {
    //     is_deleted: false,
    //   },
    // };
    // const collect = {
    //   $group: {
    //     _id: 'null',
    //     Amount: {
    //       $sum: '$billAmount',
    //     },
    //   },
    // };
    // const money = await Bill.aggregate([find, collect]);
    // let totalAmount = 0;
    // if (money && money.length > 0) {
    //   totalAmount = money[0].Amount;
    // }

    // const finddata = { status: 0 };
    // const populates = [
    //   {
    //     path: 'billId',
    //     select: 'billNumber billDate companyName',
    //   }, {
    //     path: 'store',
    //     select: 'storeName',
    //   }];
    // const paymentdata = await Payment.find(finddata).populate(populates);

    // const finaldata = {};
    // let adminDate = moment(req.session.user.createdAt).endOf('month');
    // const todaydate = moment().endOf('month');
    // while (todaydate >= adminDate) {
    //   const obj = {
    //     key: moment(adminDate).format('MMM YYYY'),
    //     value: paymentdata.filter(x => moment(x.createdAt) <=
    // adminDate && moment(x.createdAt) > moment(adminDate).subtract(1, 'M'))
    // .slice(0, 4), // eslint-disable-line
    //   };
    //   finaldata[moment(adminDate).unix()] = obj;
    //   adminDate = moment(adminDate).add(1, 'M');
    // }

    // const storeData = await Store.find({ }).select({ storeName: true });
    // const promises = storeData.map(async (s) => {
    //   const Stages = await Stage.find({ abbr: { $nin: ['pdo', 'per'] } }).select({ _id: 1 });
    //   const stage = Stages.map(x => x._id);

    //   const match = {
    //     $match: {
    //       store: s._id,
    //       billStages: { $in: stage },
    //     },
    //   };
    //   const group = {
    //     $group: {
    //       _id: '$store',
    //       totalAmount: {
    //         $sum: '$billAmount',
    //       },
    //       billcount: { $sum: 1 },
    //       billErr: { $sum: { $cond: [{ $eq: ['$billStatus', 'Error'] }, 1, 0] } },
    //     },
    //   };
    //   const billData = await Bill.aggregate([match, group]);
    //   if (billData && billData.length > 0) {
    //     s.billProgress = billData[0].billcount; // eslint-disable-line
    //     s.billError = billData[0].billErr; // eslint-disable-line
    //     s.Amount = billData[0].totalAmount; // eslint-disable-line
    //   } else {
    //     s.billProgress = 0; // eslint-disable-line
    //     s.billError = 0; // eslint-disable-line
    //     s.Amount = 0; // eslint-disable-line
    //   }
    // });
    // await Promise.all(promises);
    return res.render(`${req.vPath}/admin`);
  } catch (err) {
    req.session.formData = req.body;
    req.flash('error', err.message || 'Something went wrong!');
    return res.redirect('back');
  }
});

module.exports = router;
