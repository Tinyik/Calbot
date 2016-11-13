'use strict';

require('../include/api');

const enroll = require('./enroll');

const ManageContextEnum = {
    DEFAULT         :   0,
    ADD_ASS         :   1,
    ENROLL_CLASS    :   2,
    DROP_CLASS      :   3
}

var context = ManageContextEnum.DEFAULT;
module.exports = {
    receivedMessage : function(event) {
        switch (context) {
            case ManageContextEnum.ENROLL_CLASS:
                enroll.receivedMessage(event);
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
                context = ManageContextEnum.ENROLL_CLASS;
                enroll.receivedPostback(event);
                break;
            case 'DROP_CLASS':

            default:

        }
    }
}
