const express = require('express');
const { isAdmin } = require("../../../helpers");
const cashBackLogic = require('../../models/cashBackLogic');
const router = express.Router();
router.use(isAdmin)

router.route('/')
    .get(async (req, res) => {
        try {
            let menu = 'cashbackLogic'
            const cbLogic = await cashBackLogic.findOne()
            return res.render(`${req.vPath}/admin/cashbackLogic`, { menu, cbLogic })
        }
        catch (err) {
            console.log(err);
            return res.status(500).send({ status: false, message: err })
        }
    })
    .post(async (req, res) => {
        try {
            const values=req.body
            const updatedFields = {}
            Object.keys(values).forEach((key) => {
                if (values[key] !== '') {
                    updatedFields[key]=values[key]
                }
            })
            const updateCashBack=await cashBackLogic.findOneAndUpdate({},updatedFields,{new:true, upsert: true});
            if(!updateCashBack){
                req.flash("error", "Can't add value to cash back offers")
                return res.redirect("back")
            }else{
                req.flash("success", "Cash Back Values added Succesfully.")
                return res.redirect("back")
            }
        }
        catch (err) {
            console.log(err)
            return res.status(500).send({ status: false, message: err })
        }
    })

module.exports = router;