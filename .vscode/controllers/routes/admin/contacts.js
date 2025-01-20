const express = require("express");
const bcrypt = require("bcryptjs");
const { isAdmin ,auth1} = require("../../../helpers");
const moment = require("moment");
const { Contact } = require("../../models");
const router = express.Router();
router.use(isAdmin);
router.get("/",async(req,res)=>{
    try{
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
        const count=await Contact.find({status:true,isDeleted:false}).countDocuments()
       const perPage = 10;
       const p = parseInt(req.query.page);
       const page = p || 1;
       const contacts=await Contact.find({status,isDeleted:false})
       .sort({ createdAt: -1 })
       .skip(perPage * page - perPage)
       .limit(perPage);
       const totalPages = Math.ceil(count / perPage);
       return res.render(`${req.vPath}/admin/contact`, {
        menu: "Contact",
        contacts,
        totalPages,
        page,
        isChecked,
        view
      });

    }catch(err){
        req.flash("error", err.message || "Something went wrong!");
		return res.redirect("back");
    }
})
router.route("/addOrEdit/:id?").get(async(req,res)=>{
try{
    const {id}=req.params;
    const contact=await Contact.findOne({_id:id,status:true,isDeleted:false});
    return res.render(`${req.vPath}/admin/contact/addOrEdit`,{
        menu:"Contact",
        contact
    })
}catch(err){
    req.flash("error", err.message || "Something went wrong!");
    return res.redirect("back");
}
})
router.route("/addContact").post(auth1, async (req, res) => {
    const { contactId } = req.query;
    const {
     name,
     whatsapp,
     mobile
    } = req.body;
    let add = {};
    if (name) {
      add["name"] = name;
    }
    if (whatsapp) {
      add["whatsapp"] = whatsapp;
    }
    if (mobile) {
      add["mobile"] = mobile;
    }
    if (contactId) {
      const updateContact = await Contact.findOneAndUpdate(
        { _id: contactId },
        { $set: add }
      );
      if(!updateContact){
        return res.status(400).send({status: false, msg: 'Failed'})
      }
      return res.status(302).redirect("/admin/contact");
    } else {
      const addContact = await Contact.create(add);
      if(!addContact){
        return res.status(400).send({status: false, msg: 'Failed'})
      }
      return res.status(302).redirect("/admin/contact");
    }
  });
  
  router.route("/updateContact").put(auth1, async (req, res) => {
    let { id, status } = req.body;
    const updateContact = await Contact.findOneAndUpdate(
      { _id: id },
      { status: status }
    );
    if(!updateContact){
      return res.status(400).send({ status: false, msg: "Failed" });
    }
    res.status(202).send({ status: true, msg: "Success" });
  });
  router.route("/viewContact/:id").get(async(req,res)=>{
    try{ 
        const {id}=req.params;
        const contact=await Contact.findOne({_id:id,status:true,isDeleted:false});
        return res.render(`${req.vPath}/admin/contact/view`,{
            menu:"Contact",
            contact
        })
    }catch(err){
        req.flash('error',err.message||'Something went wrong');
        return res.redirect("back");
    }
  })
router.route("/deleteContact/:id").delete(auth1,async(req,res)=>{
    const {id}=req.params;
    console.log(id)
    const deleteContact=await Contact.deleteOne({_id:id});
    if(!deleteContact){
       res.send({status:false,message:'not able to delete'})
    }
    res.send({status:true,message:'Deleted successfully!'})
  })


module.exports=router
