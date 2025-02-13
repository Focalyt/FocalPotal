const express = require('express');
const router = express.Router();
const {
  Faq

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
router.post('/add', async(req , res)=>{
  try{
    const {question, answer} = req.body
    if(!question && !answer){

      return res.send({ status: "failure", error: "Question & Answer not available!", details: error })

    }

     // Save post to MongoDB
        const newFaq = new Faq({
          question, answer          
        });
    
        const savedFaq = await newFaq.save(); 
        return res.send({
          status: true,
          message: 'FAQ created successfully',
          data: savedFaq,
        });


  }
  catch (err) {
    console.error("Error:", err);
    return res.status(400).json({ error: true, message: "Something went wrong" });
  }
})

// Route for viewing FAQs
router.get('/view', async (req, res) => {
  try {
    return res.render(`${req.vPath}/admin/chatBot/view`, {
        menu: 'chatBotFAQList', 
    });
  } catch (err) {
    console.error("Error:", err);
    return res.status(400).json({ error: true, message: "Something went wrong" });
  }
});

module.exports = router;
