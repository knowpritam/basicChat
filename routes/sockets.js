module.exports = function(io) {
    const express = require('express');
    var sockets = express.Router();
    const Message = require('../models/message');
    const Conversation = require('../models/conversation');
    const Firebase = require('../firebase');

    var userSocketMap = new Map(); // store userId and  socketId so that server can send messages easily.
    var socketUserMap = new Map(); // store socketId and  userId ti beused to clear the user from userSocketMap in case of disconnection.
    var userNotifTokenMap = new Map(); 
    var userOnlineMap = new Map(); // store socketId and  userId ti beused to clear the user from userSocketMap in case of disconnection.
    var onlineConversationsMap = new Map();
    var userDeliveredMessageMap = new Map(); // store userId(from) and the delivered notif received as part of 'msg_delivered_bulk' if from user is offline. 
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
            console.log("userToClean");
            console.log(userToClean);
            notifyAboutOfflineOnlineUser(userToClean);
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
                userNotifTokenMap.set(data.userId, data.notifToken);
                userOnlineMap.set(data.userId, "online");
                notifyAboutOfflineOnlineUser(data.userId);
                console.log("userDeliveredMessageMap12login");
                if(userDeliveredMessageMap.get(data.userId)){
                    console.log("userDeliveredMessageMap1login");
                    console.log(userDeliveredMessageMap);
                    //setTimeout(notifyUserForAllDeliveredMesages(data.userId), 2000);
                    setTimeout(function () {
                        notifyUserForAllDeliveredMesages(data.userId);
                      }, 2000);
                }
            }
        });
        //User send a message, msg gets broadcasted to the receiver
        socket.on('chat_direct', (data) => {
            console.log('chat_direct');
            //console.log(data);
            
            //console.log(userSocketMap.get(data.toId));
            //socket.broadcast.to(socketMap.get(data.to)).emit('chat_direct', data);
            //socket.broadcast.to(socketMap.get(data.from)).emit('chat_direct', data);
            if(userSocketMap.get(data.toId)){
                io.sockets.in(userSocketMap.get(data.toId)).emit('chat_direct', data);
                io.sockets.in(userSocketMap.get(data.toId)).emit('chat_indirect', data);
                io.sockets.in(userSocketMap.get(data.fromId)).emit('msg_delivered', data);
                //io.sockets.emit('chat_direct', data);
            }
            else{ // save the messages received to server db and send it back when the receiver is online
                // console.log('Saving offline data');
                // console.log(JSON.stringify(data));
                Message.create(data) // creating the message
                .then((message)=>{
                    Message.findById(message._id)
                    .then((mess) => {
                        console.log('Message Created');
                    })
                    
                });
            }
            console.log(userNotifTokenMap);
            console.log(data.toId);
            if(userNotifTokenMap.get(data.toId))
                Firebase.postNotif(userNotifTokenMap.get(data.toId), data.fromName, data.messageText);
            console.log('chat_direct    end');
        });
        socket.on('chat_direct_old', (data) => {
            console.log('chat_direct_old');
            getMessageFromUserForUser(data);
            console.log('chat_direct_old    end');
        });

        socket.on('user_online_status', (data) => {
             var usersSet;
            // console.log("onlineConversationsMapSet");
            //     console.log(onlineConversationsMap);
            if(onlineConversationsMap.get(data.toId)){
                usersSet = onlineConversationsMap.get(data.toId);
            }
            else{
                usersSet = new Set();
            }
            usersSet.add(data.fromId);
            onlineConversationsMap.set(data.toId, usersSet);
            // console.log("onlineConversationsMapSet");
            // console.log(onlineConversationsMap);
            // console.log("userOnlineMap");
            // console.log(userOnlineMap);
            // console.log("data.fromId");
            // console.log(data.fromId);
            if(userSocketMap.get(data.fromId)){
                io.sockets.in(userSocketMap.get(data.fromId)).emit('user_online_status', userOnlineMap.get(data.toId));
            }
        });

        socket.on('user_in_conversation_status_clear', (data) => {
            var usersSet;
            if(onlineConversationsMap.get(data.toId)){
                usersSet = onlineConversationsMap.get(data.toId).delete(data.fromId);
                // console.log("usersSet");
                // console.log(usersSet);
            }
        });

        socket.on('msg_delivered_bulk', (data) => {
            console.log("msg_delivered_bulk");
            console.log(data);
            console.log(userSocketMap);
            if(userSocketMap.get(data.fromId)){
                io.sockets.in(userSocketMap.get(data.fromId)).emit('msg_delivered_bulk', {"fromId":data.fromId, "toId":data.toId});
            }
            else{
                manageUserDeliveredMessageMap(data);
                console.log("userDeliveredMessageMap1");
                console.log(userDeliveredMessageMap);
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
                io.sockets.in(userSocketMap.get(data.fromId)).emit('msg_recieved', "true");
            }
            //result = messages;
            Message.remove({"toId": data.toId ,"fromId" : data.fromId}).then(() =>{
                console.log('Message deleted');
            }, (err)=>next(err))
            .catch((err)=>next(err));
        }, (err)=>next(err))
        .catch((err)=>next(err));
        
    };

    function notifyAboutOfflineOnlineUser(toUser){
        var usersSet;
        console.log('to user');
        console.log(toUser);
        if(onlineConversationsMap.get(toUser)){
            usersSet = onlineConversationsMap.get(toUser);
            console.log("userSet");
            console.log(usersSet);
            usersSet.forEach(user => {
                console.log("insideLoop");
                console.log(user);
                io.sockets.in(userSocketMap.get(user)).emit('user_online_status', userOnlineMap.get(toUser));
            });
        }
    };

    function manageUserDeliveredMessageMap(data){
        var usersSet;
        if(userDeliveredMessageMap.get(data.fromId)){
            usersSet = userDeliveredMessageMap.get(data.toId);
        }
        else{
            usersSet = new Set();
        }
        usersSet.add(data.toId);
        userDeliveredMessageMap.set(data.fromId, usersSet);
    }

    function notifyUserForAllDeliveredMesages(fromUser){
        var usersSet;
        console.log('userDeliveredMessageMap');
        console.log(userDeliveredMessageMap);
        if(userDeliveredMessageMap.get(fromUser)){
            usersSet = userDeliveredMessageMap.get(fromUser);
            console.log("userSet");
            console.log(usersSet);
            usersSet.forEach(user => {
                console.log("insideLoop1");
                console.log(user);
                console.log(fromUser);
                console.log(userSocketMap);
                io.sockets.in(userSocketMap.get(fromUser)).emit('msg_delivered_bulk', {"fromId":fromUser, "toId":user});
            });
            userDeliveredMessageMap.delete(fromUser);
            console.log('userDeliveredMessageMap');
            console.log(userDeliveredMessageMap);
        }
    }

    return sockets;
}