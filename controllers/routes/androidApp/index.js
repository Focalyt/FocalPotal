const express = require("express");
const router = express.Router();
const androidAppRoutes=require('./androidAppRoutes');
router.use('/',androidAppRoutes);
module.exports=router;
