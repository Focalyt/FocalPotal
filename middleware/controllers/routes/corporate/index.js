const corporateRoutes=require('./corporateRoutes');
const express = require("express");
const router = express.Router();
router.use('/',corporateRoutes);
module.exports=router; 