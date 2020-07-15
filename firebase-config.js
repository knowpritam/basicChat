var admin = require("firebase-admin");

var serviceAccount = require("./basicChat.json");


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://basicchat-ef861.firebaseio.com"
})

module.exports.admin = admin