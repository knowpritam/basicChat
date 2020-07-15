const express = require('express');
const bodyParser = require('body-parser');
var admin = require('./firebase-config');

const app = express();
app.use(bodyParser.json());

const notification_options = {
    priority: "high",
    timeToLive: 60 * 60 * 24
  };


exports.postNotif = function(registrationToken, from, message){
  var payload = {
    notification: {
      title: from,
      body: message
    }
  };
  const options =  notification_options;
  console.log('sending notif');
  console.log(registrationToken);
  console.log(payload);
  admin.messaging().sendToDevice(registrationToken, payload, options)
  .then( response => {
    console.log('sent notif');
  })
  .catch( error => {
      console.log(error);
  });
};