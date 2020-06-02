var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// var participantSchema = new Schema({
//     participant : {
//         type : mongoose.Schema.Types.ObjectId,
//         ref: 'User'
//     }
// });

const Conversation = new Schema({
    participants : [
        {
            participant : {
                type : Schema.Types.ObjectId,
                ref: 'User'
            }
        }   
    ]
},
{
    timestamps:true
});

module.exports = mongoose.model('Conversation', Conversation);