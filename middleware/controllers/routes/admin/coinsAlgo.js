const express = require('express');
const { isAdmin } = require("../../../helpers");
const { CoinsAlgo } = require("../../models")
const router = express.Router();
router.use(isAdmin)

router.route('/')
.get(async (req,res)=>{
    try{
        let menu = 'coinsAlgo'
        const coinsInfo = await CoinsAlgo.findOne()
        return res.render(`${req.vPath}/admin/coinsAlgo`,{menu,coinsInfo})
    }
    catch(err){
        console.log(err);
        return res.status(500).send({status:false,message:err})
    }
})
.post(async (req,res)=>{
    try{
        const {contactcoins,job,SMS,shortlist,companyCoins,candidateCoins} = req.body;
        let data = {}
        if(contactcoins){
            data["contactcoins"] = contactcoins
        }        
        if(job){
            data["job"] = job
        }
        if(SMS){
            data["SMS"] = SMS
        }
        if(shortlist){
            data["shortlist"] = shortlist
        }
        if(candidateCoins){
            data["candidateCoins"] = candidateCoins
        }
        if(companyCoins){
            data["companyCoins"] = companyCoins
        }
        const coinsInfo = await CoinsAlgo.find()
        if(coinsInfo.length==0){
            const coins = await CoinsAlgo.create(data)
            if(!coins){
                req.flash("error","Can't add value to coins!!")
                return res.redirect("back")
            }
            req.flash("success","Coins Value added Succesfully.")
            return res.redirect("back")
        }
        
        const updated = await CoinsAlgo.findOneAndUpdate({},data,{new:true})
        if(!updated){
            req.flash("error","Can't Update!!")
            return res.redirect("back")
        }
        req.flash("success","Coins Value added Succesfully.")
        return res.redirect("back")

    }
    catch(err){
        console.log(err)
        return res.status(500).send({status:false,message:err})
    }
})

module.exports = router;