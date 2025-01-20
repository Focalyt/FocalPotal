const express = require("express");
const router = express.Router();
const candidateRoutes=require('./candidateRoutes');
router.use('/',candidateRoutes);
module.exports=router;
