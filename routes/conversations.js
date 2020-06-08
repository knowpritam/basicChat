const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const ObjectId = require('mongodb').ObjectID;
const authenticate = require('../authenticate');

const Conversation = require('../models/conversation');

const conversations = express.Router();
conversations.use(bodyParser.json());

/**
 * get on conversations resource will return all the existing conversations
 * Only admin has access
 */
conversations.route('/')
.get(authenticate.verifyUser, (req, res, next)=> {
    if(authenticate.verifyAdmin(req.user.admin)){
    Conversation.find({})
    .populate('participants.participant')
    .then((con) => {
        console.log(con);
        res.statusCode=200;
        res.setHeader('Content-Type', 'application/json');
        res.json((con));
    }, (err)=>next(err))
    .catch((err)=>next(err));
    }
    else{
        var err = new Error('You do not have privilege to access the conversation');
        err.status = 401;
        next(err);
    }
})
/**
 * Creating a new conversation
 * User who is part of that conversation (in the payload) can only create this
 */
.post(authenticate.verifyUser, (req, res, next) =>{
    var participantIds = req.body.participants;
    console.log(participantIds.length);
    var validUser = false;
    console.log(req.body.participants.length);  
    for(var i =0; i<participantIds.length; i++){
        if(JSON.stringify(participantIds[i].participant) === JSON.stringify(req.user._id)){
            validUser = true;
        }
        req.body.participants[i].participant= participantIds[i].participant; // setting the participant 
        console.log(req.body);
        console.log('Valid User '+validUser);
    }
    //req.body.participants.participant = participant;
    //console.log(req.body);
    if(validUser){
        var blank = Conversation.create
        Conversation.create(req.body)
        .then((con)=>{
            console.log('Conversation Created');
            res.statusCode=200;
            res.setHeader('Content-Type', 'application/json');
            res.json((con));
        }, (err)=>next(err))
        .catch((err)=>next(err));
    }
    else{
        var err = new Error('You are not authorized');
        err.status = 401;
        next(err);
    }
    
});

// Get conversations for conversationId, currently commenting the authentication part 
conversations.route('/:conversationId')
// .get(authenticate.verifyUser, (req, res, next)=> {
//     console.log('fadfafafa');
//     if(authenticate.verifyAdmin(req.user.admin)){
//         Conversation.findById(req.params.conversationId)
//         .populate('participants.participant')
//         .then((con) => {
//             res.statusCode=200;
//             res.setHeader('Content-Type', 'application/json');
//             res.json((con));
//         }, (err)=>next(err))
//         .catch((err)=>next(err));
//         }
// });
.get((req, res, next)=> {
    console.log('fadfafafa');
 //   if(authenticate.verifyAdmin(req.user.admin)){
        Conversation.findById(req.params.conversationId)
        .populate('participants.participant')
        .then((con) => {
            res.statusCode=200;
            res.setHeader('Content-Type', 'application/json');
            res.json((con));
        }, (err)=>next(err))
        .catch((err)=>next(err));
 //       }
});

// Get all conversations for a user
conversations.route('/findConversationForUser/:userId')
.get((req, res, next) => {
    Conversation.find({ "participants": { $elemMatch: { "participant": ObjectId(req.params.userId)} } })
    .populate('participants.participant')
    .then((con) => {
        res.statusCode=200;
        res.setHeader('Content-Type', 'application/json');
        res.json((con));
    }, (err)=>next(err))
    .catch((err)=>next(err));
});

// Get all conversations for two user
conversations.route('/findConversationForUsers')
.post(authenticate.verifyUser, (req, res, next) =>{
    var participantIds = req.body.participants;
    console.log(participantIds.length);
    var validUser = false;
    var userIdArray = [];
    console.log(req.body.participants.length);  
    for(var i =0; i<participantIds.length; i++){
        if(JSON.stringify(participantIds[i].participant) === JSON.stringify(req.user._id)){
            validUser = true;
        }
        userIdArray.push(participantIds[i].participant);
        console.log(JSON.stringify(userIdArray[i]));
        console.log('Valid User '+validUser);
    }
    //req.body.participants.participant = participant;
    //console.log(req.body);
    if(validUser){
        Conversation.find({
            $and: [
                 { "participants": { $elemMatch: { "participant": ObjectId(userIdArray[0])} } },
                 { "participants": { $elemMatch: { "participant": ObjectId(userIdArray[1])} } }
            ]
        })
        .populate('participants.participant')
        .then((con) => {
            res.statusCode=200;
            res.setHeader('Content-Type', 'application/json');
            res.json((con));
        }, (err)=>next(err))
        .catch((err)=>next(err));
    }
    else{
        var err = new Error('You are not authorized');
        err.status = 401;
        next(err);
    }
    
});

module.exports = conversations;