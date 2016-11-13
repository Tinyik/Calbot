'use strict';

const api = require('../include/api'),
      config = require('config'),
      mysql = require('mysql');

const EnrollContextEnum = {
    DEFAULT         :   0,
    GET_CLASS_NAME  :   1
}

// Credentials
const
DB_HOST           =   config.get('dbHost'),
DB_USER           =   config.get('dbUser'),
DB_PW             =   config.get('dbPassword'),
DB_NAME           =   config.get('dbName');

var connection = mysql.createConnection({
    host        :   DB_HOST,
    user        :   DB_USER,
    password    :   DB_PW,
    database    :   DB_NAME
});

connection.connect(function(err) {
    if (err) console.log("ERROR");
});

var context = EnrollContextEnum.DEFAULT;
module.exports = {
    receivedMessage : function(event) {
        var senderID = event.sender.id;
        console.log(senderID);
        var recipientID = event.recipient.id;
        var timeOfMessage = event.timestamp;
        var message = event.message;


        var isEcho = message.is_echo;
        var messageId = message.mid;
        var appId = message.app_id;
        var metadata = message.metadata;

        // You may get a text or attachment but not both
        var messageText = message.text;
        var messageAttachments = message.attachments;
        var quickReply = message.quick_reply;

        switch (context) {
            case EnrollContextEnum.GET_CLASS_NAME:
                connection.query('SELECT * FROM classes WHERE ?', {name: messageText},
                function(err, rows, fields) {
                    if (err) console.log(err.code);
                    if (rows.length != 0) {
                        connection.query('INSERT INTO user_class SET ?', {uid: senderID, cid: rows[0].id})
                    } else {
                        api.sendTextMessage(senderID, 'Class not found. Adding into database..');
                        connection.query('INSERT INTO classes SET ?', {name: messageText},
                        function(err, result) {
                            if (err) console.log(err.code);
                            console.log(result.insertCode);
                        });
                        api.sendTextMessage(senderID, 'class = ' + messageText);
                    }
                })
                break;
            default:

        }
    },

    receivedPostback : function(event) {
        var senderID = event.sender.id;
        var recipientID = event.recipient.id;
        var timeOfPostback = event.timestamp;
        var payload = event.postback.payload;

        switch (payload) {
            case 'ENROLL_CLASS':
                context = EnrollContextEnum.GET_CLASS_NAME;
                api.sendTextMessage(senderID, 'Hi, which class do you want to enroll?');
                break;
            case 'DROP_CLASS':

            default:

        }
    }
}
