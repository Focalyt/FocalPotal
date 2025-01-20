const express = require("express");
let path = require("path");
const { auth1, isAdmin } = require("../../../helpers");
const bcrypt = require('bcryptjs')

const {
	Import,
	Candidate,
	Qualification,
	Skill,
	Country,
	User,
	State,
	City,
	College,
	SubQualification,
	University
} = require("../../models");


const router = express.Router();

router.route('/')
.get( async (req, res) => {
	let view = false
		if(req.session.user.role === 10){
			view = true
		}
    let users = await User.find({role: {$in: [0, 10]}})
	let user = ''
	return res.render(`${req.vPath}/admin/adminRoles`, {
		menu: 'admin-roles', users, view, user
	});
})
.post( async (req, res) => {
	let { role, email, password } = req.body
	let addUser = {}
	if(role) { addUser['role'] = role }
	if(email) { 
		addUser['email'] = email
		let duplicateEmail = await User.findOne({email: email, role: {$in: [0, 10]}})
		if(duplicateEmail){
		    req.flash('error', 'Email already Exists')
			return res.redirect('/admin/roles')

		}
	 }
	if(password) { addUser['password'] = password }
	let user = await User.create(addUser)
	if(!user) {
		req.flash('error', 'User not added')
		return res.redirect('/admin/roles')
	}
	req.flash('success', 'User added Successfully')
	return res.redirect('/admin/roles')
})

router.route('/edit/:userId')
.get( async (req, res) => {
	let view = false
		if(req.session.user.role === 10){
			view = true
		}
	let userId = req.params.userId
	let user = await User.findOne({_id: userId})

	let users = await User.find({role: {$in: [0, 10]}})
	return res.render(`${req.vPath}/admin/adminRoles`, {
		menu: 'admin-roles', users, view, user
	});
})
.post( async (req, res) => {
	let userId = req.params.userId
	let { role, email, password } = req.body
	let addDetails = {}
	if(role) { addDetails['role'] = role }
	if(email) { addDetails['email'] = email }
	if(password) { 
		let newPassword =await  bcrypt.hash(password, 10)
		addDetails['password'] = newPassword
	 }
	let updateUser = await User.findOneAndUpdate({_id: userId}, addDetails)
	if(!updateUser) {
		req.flash('error', 'User not updated')
		return res.redirect('/admin/roles')
	}
	req.flash('success', 'User updated Successfully')
	return res.redirect('/admin/roles')
})





module.exports = router;