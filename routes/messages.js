module.exports = function(io) {

    const express = require('express');
    const bodyParser = require('body-parser');
    const mongoose = require('mongoose');
    const ObjectId = require('mongodb').ObjectID;
    const authenticate = require('../authenticate');

    const cors = require('./cors');

    const Message = require('../models/message');

    var messages = express.Router();
    messages.use(bodyParser.json());
    

    messages.route('/')
    .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
    .get(cors.cors, (req, res, next)=> {
        res.statusCode=200;
        res.setHeader('Content-Type', 'application/json');
        res.json("{'result':'faddf'}");
    });

    // GET on findMessagesForConversation with conversationId will return all the messages for that particulat conversation.
    // No authentication required so far
    messages.route('/findMessagesForConversation/:conversationId')
    .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
    .get(cors.cors, (req, res, next) => {
        Message.find({ "chatId": ObjectId(req.params.conversationId)})
        .then((message) => {
            //console.log(message);
            res.statusCode=200;
            res.setHeader('Content-Type', 'application/json');
            res.json((message));
        }, (err)=>next(err))
        .catch((err)=>next(err));
    })

    // POST on findMessagesForConversation with conversationId will return all the messages for that particulat conversation.
    /** Payload is something like 
     * {
        "sender": "5ed7cd51e90f29113438e6bd",
        "content": "Hello"
    }
     */
    .post(authenticate.verifyUser, (req, res, next) => {
        req.body.chat = req.params.chat;
        Message.create(req.body) // creating the message
        .then((message)=>{
            Message.findById(messageText._id) // getting the message again so that we can populate the sender info to be shown on the UI
            .populate('sender')
            .then((mess) => {
                console.log('Message Created');
                res.statusCode=200;
                io.broadcast.to('priv/John').emit('message', mess);
                //io.emit('message', mess); // emitting the message to socket so that the UI reads this and shows the message immediately
                res.setHeader('Content-Type', 'application/json');
                res.json((mess));
            })
            
        }, (err)=>next(err))
        .catch((err)=>next(err));
    });
      
    messages.route('/messagesForUser/:userId')
    .get(authenticate.verifyUser, (req, res, next) => {
        console.log('get messagesForUser');
        Message.find({ "toId": req.params.userId }).sort({"createdAt":-1})
        .then((message) => {
            console.log('delete messagesForUser');
            Message.remove({"toId": req.params.userId})
            .then((resp)=>{
                console.log('deleted messagesForUser');
            }, (err)=>next(err))
            .catch((err)=>next(err));
            res.statusCode=200;
            res.setHeader('Content-Type', 'application/json');
            res.json((message));
        }, (err)=>next(err))
        .catch((err)=>next(err));

        
    })
    .delete(authenticate.verifyUser, (req , res, next) => {
        console.log('delete messagesForUser');
        Message.remove({"toId": req.params.userId})
        .then((resp)=>{
            res.statusCode=200;
            res.setHeader('Content-Type', 'application/json');
            res.json((resp));
        }, (err)=>next(err))
        .catch((err)=>next(err));


        console.log('delete messagesForUser end');
    });


    return messages;
}