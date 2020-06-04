var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Messages = new Schema ({
    sender: {
        type : mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    content: {
        type: String,
        default: ''
    },
    conversationId:   {
        type : mongoose.Schema.Types.ObjectId,
        ref: 'Conversation'
    }
},
    {
        timestamps:true
    }
);


module.exports = mongoose.model('Messages', Messages);