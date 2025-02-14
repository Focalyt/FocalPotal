const express = require('express');
const router = express.Router();
const striptags = require('striptags');
const {
  FAQ

} = require('../../models');
const { isAdmin } = require('../../../helpers');


router.use(isAdmin);

// Route for adding FAQs


router.get('/add', async (req, res) => {
  try {
    return res.render(`${req.vPath}/admin/chatBot`, {
        menu: 'chatBotFAQAdd',
    });

  } catch (err) {
    console.error("Error:", err);
    return res.status(400).json({ error: true, message: "Something went wrong" });
  }
});
// router.post('/add', async(req , res)=>{
//   try{
//     console.log(req.body)
//     const {question, answer} = req.body
//     if(!question && !answer){

//       return res.send({ status: "failure", error: "Question & Answer not available!", details: error })

//     }

//      // Save post to MongoDB
//         const newFaq = new FAQ({
//           Question:question, Answer:answer          
//         });
    
//         const savedFaq = await newFaq.save(); 
//         return res.send({
//           status: true,
//           message: 'FAQ created successfully',
//           data: savedFaq,
//         });


//   }
//   catch (err) {
//     console.error("Error:", err);
//     return res.status(400).json({ error: true, message: "Something went wrong" });
//   }
// })

// Route for viewing FAQs
// router.post('/add', async (req, res) => {
//   try {
//       const { faqs } = req.body;

//       if (!faqs || !Array.isArray(faqs) || faqs.length === 0) {
//           return res.status(400).json({ error: true, message: "No FAQ data provided!" });
//       }

//       const sanitizedFaqs = faqs.map(faq => ({
//         question: striptags(faq.question),
//         answer: striptags(faq.answer)
//     }));

//       // Insert multiple FAQs into the database
//       const savedFaqs = await FAQ.insertMany(faqs);
//       console.log(savedFaqs)
    

//       return res.status(201).json({
//           status: true,
//           message: "FAQs added successfully!",
//           data: savedFaqs
//       });

//   } catch (err) {
//       console.error("Error:", err);
//       return res.status(500).json({ error: true, message: "Internal Server Error" });
//   }
// });
router.post('/add', async (req, res) => {
  try {
      const { faqs } = req.body;

      if (!faqs || !Array.isArray(faqs) || faqs.length === 0) {
          return res.status(400).json({ error: true, message: "No FAQ data provided!" });
      }

      // ✅ Remove HTML tags before saving
      const sanitizedFaqs = faqs.map(faq => ({
          Question: striptags(faq.Question), // ✅ Removes <p> and other tags
          Answer: striptags(faq.Answer)
      }));

      console.log("Before Sanitization:", faqs);
      console.log("After Sanitization:", sanitizedFaqs);

      // ✅ Insert sanitized data into the database
      const savedFaqs = await FAQ.insertMany(sanitizedFaqs);

      return res.status(201).json({
          status: true,
          message: "FAQs added successfully!",
          data: savedFaqs
      });

  } catch (err) {
      console.error("Error:", err);
      return res.status(500).json({ error: true, message: "Internal Server Error" });
  }
});
router.get('/view', async (req, res) => {
  try {   

    const status = req.query.status === undefined ? true : req.query.status === "true"; 

    let isChecked  = "checked";
    if(status=="true" || status==true){
      isChecked=""

    }else{
      isChecked="checked"

    }
    const filter = {
      status: status
    }

    console.log(isChecked)
    const Que= await FAQ.find(filter)
    return res.render(`${req.vPath}/admin/chatBot/view`, {
        menu: 'chatBotFAQList', Que,
        isChecked
    });
  } catch (err) {
    console.error("Error:", err);
    return res.status(400).json({ error: true, message: "Something went wrong" });
  }
});

router.patch("/changeStatus" , async (req, res) => {
    try {
      const updata = { $set: { status: req.body.status } };
  
      const data = await FAQ.findByIdAndUpdate(req.body.id, updata);
  
      if (!data) {
        return res.status(500).send({
          status: false,
          message: "Can't update status of this job post",
        });
      }
  
      return res.status(200).send({ status: true, data: data });
    } catch (err) {
      console.log(err.message);
      req.flash("error", err.message || "Something went wrong!");
      return res.status(500).send({ status: false, message: err.message });
    }
  });
router.patch("/edit" , async (req, res) => {
    try {
      const updata = { $set: { Question: req.body.Question, Answer: req.body.Answer } };
  
      const data = await FAQ.findByIdAndUpdate(req.body.id, updata);
  
      if (!data) {
        return res.status(500).send({
          status: false,
          message: "Can't update status of this job post",
        });
      }
  
      return res.status(200).send({ status: true, data: data });
    } catch (err) {
      console.log(err.message);
      req.flash("error", err.message || "Something went wrong!");
      return res.status(500).send({ status: false, message: err.message });
    }
  });

module.exports = router;
