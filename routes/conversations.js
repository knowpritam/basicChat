const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const ObjectId = require('mongodb').ObjectID;
const authenticate = require('../authenticate');

const Conversation = require('../models/conversation');

const conversations = express.Router();
conversations.use(bodyParser.json());

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
.post(authenticate.verifyUser, (req, res, next) =>{
    
    var participantIds = req.body.participants;
    console.log(participantIds.length);
    var validUser = false;
    console.log(req.body.participants.length);  
    var participant = [];
    for(var i =0; i<participantIds.length; i++){
        console.log(JSON.stringify(participantIds[i].participant));
        console.log(JSON.stringify(req.user._id));
        if(JSON.stringify(participantIds[i].participant) === JSON.stringify(req.user._id)){
            validUser = true;
        }
        //participant.push(participantIds[i]._id);
        req.body.participants[i].participant= participantIds[i].participant;
        
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

conversations.route('/:conversationId')
.get(authenticate.verifyUser, (req, res, next)=> {
    console.log('fadfafafa');
    if(authenticate.verifyAdmin(req.user.admin)){
        Conversation.findById(req.params.conversationId)
        .populate('participants.participant')
        .then((con) => {
            res.statusCode=200;
            res.setHeader('Content-Type', 'application/json');
            res.json((con));
        }, (err)=>next(err))
        .catch((err)=>next(err));
        }
});



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

module.exports = conversations;