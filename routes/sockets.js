module.exports = function(io) {
    const express = require('express');
    var sockets = express.Router();
    const Message = require('../models/message');
    const Conversation = require('../models/conversation');

    var userSocketMap = new Map(); // store userId and  socketId so that server can send messages easily.
    var socketUserMap = new Map(); // store socketId and  userId ti beused to clear the user from userSocketMap in case of disconnection.
    var userOnlineMap = new Map(); // store socketId and  userId ti beused to clear the user from userSocketMap in case of disconnection.
    var onlineConversationsMap = new Map();
    // connect to socket and listen to client actions
    io.on('connection', function(socket) {
        console.log('a user is connected');
        console.log(socket.id);
        // If the user has logged in and clientgets connected again(i.e. new socket) then we will update socketId for that user in socketMap
        socket.on('connected', (data) => {
            console.log('connection data');
            console.log(data);
        });
        // If the user disconnects then we will remove the user and socket from maps.
        socket.on('disconnect', function () {
            console.log('Disconnected ' + socket.id);
            var userToClean = socketUserMap.get(socket.id);
            var datetime = new Date();
            userOnlineMap.set(userToClean, datetime);
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
                userOnlineMap.set(data.userId, "online");
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
        socket.on('chat_direct_old', (data) => {
            console.log('chat_direct_old');
            getMessageFromUserForUser(data);
        });

        socket.on('user_online_status', (data) => {
            var usersSet;
            if(onlineConversationsMap.get(data.toId)){
                usersSet = onlineConversationsMap.get(data.toId);
            }
            else{
                usersSet = new Set();
                usersSet.add(data.fromId);
                onlineConversationsMap.set(data.toId, usersSet);
                console.log("onlineConversationsMapSet");
                console.log(onlineConversationsMap);
            }
            if(userSocketMap.get(data.fromId)){
                io.sockets.in(userSocketMap.get(data.fromId)).emit('user_online_status', userOnlineMap.get(data.toId));
            }
        });
    });
    
    function getMessageFromUserForUser(data){
        //var result;
        console.log(data.toId);
        console.log(data.fromId);
        Message.find({ "toId": data.toId ,"fromId" : data.fromId}).sort({"createdAt":-1})
        .then((messages) => {
            console.log('message data');
            console.log(messages);
            if(userSocketMap.get(data.toId)){
                io.sockets.in(userSocketMap.get(data.toId)).emit('chat_direct_old', messages);
            }
            //result = messages;
            Message.remove({"toId": data.toId ,"fromId" : data.fromId}).then(() =>{
                console.log('Message deleted');
            }, (err)=>next(err))
            .catch((err)=>next(err));
        }, (err)=>next(err))
        .catch((err)=>next(err));
        
    };

    function notifyAboutOfflineUser(toUser){
        var usersSet;
        if(onlineConversationsMap.get(data.toId)){
            usersSet = onlineConversationsMap.get(data.toId);
            console.log("userSet");
            console.log(usersSet);
            usersSet.array.forEach(user => {
                io.sockets.in(user).emit('user_online_status', userOnlineMap.get(toUser));
            });
        }
    };

    return sockets;
}