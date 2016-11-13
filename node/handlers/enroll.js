'use strict';

require('./include/api')

const EnrollContextEnum = {,
    DEFAULT
    GET_CLASS_NAME,
}

var context = DEFAULT;
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
                        sendTextMessage(senderID, 'Class not found. Adding into database..');
                        connection.query('INSERT INTO classes SET ?', {name: messageText},
                        function(err, result) {
                            if (err) console.log(err.code);
                            console.log(result.insertCode);
                        });
                        sendTextMessage(senderID, 'class = ' + messageText);
                    }
                })
                break;
            default:

        }
    }

    receivedPostback : function(event) {
        var senderID = event.sender.id;
        var recipientID = event.recipient.id;
        var timeOfPostback = event.timestamp;
        var payload = event.postback.payload;

        switch (payload) {
            case 'ENROLL_CLASS':
                context = EnrollContextEnum.GET_CLASS_NAME;
                sendTextMessage(senderID, 'Hi, which class do you want to enroll?');
                break;
            case 'DROP_CLASS':

            default:

        }
    }
}
