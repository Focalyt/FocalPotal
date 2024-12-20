const {
    Notification
  } = require("../../models");
  
  module.exports.sendNotification = async (data) => {
    try {
        let notification = await Notification.create(data)
        if(!notification){
          return false
        }
        return true 
    } catch (err) {
      console.log(err.message);
    }
  };