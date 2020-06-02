const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const ObjectId = require('mongodb').ObjectID;
const authenticate = require('../authenticate');

const Message = require('../models/message');

const messages = express.Router();
messages.use(bodyParser.json());


messages.route('/')
.get(authenticate.verifyUser, (req, res, next)=> {
    res.statusCode=200;
    res.setHeader('Content-Type', 'application/json');
});

messages.route('/findMessagesForConversation/:conversationId')
.get((req, res, next) => {
    Message.find({ "conversationId": ObjectId(req.params.conversationId)})
    .populate('sender')
    .populate('conversationId')
    .populate('conversationId.participants.participant')
    .then((message) => {
        res.statusCode=200;
        res.setHeader('Content-Type', 'application/json');
        res.json((message));
    }, (err)=>next(err))
    .catch((err)=>next(err));
})
.post(authenticate.verifyUser, (req, res, next) => {
    req.body.conversationId = req.params.conversationId;
    Message.create(req.body)
        .then((message)=>{
            console.log('Message Created');
            res.statusCode=200;
            res.setHeader('Content-Type', 'application/json');
            res.json((message));
        }, (err)=>next(err))
        .catch((err)=>next(err));
});


module.exports = messages;