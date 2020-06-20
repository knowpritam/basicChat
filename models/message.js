var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Messages = new Schema ({
    chatId: {
        type : String,
        default: ''
    },
    toId:   {
        type : String,
        default: ''
    },
    fromId:   {
        type : String,
        default: ''
    },
    fromName: {
        type: String,
        default: ''
    },
    toName: {
        type: String,
        default: ''
    },
    messageText: {
        type: String,
        default: ''
    },
    chatType: { 
        type: String,
        default: ''
    },
    timeStamp: {
        type: String,
        default: ''
    },

},
    {
        timestamps:true
    }
);


module.exports = mongoose.model('Messages', Messages);