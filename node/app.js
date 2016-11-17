'use strict';


const
    bodyParser = require('body-parser'),
    config = require('config'),
    crypto = require('crypto'),
    express = require('express'),
    https = require('https'),
    mysql = require('mysql'),
    api = require('./include/api'),
    global = require('./include/global'),
    request = require('request');

var app = express();
app.set('port', process.env.PORT || 5000);
app.set('view engine', 'ejs');
app.use(bodyParser.json({
    verify: verifyRequestSignature
}));
app.use(express.static('public'));


// Credentials
const
    APP_SECRET = config.get('appSecret'),
    VALIDATION_TOKEN = config.get('validationToken'),
    PAGE_ACCESS_TOKEN = config.get('pageAccessToken'),
    SERVER_URL = config.get('serverURL'),
    API_URL = config.get('apiURL'),
    DB_HOST = config.get('dbHost'),
    DB_USER = config.get('dbUser'),
    DB_PW = config.get('dbPassword'),
    DB_NAME = config.get('dbName');

var connection = mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PW,
    database: DB_NAME
});


const ContextEnum = {
    DEFAULT: 0,
    ADD_CLASS: 1,
    ADD_DUE: 2
}

var context = ContextEnum.DEFAULT;

app.get('/webhook', function(req, res) {
    if (req.query['hub.mode'] === 'subscribe' &&
        req.query['hub.verify_token'] === VALIDATION_TOKEN) {
        console.log("Validating webhook");
        res.status(200).send(req.query['hub.challenge']);
    }
    else {
        console.error("Failed validation. Make sure the validation tokens match.");
        res.sendStatus(403);
    }
});



app.post('/webhook', function(req, res) {
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
                }
                else if (messagingEvent.message) {
                    receivedMessage(messagingEvent);
                }
                else if (messagingEvent.delivery) {
                    receivedDeliveryConfirmation(messagingEvent);
                }
                else if (messagingEvent.postback) {
                    receivedPostback(messagingEvent);
                }
                else if (messagingEvent.read) {
                    receivedMessageRead(messagingEvent);
                }
                else if (messagingEvent.account_linking) {
                    receivedAccountLink(messagingEvent);
                }
                else {
                    console.log("Webhook received unknown messagingEvent: ", messagingEvent);
                }
            });
        });

        res.sendStatus(200);
    }
});


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


function verifyRequestSignature(req, res, buf) {
    var signature = req.headers["x-hub-signature"];

    if (!signature) {
        // For testing, let's log an error. In production, you should throw an
        // error.
        console.error("Couldn't validate the signature.");
    }
    else {
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


function receivedAuthentication(event) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var timeOfAuth = event.timestamp;
    var passThroughParam = event.optin.ref;

    console.log("Received authentication for user %d and page %d with pass " +
        "through param '%s' at %d", senderID, recipientID, passThroughParam,
        timeOfAuth);


    api.sendTextMessageWithMenu(senderID, "Authentication successful");
}


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
    }
    else if (quickReply) {
        var quickReplyPayload = quickReply.payload;
        if (context == ContextEnum.ADD_CLASS) {
            if (messageText == 'Sure') {
                connection.query('INSERT INTO classes SET ?', {name: quickReplyPayload},
                function(err, result) {
                    context = ContextEnum.DEFAULT;
                    if (err) {
                        api.sendTextMessageWithMenu(senderID, global.ErrorEnum.DBERROR, 'MAIN');
                    } else {
                        api.sendTextMessageWithMenu(senderID, quickReply.payload +
                            ' now added to database. Thanks for helping us make our service better!');
                        connection.query('INSERT INTO user_class SET ?', {uid: senderID, cid: result.insertId},
                        function(err, result) {
                            if (err) {
                                api.sendTextMessageWithMenu(senderID, global.ErrorEnum.DBERROR);
                            } else {
                                api.sendTextMessageWithMenu(senderID, 'Your class list now: ', 'MAIN');
                                api.sendUserClasses(senderID);
                            }
                        })
                    }
                });
            } else if (quickReplyPayload == 'CANCEL') {
                context = ContextEnum.DEFAULT;
                api.sendTextMessageWithMenu(senderID, 'What else can I help you with?', 'MAIN');
            } else if (quickReplyPayload == 'REDO'){
                api.sendTextMessageWithMenu(senderID, '🙂', 'CANCEL');
            }

        }
        if (quickReplyPayload == 'FETCH_USER_CLASSES') {
            api.sendUserClasses(senderID);
        }
        if (quickReplyPayload == 'FETCH_USER_DUES') {
            api.sendUserDues(senderID);
        }
        return;
    }

    if (messageText) {
        switch (context) {
            case ContextEnum.DEFAULT:
                if (messageText == 'options') {
                    api.sendTextMessageWithMenu(senderID, 'Here is what I can do now: ', 'MAIN');
                } else {
                    // api.sendTextMessageWithMenu(senderID, 'Send `options` to see what you can do 😊');
                    api.sendTextReplyWithWatson(senderID, messageText, watsonReplyHandler);
                }
                break;
            case ContextEnum.ADD_CLASS:
                connection.query('SELECT * FROM classes WHERE ?', {name: messageText},
                function(err, rows, fields) {
                    if (rows.length != 0) {
                        if (err) error(senderID);
                        connection.query('INSERT INTO user_class SET ?', {uid: senderID, cid: rows[0].id}, function(err, rows, fields) {
                            context = ContextEnum.DEFAULT;
                            if (err) error(senderID);
                            api.sendTextMessageWithMenu(senderID, messageText + ' now added to your class list~😀 Your class list now: ', 'MAIN');
                            api.sendUserClasses(senderID);
                        });
                    } else {
                        var qst = 'Hmm. It seems this class is not in our database. Would you'
                        + 'like it added to our database so that other users would be able to access it? '
                        + '(We would also add it to your class list!)';
                        var qr = [
                            {
                                content_type: 'text',
                                title: 'Sure',
                                payload: messageText
                            },
                            {
                                content_type: 'text',
                                title: "No it's my typo :)",
                                payload: 'REDO'
                            }
                        ];
                        api.sendQuickReply(senderID, qst, qr);
                    }
                })
                break;
            default:

        }
    }
    else if (messageAttachments) {
        api.sendTextMessageWithMenu(senderID, "Message with attachment received");
    }
}


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



function receivedPostback(event) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var timeOfPostback = event.timestamp;

    // The 'payload' param is a developer-defined field which is set in a postback
    // button for Structured Messages.
    var payload = event.postback.payload;

    // Parse payload corespondingly
    switch (payload) {
        case 'ADD_CLASS':
            context = ContextEnum.ADD_CLASS;
            api.sendTextMessageWithMenu(senderID, 'Enter the class code you want to add ☺️ (e.g. COMPSCI61A)', 'CANCEL');
            break;
        case 'GET_STARTED':
            connection.query('INSERT INTO users SET ?', {
                    id: senderID
                },
                function(err, result) {
                    if (err) console.log(err.code);
                });
            request({
                uri: API_URL + senderID,
                method: 'GET',
                qs: {
                    access_token: PAGE_ACCESS_TOKEN
                }
            }, function(error, response, body) {
                if (error) {
                    console.log(error);
                }
                else {
                    var firstName = JSON.parse(body).first_name;
                    api.sendTextMessageWithMenu(senderID, 'Hi ' + firstName + ', how can I help you today?', 'MAIN');
                }
            });
            break;
        default:
            break;
    }

}

// function showMainContextualMenu(senderID) {
//     api.sendQuickReply(senderID, "What else can I help you with?", 'My classes', 'FETCH_USER_CLASSES', 'My dues', 'FETCH_USER_DUES');
// }

function error(senderID) {
    api.sendTextMessageWithMenu(senderID, global.ErrorEnum.DBERROR, 'MAIN');
}



function receivedMessageRead(event) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;

    // All messages before watermark (a timestamp) or sequence have been seen.
    var watermark = event.read.watermark;
    var sequenceNumber = event.read.seq;

    console.log("Received message read event for watermark %d and sequence " +
        "number %d", watermark, sequenceNumber);
}


function receivedAccountLink(event) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;

    var status = event.account_linking.status;
    var authCode = event.account_linking.authorization_code;

    console.log("Received account link event with for user %d with status %s " +
        "and auth code %s ", senderID, status, authCode);
}

function watsonReplyHandler(recipientID, replyMsg) {
    switch (replyMsg) {
        case 'ADD_CLASS':
            context = ContextEnum.ADD_CLASS;
            api.sendTextMessageWithMenu(recipientID, 'Enter the class code you want to add ☺️ (e.g. COMPSCI61A)', 'CANCEL');
            break;
        case 'FETCH_USER_CLASSES':
            api.sendUserClasses(recipientID);
            break;
        case 'DROP_CLASS':
            break;
        case 'FETCH_USER_DUES':
            break;
        default:
            api.sendTextMessageWithMenu(recipientID, replyMsg);
            break;
    }
}



// Start server
// Webhooks must be available via SSL with a certificate signed by a valid
// certificate authority.
app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});



module.exports = app;
