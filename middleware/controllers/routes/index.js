const express = require('express');
const frontRoutes = require('./front');
const viewsRoutes = require('./views');
const apiRoutes = require('./api');
const chatRoutes = require('./chat');
const adminRoutes = require('./admin');
const collegeRoutes = require('./college');
const { sendMail } = require("../../helpers");
// const companyRoutes = require('./company');
const candidateRoutes=require('./candidate');
const corporateRoutes=require('./corporate');
const { baseUrl } = require("../../config");
const router = express.Router();
const fetch = require("cross-fetch");
const { authChat } = require("../../helpers");
const { updateSpreadSheetLabLeadsValues } = require("./services/googleservice");
const moment = require("moment");

router.use('/', frontRoutes);
router.use('/candidate',candidateRoutes);
router.use('/api', apiRoutes);
router.use('/candidateForm', viewsRoutes);
router.use('/admin', adminRoutes);
router.use('/college', collegeRoutes);
router.use('/chatapi', authChat,  chatRoutes);
// router.use('/panel/company', companyRoutes);
router.use('/company',corporateRoutes);
router.get('/policy', async (req, res) => {
  try {
    return res.render(`${req.vPath}/front/policy`);
  } catch (err) {
    req.session.formData = req.body;
    req.flash('error', err.message || 'Something went wrong!');
    return res.redirect('back');
  }
});
router.post('/contact',async (req, res) => {
  try {
   
    const { name, mobile, email, message } = req.body;
    if(!name || !mobile|| !email||!message){
        req.flash("success", "Please fill all fields");
            return res.redirect("/contact");
    }
    const response_key = req.body["g-recaptcha-response"];
    // Put secret key here, which we get from google console
    const secret_key = "6Lej1gsqAAAAADDB6EA8QfiRcJdgESc4UBMqOXeq";



    const url = 
    `https://www.google.com/recaptcha/api/siteverify?secret=${secret_key}&response=${response_key}`;
      fetch(url, {
        method: "post",
      })
        .then((response) => response.json())
        .then((google_response) => {
            console.log('====================> ', google_response)
          if (google_response.success == true && google_response.score >=0.5) {
            let subject = " New message Received";
            let msg = `<html lang="en">
            <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            </head>
            <body>
            <div>
            <table border="0" cellpadding="0" cellspacing="0" style="height: 100%; width: 100%;">
                      <tbody> 
                          <tr>
                              <td align="center" valign="top">
                                  <table border="0" cellspacing="0" style="width: 600px; ">
                                      <tbody>
                                          <tr>
                                              <td align="center" valign="top" style="font-family:'Manrope',sans-serif!important">
                                                  <table border="0" cellspacing="0" cellpadding="0 ="
                                                      style="background-color: #F4F3F3; border-radius: 4px; overflow: hidden; text-align: center; width: 620px;">
                                                      <tbody>
                                                          <tr>
                                                              <td style="background-color:#FC2B5A;color:#ffffff!important"
                                                                  valign="top">
                                                                  <a>
                                                                      <img src="${baseUrl}/images/logo/logo.png" alt="pic"
                                                                          style="position: relative; background-color: #FC2B5A; display: block; margin: 40px auto 0; width: 170px!important;background-repeat: no-repeat;padding-bottom: 50px; ">
                                                                  </a>
                                                              </td>
                                                          </tr>
                                                          <tr>
                                                              <td align="left" style="font-family:'Manrope',sans-serif!important">
                                                                  <br/>
                                                                  <p
                                                                      style="text-align:left;line-height:32px;font-size:18px!important;font-family:'Manrope',sans-serif!important;margin:10px 50px 21px">
                                                                      You have received a new message with the following details:- </p>
                                                                  <ul style="list-style-type:none;padding-left:0px;margin:20px 50px">
                                                                      <li style="padding-top:0px;margin-left:0px !important"><span
                                                                              style="line-height:32px;font-size:18px!important;font-family:'Manrope',sans-serif!important">
                                                                              User Name:- ${name} (${mobile}) </span></li>
                                                                      <br/>
                                                                      <li style="padding-top:0px;margin-left:0px !important"><span
                                                                              style="line-height:32px;color:#4d4d4d;font-size:18px!important;font-family:'Manrope',sans-serif!important">Email
                                                                              : ${email}</span>
                                                                      </li>
                                                                      <li style="padding-top:0px;margin-left:0px !important"><span
                                                                              style="line-height:32px;color:#4d4d4d;font-size:18px!important;font-family:'Manrope',sans-serif!important">Message : ${message}
                                                                          </span></li>
                                                                      <br/>
                                                                      
                                                                  </ul>
                                                              </td>
                                                          </tr>
                                                          
                                                      </tbody>
                                                  </table>
                                              </td>
                                          </tr>
                                      </tbody>
                                  </table>
                              </td>
                          </tr>
                      </tbody>
                  </table>
          </div>
          </body>
          </html>
          
                `;
                
            sendMail(subject, msg, 'info@focalyt.com');
            
        
            req.flash("success", "Message sent successfully!");
            return res.redirect("/contact");
          } else {
            req.flash("success", "Captcha  failed");
            return res.redirect("/contact");
          }
        })
        .catch((error) => {
            // Some error while verify captcha
          return res.json({ error });
        });
  } catch (err) {
    console.log("error is ", err);
    req.flash("error", err.message || "Something went wrong!");
    return res.send({ status: "failure", error: "Something went wrong!" });
  }
});


router.post('/futureTechnologyLabs',async (req, res) => {
  try {
   
    const { name, designation,organisation,state, mobile, email, message } = req.body;
    console.log("Form Data:", req.body);
    // Capitalize every word's first letter
    function capitalizeWords(str) {
      if (!str) return '';
      return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
    };
    const sheetData = [
      moment(new Date()).utcOffset('+05:30').format('DD/MM/YYYY'),
      moment(new Date()).utcOffset('+05:30').format('hh:mm A'),
      
      capitalizeWords(organisation), // Apply the capitalizeWords function
      capitalizeWords(name),
      capitalizeWords(designation),
      mobile,
      email,
      state,
      message


    ];
    await updateSpreadSheetLabLeadsValues(sheetData);
    if(!name || !designation || !organisation|| !state || !mobile|| !email || !message){
        req.flash("success", "Please fill all fields");
            return res.redirect("/futureTechnologyLabs");
    }
    const response_key = req.body["g-recaptcha-response"];
    // Put secret key here, which we get from google console
    const secret_key = "6Lej1gsqAAAAADDB6EA8QfiRcJdgESc4UBMqOXeq";



    const url = 
    `https://www.google.com/recaptcha/api/siteverify?secret=${secret_key}&response=${response_key}`;
      fetch(url, {
        method: "post",
      })
        .then((response) => response.json())
        .then((google_response) => {
            console.log('====================> ', google_response)
          if (google_response.success == true && google_response.score >=0.5) {
            let subject = " Future Technology Labs: New Demo Request";
            let msg = `<html lang="en">
            <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            </head>
            <body>
            <div>
            <table border="0" cellpadding="0" cellspacing="0" style="height: 100%; width: 100%;">
                      <tbody> 
                          <tr>
                              <td align="center" valign="top">
                                  <table border="0" cellspacing="0" style="width: 600px; ">
                                      <tbody>
                                          <tr>
                                              <td align="center" valign="top" style="font-family:'Manrope',sans-serif!important">
                                                  <table border="0" cellspacing="0" cellpadding="0 ="
                                                      style="background-color: #F4F3F3; border-radius: 4px; overflow: hidden; text-align: center; width: 620px;">
                                                      <tbody>
                                                          <tr>
                                                              <td style="background-color:#FC2B5A;color:#ffffff!important"
                                                                  valign="top">
                                                                  <a>
                                                                      <img src="${baseUrl}/images/logo/logo.png" alt="pic"
                                                                          style="position: relative; background-color: #FC2B5A; display: block; margin: 40px auto 0; width: 170px!important;background-repeat: no-repeat;padding-bottom: 50px; ">
                                                                  </a>
                                                              </td>
                                                          </tr>
                                                          <tr>
                                                              <td align="left" style="font-family:'Manrope',sans-serif!important">
                                                                  <br/>
                                                                  <p
                                                                      style="text-align:left;line-height:32px;font-size:18px!important;font-family:'Manrope',sans-serif!important;margin:10px 50px 21px">
                                                                      You have received a new message with the following details:- </p>
                                                                  <ul style="list-style-type:none;padding-left:0px;margin:20px 50px">
                                                                  <li style="padding-top:0px;margin-left:0px !important"><span
                                                                              style="line-height:32px;color:#4d4d4d;font-size:18px!important;font-family:'Manrope',sans-serif!important">Organisation
                                                                              : ${organisation}</span>
                                                                      </li>    
                                                                  <li style="padding-top:0px;margin-left:0px !important"><span
                                                                              style="line-height:32px;font-size:18px!important;font-family:'Manrope',sans-serif!important">
                                                                              User Name:- ${name} (${mobile}) </span></li>
                                                                      <br/>
                                                                      <li style="padding-top:0px;margin-left:0px !important"><span
                                                                              style="line-height:32px;color:#4d4d4d;font-size:18px!important;font-family:'Manrope',sans-serif!important">Designation
                                                                              : ${designation}</span>
                                                                      </li>
                                                                      <li style="padding-top:0px;margin-left:0px !important"><span
                                                                              style="line-height:32px;color:#4d4d4d;font-size:18px!important;font-family:'Manrope',sans-serif!important">Email
                                                                              : ${email}</span>
                                                                      </li>
                                                                      <li style="padding-top:0px;margin-left:0px !important"><span
                                                                              style="line-height:32px;color:#4d4d4d;font-size:18px!important;font-family:'Manrope',sans-serif!important">State
                                                                              : ${state}</span>
                                                                      </li>
                                                                      <li style="padding-top:0px;margin-left:0px !important"><span
                                                                              style="line-height:32px;color:#4d4d4d;font-size:18px!important;font-family:'Manrope',sans-serif!important">Message : ${message}
                                                                          </span></li>
                                                                      <br/>
                                                                      
                                                                  </ul>
                                                              </td>
                                                          </tr>
                                                          
                                                      </tbody>
                                                  </table>
                                              </td>
                                          </tr>
                                      </tbody>
                                  </table>
                              </td>
                          </tr>
                      </tbody>
                  </table>
          </div>
          </body>
          </html>
          
                `;
            sendMail(subject, msg, 'info@focalyt.com');
        
            req.flash("success", "Message sent successfully!");
            // return res.redirect("/futureTechnologyLabs");
            res.send(`
              <script>
                alert('Message sent successfully!');
                window.location.href = '/futureTechnologyLabs';
              </script>
            `);
          } else {
            req.flash("success", "Captcha  failed");
            return res.redirect("/futureTechnologyLabs");
          }
        })
        .catch((error) => {
            // Some error while verify captcha
          return res.json({ error });
        });
  } catch (err) {
    console.log("error is ", err);
    req.flash("error", err.message || "Something went wrong!");
    return res.send({ status: "failure", error: "Something went wrong!" });
  }
});
module.exports = router;
