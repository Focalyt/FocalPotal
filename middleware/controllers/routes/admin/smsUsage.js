const express = require("express");
const templates = require("../../models/templates");
const { isAdmin, auth1 } = require("../../../helpers");
const {Consumption, template} = require("../../models");
const router = express.Router();
const moment = require('moment');
const mongoose = require('mongoose');
router.use(isAdmin);

router.route('/templates')
    .get(auth1, async (req, res) => {
        try {
            let isChecked="false",status=true
            let view = false
            if(req.session.user.role === 10){
                view = true
            }
            if (req.query.status == undefined) {
                status = true;
                isChecked = "false";
            } else if (req.query.status.toString() == "true") {
                status = true;
                isChecked = "false";
            } else if (req.query.status.toString() == "false") {
                 status = false;
                 isChecked = "true";
            }
            const perPage = 10;
            const p = parseInt(req.query.page);
            const page = p || 1;
            let menu = 'templates';
            const count = await templates.countDocuments({status})
            const totalPages = Math.ceil(count / perPage);

            let data = await templates.find({status}).sort({ createdAt: -1 }).skip(perPage * page - perPage).limit(perPage);

            return res.render(`${req.vPath}/admin/smsUsage/templates`, {
                menu,
                data,
                isChecked,
                totalPages,
                page,
                view
            })
        }
        catch (err) {
            console.log(err)
            return res.status(500).send({ status: false, message: err })
        }
    })
router.route('/addTemplate/:id?')
    .get(auth1, async (req, res) => {
        try {
            let id = req.params.id;
            let data;
            if(id){
                data = await templates.findOne({_id:id})
            };
            let menu = 'templates';
            
            return res.render(`${req.vPath}/admin/smsUsage/templates/addTemplate`, {
                menu,
                data
            })
        }
        catch (err) {
            console.log(err)
            return res.status(500).send({ status: false, message: err })
        }
    })
    .post(auth1, async (req, res) => {
        try {
            const id = req.query.id
            const { templateId, activationDate,name, message,categories } = req.body;
            
            let update = {new:true}
            if(templateId){
                update["templateId"] = templateId
            }
            if(activationDate){
                update["activationDate"] = activationDate
            }
            if(name){
                update["name"] = name
            }
            if(message){
                update["message"] = message
            }
            if(categories){
                update["categories"] = categories
            }
            
            if(id){
                const duplicate = await templates.findOne({_id:{'$ne':id},status:true,templateId})
                if (duplicate) {
                    req.flash("error","Template Id is already in use!!")
                    return res.redirect("back")
                }
                const updatedData = await templates.findOneAndUpdate({_id:id,status:true},{ $set: update})
                if (!updatedData) {
                    req.flash("error","Can't Update!!")
                    return res.redirect("back")
                }
                return res.redirect('/admin/smsUsage/templates')

            }
            const duplicate = await templates.findOne({ status: true, templateId })
            if (duplicate) {
                req.flash("error","Template Id is already in use!!")
                return res.redirect("back")
            }

            const addTemplate = await templates.create(req.body);
            if (!addTemplate) {
                return res.status(400).send({ status: false, msg: 'Failed' })
            }
            return res.redirect('/admin/smsUsage/templates')
        }
        catch (err) {
            console.log(err)
            return res.status(500).send({ status: false, message: err })
        }
    })

    router.route("/updateTemplate").put(auth1, async (req, res) => {
        let { id, status } = req.body;
        const updateTemplate = await templates.findOneAndUpdate(
          { _id: id },
          { status: status }
        );
        if(!updateTemplate){
          return res.status(400).send({ status: false, msg: "Failed" });
        }
        res.status(202).send({ status: true, msg: "Success" });
      });

      router.route("/viewTemplate/:id").get(auth1, async (req, res) => {
        try {
          let { id } = req.params;
          let data = await templates.findById(id);
          if(!data){
            req.flash("error", 'Template not found');
            return res.status(302).redirect("/admin/smsUsage/templates");
        
          }
          
          return res.render(`${req.vPath}/admin/smsUsage/templates/viewTemplate`, {
            menu: "templates",
            data,
          });
        } catch (err) {
          req.flash("error", err.message);
          return res.status(302).redirect("/admin/smsUsage/templates");
        }
      });
      
    router.route('/consumption').get(auth1,async(req,res) => {
        let data = req.query
        let filter = {}
        let populatedFilter = {}
        
		if(data.FromDate && data.ToDate){
			filter["createdAt"] = {
				$gte: moment(data.FromDate).utcOffset("+05:30").startOf('day').toDate(),
				$lte: moment(data.ToDate).utcOffset("+05:30").endOf('day').toDate()
			}
		}
        if(data.templateName && data.templateName != 'All'){
			filter["template"] = mongoose.Types.ObjectId(data.templateName)
		}
        if(data.companyName){
            populatedFilter["_company.0.name"] ={
				"$regex": data.companyName,
				"$options": "i"
			 }
        }

        const perPage = 10;
        const p = parseInt(req.query.page);
        const page = p || 1;

        let sms = await Consumption.aggregate([
            {$match: filter},
            {$lookup: {
                from: 'companies',
                localField: '_company',
                foreignField: '_id',
                as: '_company'
              }},
            {$lookup: {
                from: 'templates',
                localField: 'template',
                foreignField: '_id',
                as: 'template'
            }},
            {$match: populatedFilter},
            { '$sort'     : { 'createdAt' : -1 } },
            { '$facet'    : {
            metadata: [ { '$count': "total" } ],
            totalMessages: [ {'$group': {
                '_id': '',
                 'total': {$sum: '$messages'}
              }} ],
            data: [ { $skip: perPage * page - perPage }, { $limit: perPage } ] 
            }}
        ])

        console.log(sms[0].totalMessages, "==============")

        let count = sms[0].metadata[0]?.total
        if(!count){
            count = 0
        }
        const totalPages = Math.ceil(count / perPage);

        let templates = await template.find({status: true}).select('name')

        return res.render(`${req.vPath}/admin/smsUsage/consumption`, {
            menu:"consumption",
            sms: sms[0].data,
            count,
            totalPages,
            page,
            data,
            templates,
            totalMessages: sms[0].totalMessages[0]?.total
        })
    })
module.exports = router;
