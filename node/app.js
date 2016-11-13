'use strict';

require('./include/global')

const
bodyParser = require('body-parser'),
config = require('config'),
cbmanage = require('./handlers/manage'),
crypto = require('crypto'),
express = require('express'),
https = require('https'),
mysql = require('mysql'),
api = require('./include/api'),
request = require('request');

var app = express();
app.set('port', process.env.PORT || 5000);
app.set('view engine', 'ejs');
app.use(bodyParser.json({ verify: verifyRequestSignature }));
app.use(express.static('public'));


// Credentials
const
APP_SECRET        =   config.get('appSecret'),
VALIDATION_TOKEN  =   config.get('validationToken'),
PAGE_ACCESS_TOKEN =   config.get('pageAccessToken'),
SERVER_URL        =   config.get('serverURL'),
API_URL           =   config.get('apiURL'),
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


const ContextEnum = {
    DEFAULT : 0,
    MANAGE  : 1,
    INFO    : 2,
    DUES    : 3
}

connection.connect(function(err) {
    if (err) console.log(ErrorEnum.DBERROR);
});

var context = ContextEnum.DEFAULT;
var className = '';
var assDate = '';
var assName = '';

app.get('/webhook', function(req, res) {
    if (req.query['hub.mode'] === 'subscribe' &&
    req.query['hub.verify_token'] === VALIDATION_TOKEN) {
        console.log("Validating webhook");
        res.status(200).send(req.query['hub.challenge']);
    } else {
        console.error("Failed validation. Make sure the validation tokens match.");
        res.sendStatus(403);
    }
});


/*
* All callbacks for Messenger are POST-ed. They will be sent to the same
* webhook. Be sure to subscribe your app to your page to receive callbacks
* for your page.
* https://developers.facebook.com/docs/messenger-platform/product-overview/setup#subscribe_app
*
*/
app.post('/webhook', function (req, res) {
    var data = req.body;

    // Make sure this is a page subscription
    if (data.object == 'page') {
        // Iterate over each entry
        // There may be multiple if batched
        data.entry.forEach(function(pageEntry) {
            var pageID = pageEntry.id;
            var timeOfEvent = pageEntry.time;

            // Iterate over each messaging event
            pageEntry.messaging.forEach(function(messagingEvent) {
                if (messagingEvent.optin) {
                    receivedAuthentication(messagingEvent);
                } else if (messagingEvent.message) {
                    switch (context) {
                        case ContextEnum.DEFAULT:
                            receivedMessage(messagingEvent);
                            break;
                        case ContextEnum.MANAGE:
                            cbmanage.receivedMessage(messagingEvent);
                            break;
                        default:
                            break;
                    }
                } else if (messagingEvent.delivery) {
                    receivedDeliveryConfirmation(messagingEvent);
                } else if (messagingEvent.postback) {
                    switch (context) {
                        case ContextEnum.DEFAULT:
                            receivedPostback(messagingEvent);
                            break;
                        case ContextEnum.MANAGE:
                            cbmanage.receivedPostback(messagingEvent);;
                            break;
                        default:
                            break;
                    }
                } else if (messagingEvent.read) {
                    receivedMessageRead(messagingEvent);
                } else if (messagingEvent.account_linking) {
                    receivedAccountLink(messagingEvent);
                } else {
                    console.log("Webhook received unknown messagingEvent: ", messagingEvent);
                }
            });
        });

        // Assume all went well.
        //
        // You must send back a 200, within 20 seconds, to let us know you've
        // successfully received the callback. Otherwise, the request will time out.
        res.sendStatus(200);
    }
});

/*
* This path is used for account linking. The account linking call-to-action
* (sendAccountLinking) is pointed to this URL.
*
*/
app.get('/authorize', function(req, res) {
    var accountLinkingToken = req.query.account_linking_token;
    var redirectURI = req.query.redirect_uri;

    // Authorization Code should be generated per user by the developer. This will
    // be passed to the Account Linking callback.
    var authCode = "1234567890";

    // Redirect users to this URI on successful login
    var redirectURISuccess = redirectURI + "&authorization_code=" + authCode;

    res.render('authorize', {
        accountLinkingToken: accountLinkingToken,
        redirectURI: redirectURI,
        redirectURISuccess: redirectURISuccess
    });
});

/*
* Verify that the callback came from Facebook. Using the App Secret from
* the App Dashboard, we can verify the signature that is sent with each
* callback in the x-hub-signature field, located in the header.
*
* https://developers.facebook.com/docs/graph-api/webhooks#setup
*
*/
function verifyRequestSignature(req, res, buf) {
    var signature = req.headers["x-hub-signature"];

    if (!signature) {
        // For testing, let's log an error. In production, you should throw an
        // error.
        console.error("Couldn't validate the signature.");
    } else {
        var elements = signature.split('=');
        var method = elements[0];
        var signatureHash = elements[1];

        var expectedHash = crypto.createHmac('sha1', APP_SECRET)
        .update(buf)
        .digest('hex');

        if (signatureHash != expectedHash) {
            throw new Error("Couldn't validate the request signature.");
        }
    }
}

/*
* Authorization Event
*
* The value for 'optin.ref' is defined in the entry point. For the "Send to
* Messenger" plugin, it is the 'data-ref' field. Read more at
* https://developers.facebook.com/docs/messenger-platform/webhook-reference/authentication
*
*/
function receivedAuthentication(event) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var timeOfAuth = event.timestamp;

    // The 'ref' field is set in the 'Send to Messenger' plugin, in the 'data-ref'
    // The developer can set this to an arbitrary value to associate the
    // authentication callback with the 'Send to Messenger' click event. This is
    // a way to do account linking when the user clicks the 'Send to Messenger'
    // plugin.
    var passThroughParam = event.optin.ref;

    console.log("Received authentication for user %d and page %d with pass " +
    "through param '%s' at %d", senderID, recipientID, passThroughParam,
    timeOfAuth);

    // When an authentication is received, we'll send a message back to the sender
    // to let them know it was successful.
    api.sendTextMessage(senderID, "Authentication successful");
}

/*
* Message Event
*
* This event is called when a message is sent to your page. The 'message'
* object format can vary depending on the kind of message that was received.
* Read more at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-received
*
* For this example, we're going to echo any text that we get. If we get some
* special keywords ('button', 'generic', 'receipt'), then we'll send back
* examples of those bubbles to illustrate the special message bubbles we've
* created. If we receive a message with an attachment (image, video, audio),
* then we'll simply confirm that we've received the attachment.
*
*/
function receivedMessage(event) {
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

    if (isEcho) {
        console.log(messageText);
        return;
    } else if (quickReply) {
        var quickReplyPayload = quickReply.payload;
        console.log("Quick reply for message %s with payload %s",
        messageId, quickReplyPayload);

        api.sendTextMessage(senderID, "Quick reply tapped");
        return;
    }

    if (messageText) {
        // If we receive a text message, check to see if it matches any special
        // keywords and send back the corresponding example. Otherwise, just echo
        // the text we received.
        api.sendTextMessage(senderID, messageText);
    } else if (messageAttachments) {
        api.sendTextMessage(senderID, "Message with attachment received");
    }
}



/*
* Delivery Confirmation Event
*
* This event is sent to confirm the delivery of a message. Read more about
* these fields at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-delivered
*
*/
function receivedDeliveryConfirmation(event) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var delivery = event.delivery;
    var messageIDs = delivery.mids;
    var watermark = delivery.watermark;
    var sequenceNumber = delivery.seq;

    if (messageIDs) {
        messageIDs.forEach(function(messageID) {
            console.log("Received delivery confirmation for message ID: %s",
            messageID);
        });
    }

    console.log("All message before %d were delivered.", watermark);
}


/*
* Postback Event
*
* This event is called when a postback is tapped on a Structured Message.
* https://developers.facebook.com/docs/messenger-platform/webhook-reference/postback-received
*
*/
function receivedPostback(event) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var timeOfPostback = event.timestamp;

    // The 'payload' param is a developer-defined field which is set in a postback
    // button for Structured Messages.
    var payload = event.postback.payload;

    // Parse payload corespondingly
    switch (payload) {
        case 'DUES':
        sendDuesList(senderID);
        break;
        case 'DROP_CLASS':
        inputMode = 'DROP_CLASS_GET_CLASS_NAME';
        api.sendTextMessage(senderID, 'class name?');
        break;
        case 'ADD_ASS':
        inputMode = 'ADD_ASS_GET_CLASS';
        api.sendTextMessage(senderID, 'class name?');
        break;
        case 'MANAGE':
        context = ContextEnum.MANAGE;
        api.sendManageMenu(senderID);
        break;
        case 'ENROLL_CLASS':
        inputMode = 'ENROLL_CLASS_GET_CLASS_NAME';
        api.sendTextMessage(senderID, 'class name?');
        break;
        case 'INFO':
        sendInfoMenu(senderID);
        break;
        case 'CLASS_INFO':
        sendClassInfoMenu(senderID);
        break;
        case 'MY_PERSONAL_INFO':
        sendMyPersonalInfoMenu(senderID);
        break;
        case 'GET_STARTED':
        connection.query('INSERT INTO users SET ?', {id: senderID},
        function(err, result) {
            if (err) console.log(err.code);
        });
        request({
            uri: API_URL + senderID,
            method: 'GET',
            qs: {
                access_token: PAGE_ACCESS_TOKEN
            }
        }, function(error, response, body){
            if(error) {
                console.log(error);
            } else {
                var firstName = JSON.parse(body).first_name;
                api.sendTextMessage(senderID, 'Hi ' + firstName + ', how can I help you today?');
            }
        });
        break;
        default:
        // code
    }

}


/*
* Message Read Event
*
* This event is called when a previously-sent message has been read.
* https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-read
*
*/
function receivedMessageRead(event) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;

    // All messages before watermark (a timestamp) or sequence have been seen.
    var watermark = event.read.watermark;
    var sequenceNumber = event.read.seq;

    console.log("Received message read event for watermark %d and sequence " +
    "number %d", watermark, sequenceNumber);
}

/*
* Account Link Event
*
* This event is called when the Link Account or UnLink Account action has been
* tapped.
* https://developers.facebook.com/docs/messenger-platform/webhook-reference/account-linking
*
*/
function receivedAccountLink(event) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;

    var status = event.account_linking.status;
    var authCode = event.account_linking.authorization_code;

    console.log("Received account link event with for user %d with status %s " +
    "and auth code %s ", senderID, status, authCode);
}



// Start server
// Webhooks must be available via SSL with a certificate signed by a valid
// certificate authority.
app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});



module.exports = app;
