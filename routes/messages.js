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

    var userSocketMap = new Map(); // store userId and  socketId so that server can send messages easily.
    var socketUserMap = new Map(); // store socketId and  userId ti beused to clear the user from userSocketMap in case of disconnection.
    // connect to socket and listen to client actions
    io.on('connection', function(socket) {
        console.log('a user is connected');
        console.log(socket.id);
        // If the user has logged in and clientgets connected again(i.e. new socket) then we will update socketId for that user in socketMap
        socket.on('connected', (data) => {
            console.log('connection data');
            console.log(data);
            // if(data.from){
            //     socketMap.set(data.userId, socket.id)
            // }
            // console.log(socketMap);
        });
        // If the user disconnects then we will remove the user and socket from maps.
        socket.on('disconnect', function () {
            console.log('Disconnected ' + socket.id);
            var userToClean = socketUserMap.get(socket.id);
            userSocketMap.delete(userToClean);
            socketUserMap.delete(socket.id);
            console.log(userSocketMap);
            console.log(socketUserMap);
        });

        //User logs in the client, client passes the socket info and store that in the map
        socket.on('login', (data) => {
            console.log('login');
            console.log(data);
            if(data.userId){
                userSocketMap.set(data.userId, socket.id)
                socketUserMap.set(socket.id, data.userId);
            }
            console.log(userSocketMap);
            console.log(socketUserMap);
        });
        //User send a message, msg gets broadcasted to the receiver
        socket.on('chat_direct', (data) => {
            console.log(data);
            console.log('message');
            console.log(userSocketMap.get(data.toId));
            //socket.broadcast.to(socketMap.get(data.to)).emit('chat_direct', data);
            //socket.broadcast.to(socketMap.get(data.from)).emit('chat_direct', data);
            if(userSocketMap.get(data.toId)){
                io.sockets.in(userSocketMap.get(data.toId)).emit('chat_direct', data);
                io.sockets.in(userSocketMap.get(data.toId)).emit('chat_indirect', data);
                //io.sockets.in(socketMap.get(data.from)).emit('chat_direct', data);
                //io.sockets.emit('chat_direct', data);
            }
            else{ // save the messages received to server db and send it back when the receiver is online
                console.log('Saving offline data');
                console.log(JSON.stringify(data));
                Message.create(data) // creating the message
                .then((message)=>{
                    Message.findById(message._id)
                    .then((mess) => {
                        console.log('Message Created');
                    })
                    
                });
            }
            
        });
    });
    

    // var socketMap = new Map(); // store userId and  socketId so that server can send messages easily.
    // // connect to socket and listen to client actions
    // io.on('connection', function(socket) {
    //     console.log('a user is connected');
    //     console.log(socket.id);
    //     // If the user has logged in and clientgets connected again(i.e. new socket) then we will update socketId for that user in socketMap
    //     // socket.on('connected', (data) => {
    //     //     console.log('connection data');
    //     //     console.log(data);
    //     //     if(data.from){
    //     //         socketMap.set(data.from, data.socketId)
    //     //     }
    //     //     console.log(socketMap);
    //     // });
    //     // User logs in the client, client passes the socket info and store that in the map
    //     // socket.on('login', (data) => {
    //     //     console.log('login');
    //     //     console.log(data);
    //     //     if(data.from){
    //     //         socketMap.set(data.from, data.socketId)
    //     //     }
    //     //     console.log(socketMap);
    //     // });
    //     //User send a message, msg gets broadcasted to the receiver
    //     socket.on('chat_direct', (data) => {
    //         console.log(data);
    //         console.log('message');
    //         io.sockets.emit('chat_direct', data.message);
    //         //socket.io.emit('chat_direct', 'Message recieved');
    //         console.log('message sent');
    //     });
    // });
    

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
        Message.find({ "toId": req.params.userId }).sort({"createdAt":-1})
        .then((message) => {
            res.statusCode=200;
            res.setHeader('Content-Type', 'application/json');
            res.json((message));
        }, (err)=>next(err))
        .catch((err)=>next(err));
    })
    .delete(authenticate.verifyUser, (req , res, next) => {
        Message.remove({"toId": req.params.userId})
        .then((resp)=>{
            res.statusCode=200;
            res.setHeader('Content-Type', 'application/json');
            res.json((resp));
        }, (err)=>next(err))
        .catch((err)=>next(err));
    });


    return messages;
}