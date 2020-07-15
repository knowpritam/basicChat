const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());

var admin = require("firebase-admin");

var serviceAccount = require("./basicChat.json");


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://basicchat-ef861.firebaseio.com"
});

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