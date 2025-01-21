const express = require('express');
const { User } = require('../../models');
// const { Country, State, City } = require('../../models');
// const { isAdmin, sendSms } = require('../../../helpers');
// const { shortUrlApi, env } = require('../../../config');

const router = express.Router();
// router.use(isAdmin);

router.route('/')
  .get(async (req, res) => {
    try {
      const perPage = 5;
      const p = parseInt(req.query.page, 10);
      const page = p || 1;
      const count = await User.countDocuments({ role: { $ne: 'admin' } });
      const populate = [{
        path: '_zone',
        select: 'name',
      }];
      const staffs = await User.find({ role: { $ne: 'admin' } })
        .populate(populate)
        .select('name email mobile address status')
        .sort({ createdAt: -1 })
        .skip((perPage * page) - perPage)
        .limit(perPage);
      const totalPages = Math.ceil(count / perPage);
      return res.render(`${req.vPath}/dashboard/leadtype/staff`, {
        staffs, perPage, totalPages, page,
      });
    } catch (err) {
      req.flash('error', err.message || 'Something went wrong!');
      return res.redirect('back');
    }
  });


// router.route('/add')
//   .get(async (req, res) => {
//     try {
//       const country = await Country.find({});
//       return res.render(`${req.vPath}/dashboard/leadtype/staff/add`, { country });
//     } catch (err) {
//       req.flash('error', err.message || 'Something went wrong!');
//       return res.redirect('back');
//     }
//   })
//   .post(async (req, res) => {
//     try {
//       const {
//         dateOfJoining, name, _zone, mobile, email, password, address, stateId, cityId, countryId,
//       } = req.body;
//       const staff = await Staff.findOne({ $or: [{ email }, { mobile }] });
//       if (staff) throw req.ykError('Email or mobile no is already exist!');
//       const role = 'account manager';
//       Staff.create({
//         dateOfJoining,
//         name,
//         _zone,
//         mobile,
//         email,
//         password,
//         address,
//         stateId,
//         cityId,
//         countryId,
//         role,
//       });
//       req.flash('success', 'Staff added successfully!');
//       return res.redirect('/dashboard/staff');
//     } catch (err) {
//       req.flash('error', err.message || 'Something went wrong!');
//       return res.redirect('back');
//     }
//   });

// router.route('/edit/:id')
//   .get(async (req, res) => {
//     try {
//       const populate = { path: '_zone', select: 'name' };
//       const staff = await Staff.findById(req.params.id).populate(populate);
//       const country = await Country.find({});
//       const state = await State.find({ countryId: staff.countryId });
//       const city = await City.find({ stateId: staff.stateId });
//       const zone = await Zone.find({
//         countryId: staff.countryId,
//         cityId: staff.cityId,
//         stateId: staff.stateId,
//       });
//       if (!staff) throw req.ykError('Staff not found!');
//       return res.render(`${req.vPath}/dashboard/leadtype/staff/edit`, {
//         staff, country, state, city, zone,
//       });
//     } catch (err) {
//       req.flash('error', err.message || 'Something went wrong!');
//       return res.redirect('back');
//     }
//   })
//   .post(async (req, res) => {
//     try {
//       const {
//         dateOfJoining, name, _zone, mobile, email, password, address, countryId, stateId, cityId,
//       } = req.body;
//       const staff = await Staff.findOne({
//         _id: { $ne: req.params.id },
//         $or: [{ email }, { mobile }],
//       });
//       if (staff) return req.ykError('Staff already exist!');
//       const zoneUpdate = await Staff.findByIdAndUpdate(req.params.id, {
//         dateOfJoining, name, _zone, mobile, email, password, address, countryId, stateId, cityId,
//       });
//       if (!zoneUpdate) throw req.ykError('Staff not updated!');
//       req.flash('success', 'Staff updated successfully!');
//       return res.redirect('/dashboard/staff');
//     } catch (err) {
//       req.flash('error', err.message || 'Something went wrong!');
//       return res.redirect('back');
//     }
//   });

module.exports = router;
