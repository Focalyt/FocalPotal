const Joi = require('joi')
module.exports = {
    register : (data) => {
        return Joi.object({
            email:Joi.string().trim().email().required(),
            collegeName:Joi.string().trim().max(30).required(),
            mobile: Joi.string().trim().length(10).pattern(/^[0-9]+$/).required(),
            concernedPerson: Joi.string().trim().max(20).required()
        }).validate(data)
    }
}