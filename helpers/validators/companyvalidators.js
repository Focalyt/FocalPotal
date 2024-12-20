const Joi = require('joi')
module.exports = {
    register : (data) => {
        return Joi.object({
            firstName: Joi.string().trim().max(30).required(),
            lastName: Joi.string().trim().max(30).required(),
            email:Joi.string().trim().email().required(),
            phoneNumber: Joi.string().trim().length(10).pattern(/^[0-9]+$/).required(),
            companyName:Joi.string().trim().max(100).required(),
        }).validate(data)
    }
}