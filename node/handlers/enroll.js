'use strict';

const api = require('../include/api'),
      config = require('config'),
      mysql = require('mysql'),
      global = require('../include/global');

const EnrollContextEnum = {
    DEFAULT         :   0,
    GET_CLASS_NAME  :   1,
    CONFIRM_ADD     :   2
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

        if (isEcho) {
            // Do nothing
            return;   // FUCK YOU MUST RETURN HERE
        } else if (quickReply) {
            switch (context) {
                case EnrollContextEnum.CONFIRM_ADD:
                    if (messageText == 'Sure') {
                        connection.query('INSERT INTO classes SET ?', {name: quickReply.payload},
                        function(err, result) {
                            if (err) {
                                api.sendTextMessage(senderID, global.ErrorEnum.DBERROR);
                            } else {
                                api.sendTextMessage(senderID, quickReply.payload +
                                    ' now added to database. Thanks for helping us make our service better!');
                                connection.query('INSERT INTO user_class SET ?', {uid: senderID, cid: result.insertId},
                                function(err, result) {
                                    if (err) {
                                        api.sendTextMessage(senderID, global.ErrorEnum.DBERROR);
                                    } else {
                                        api.sendTextMessage(senderID, 'Your class list now: ');
                                        api.sendDuesList(senderID);
                                    }
                                })
                            }
                        });

                    }
                    break;
                default:

            }
        }
        switch (context) {
            case EnrollContextEnum.GET_CLASS_NAME:
                connection.query('SELECT * FROM classes WHERE ?', {name: messageText},
                function(err, rows, fields) {
                    if (err) console.log("ERROROROROR");
                    if (rows.length != 0) {
                        console.log("sdfsdf");
                        connection.query('INSERT INTO user_class SET ?', {uid: senderID, cid: rows[0].id})
                    } else {
                        console.log("aaa");
                        context = EnrollContextEnum.CONFIRM_ADD;
                        var qst = 'Hmm. It seems this class is not in our database. Would you\
                        like it added to our database so that other users would be able to access it? '
                        + '(We would also add it to your class list!)';
                        api.sendQuickReply(senderID, qst, 'Sure', messageText, "No it's my typo :)", '');
                    }
                })
                break;
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
                console.log('====');
                console.log(senderID);
                console.log(senderID);
                console.log('====');
                api.sendTextMessage(senderID, 'Hi, which class do you want to enroll?');
                break;

            default:

        }
    }
}
