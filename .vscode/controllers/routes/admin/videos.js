const express = require("express");
const { VideoData} = require("../../models");
const { isAdmin, auth1 } = require("../../../helpers");
const videoData = require("../../models/videoData");
const router = express.Router();
router.use(isAdmin);
router.route("/list").get(async(req,res)=>{
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
        const menu='youtubeGallery'
        const count=await VideoData.find({status:status}).countDocuments();
        const perPage = 10;
        const p = parseInt(req.query.page);
        const page = p || 1;
        const totalPages = Math.ceil(count / perPage);
        const videos=await VideoData.find({status:status})
                    .sort({ createdAt: -1 })
                    .skip(perPage * page - perPage)
                   .limit(perPage);
                   console.log("videos",videos,count,status)
       res.render(`${req.vPath}/admin/youtubeGallery`,{menu,videos,page,totalPages,isChecked,view})
    }catch(err){
        console.log(err)
        req.flash('error',err.message)
        res.send({status:false,message:err})
    }
})
router.route("/addOrEditVideo/:videoId?")
    .post(auth1,async(req,res)=>{
        try{
          const {videoId}=req.params;
          const {title,description,embedURL}=req.body
          let addVideo
          const menu='youtubeGallery';
          const details={};
          if(title){
            details['title']=title
          }
          if(description){
            details['description']=description
          }
          if(embedURL){
            details['embedURL']=embedURL
          }
          if(videoId){
            const updateVideo=await VideoData.findByIdAndUpdate({_id:videoId},details);
            if(!updateVideo){
                req.flash('error','unable to update')
                res.send({status:false,message:'unable to update'})
            }
        }else{
          addVideo=await VideoData.create(details);
        }
        req.flash('success','Video successfully updated')
        return res.status(302).redirect("/admin/uploadedVideos/list")
        }catch(err){
            console.log(err,"err>>>")
            req.flash('error',err.message)
            res.send({status:false,message:err})
        }
    })
    .get(async(req,res)=>{
        console.log("in this route")
        const {videoId}=req.params;
        const video=await videoData.findOne({_id:videoId});
        const menu='youtubeGallery';
        res.render(`${req.vPath}/admin/youtubeGallery/addOrEdit`,{menu,video})
    })
router.patch('/changeStatus',async(req,res)=>{
    try{
      const {id,status}=req.body;
      const updateStatus=await VideoData.findByIdAndUpdate({_id:id},{status})
      if(!updateStatus){
        res.send({status:false,message:'Unable to add the status'})
      }
      res.send({status:true,message:'Video status updated'})
    }catch(err){
        res.send({status:false,message:'Unable to add the status'})
    }
})
router.route("/updatesequence").patch(async(req,res)=>{
    const {videoId,val}=req.body
    const update=await VideoData.findByIdAndUpdate({_id:videoId},{sequence:+(val)})
    res.send({status:true,sequence:val})
  })
module.exports=router