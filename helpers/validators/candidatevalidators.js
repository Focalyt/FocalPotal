const Joi = require('joi')
module.exports = {
    register : (data) => {
        return Joi.object({
            name: Joi.string().trim().max(30).required(),
            mobile: Joi.string().trim().length(10).pattern(/^[0-9]+$/).required(),
            sex: Joi.string().trim().required(),
            place: Joi.string().required(),
            latitude: Joi.number().required(),
            longitude: Joi.number().required() ,
            refCode:Joi.string().optional()
        }).validate(data)
    },
    userMobile:(data) => {
        return Joi.object({
            mobile: Joi.number().required(),
        }).validate(data)
    }
}
