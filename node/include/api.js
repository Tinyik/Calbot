'use strict'


const
    config = require('config'),
    request = require('request'),
    mysql = require('mysql');

const
    APP_SECRET = config.get('appSecret'),
    VALIDATION_TOKEN = config.get('validationToken'),
    PAGE_ACCESS_TOKEN = config.get('pageAccessToken'),
    SERVER_URL = config.get('serverURL'),
    API_URL = config.get('apiURL'),
    DB_HOST = config.get('dbHost'),
    DB_USER = config.get('dbUser'),
    DB_PW = config.get('dbPassword'),
    DB_NAME = config.get('dbName'),
    WS_PW = config.get('watsonPassword'),
    WS_USER = config.get('watsonUsername'),
    WSID = config.get('watsonWSID'),
    WS_API_URL = config.get('watsonapiURL');

var connection = mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PW,
    database: DB_NAME
});

connection.connect(function(err) {
    if (err) console.log(global.ErrorEnum.DBERROR);
});

module.exports = {
    /*
    * Send an image using the Send API.
    *
    */

    sendImageMessage: function(recipientId) {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                attachment: {
                    type: "image",
                    payload: {
                        url: SERVER_URL + "/assets/rift.png"
                    }
                }
            }
        };

        callSendAPI(messageData);
    },

    /*
    * Send a Gif using the Send API.
    *
    */
    sendGifMessage: function(recipientId) {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                attachment: {
                    type: "image",
                    payload: {
                        url: SERVER_URL + "/assets/instagram_logo.gif"
                    }
                }
            }
        };

        callSendAPI(messageData);
    },

    /*
    * Send audio using the Send API.
    *
    */
    sendAudioMessage: function(recipientId) {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                attachment: {
                    type: "audio",
                    payload: {
                        url: SERVER_URL + "/assets/sample.mp3"
                    }
                }
            }
        };

        callSendAPI(messageData);
    },

    /*
    * Send a video using the Send API.
    *
    */
    sendVideoMessage: function(recipientId) {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                attachment: {
                    type: "video",
                    payload: {
                        url: SERVER_URL + "/assets/allofus480.mov"
                    }
                }
            }
        };

        callSendAPI(messageData);
    },

    /*
    * Send a file using the Send API.
    *
    */
    sendFileMessage: function(recipientId) {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                attachment: {
                    type: "file",
                    payload: {
                        url: SERVER_URL + "/assets/test.txt"
                    }
                }
            }
        };

        callSendAPI(messageData);
    },

    /*
    * Send a text message using the Send API.
    *
    */
    sendTextMessageWithMenu: function(recipientId, messageText, menu) {

        if (menu) {
            switch (menu) {
                case 'MAIN':
                     var qr = [
                        {
                            content_type: 'text',
                            title: 'My classes',
                            payload: 'FETCH_USER_CLASSES'
                        },
                        {
                            content_type: 'text',
                            title: 'My dues',
                            payload: 'FETCH_USER_DUES'
                        }
                     ];
                     module.exports.sendQuickReply(recipientId, messageText, qr);
                     break;
                case 'CANCEL':
                    var qr = [
                        {
                            content_type: 'text',
                            title: 'Cancel',
                            payload: 'CANCEL'
                        }
                    ];
                    module.exports.sendQuickReply(recipientId, messageText, qr);
                    break;
            }
        } else {
            var messageData = {
                recipient: {
                    id: recipientId
                },
                message: {
                    text: messageText,
                    metadata: "DEVELOPER_DEFINED_METADATA"
                }
            };
            callSendAPI(messageData);
        }
    },

    /*
    * Send a button message using the Send API.
    *
    */
    sendButtonMessage: function(recipientId) {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                attachment: {
                    type: "template",
                    payload: {
                        template_type: "button",
                        text: "This is test text",
                        buttons:[{
                            type: "web_url",
                            url: "https://www.oculus.com/en-us/rift/",
                            title: "Open Web URL"
                        }, {
                            type: "postback",
                            title: "Trigger Postback",
                            payload: "DEVELOPED_DEFINED_PAYLOAD"
                        }, {
                            type: "phone_number",
                            title: "Call Phone Number",
                            payload: "+16505551234"
                        }]
                    }
                }
            }
        };

        callSendAPI(messageData);
    },

    /*
    * Send a Structured Message (Generic Message type) using the Send API.
    *
    */
    sendGenericMessage: function(recipientId) {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                attachment: {
                    type: "template",
                    payload: {
                        template_type: "generic",
                        elements: [{
                            title: "Cal Dining",
                            subtitle: "I love Crossroads",
                            item_url: "http://caldining.berkeley.edu/menus/all-locations-d1",
                            image_url: SERVER_URL + "/assets/junk-food.jpg",
                            buttons: [{
                                type: "web_url",
                                url: "https://www.oculus.com/en-us/rift/",
                                title: "Cal Dining"
                            }, {
                                type: "postback",
                                title: "Follow on Facebook",
                                payload: "Payload for first bubble",
                            }],
                        }, {
                            title: "touch",
                            subtitle: "Your Hands, Now in VR",
                            item_url: "https://www.oculus.com/en-us/touch/",
                            image_url: SERVER_URL + "/assets/touch.png",
                            buttons: [{
                                type: "web_url",
                                url: "https://www.oculus.com/en-us/touch/",
                                title: "Open Web URL"
                            }, {
                                type: "postback",
                                title: "Call Postback",
                                payload: "Payload for second bubble",
                            }]
                        }]
                    }
                }
            }
        };

        callSendAPI(messageData);
    },

    /*
    * Send list of classes.
    *
    */
    sendUserClasses: function(recipientId) {
        var stmt = 'SELECT * FROM classes INNER JOIN user_class ON user_class.cid=classes.id WHERE ?';
        connection.query(stmt, {'user_class.uid': recipientId}, function(err, classes) {
            if (err) {
                error(recipientId);
                console.log(err.code);
            } else {
                if (classes.length == 0) {
                    module.exports.sendTextMessageWithMenu(recipientId, "Looks like you haven't added any class yet! Add one below first!");
                }
                var elements = [];
                var buttons = [
                    {
                        title: 'Add Class',
                        type: 'postback',
                        payload: 'ADD_CLASS'
                    }
                ];
                if (classes.length > 4) {
                    var more = {
                        title: 'Load More'
                    };
                    buttons.push(more);
                }
                classes.forEach(function(value) {
                    var object = {}
                    object.title = value.name;
                    object.subtitle = value.time;
                    elements.push(object);
                });
                var messageData = {
                    recipient:{
                        id:recipientId
                    }, message: {
                        attachment: {
                            type: "template",
                            payload: {
                                template_type: "list",
                                top_element_style: "compact",
                                elements: elements,
                                buttons: buttons
                            }
                        }
                    }
                };

                callSendAPI(messageData);
                    }
                });
    },
    /*
    * Send list of dues.
    *
    */
    sendUserDues: function(recipientId) {
        var stmt = 'SELECT * FROM classes INNER JOIN user_class ON user_class.cid=classes.id\
        INNER JOIN assignments ON assignments.cid=classes.id WHERE ?';
        connection.query(stmt, {'user_class.uid': recipientId}, function(err, classes) {
            if (err) {
                error(recipientId);
                console.log(err.code);
            } else {
                if (classes.length == 0) {
                    module.exports.sendTextMessageWithMenu(recipientId, "Looks like you dues recently! Congrats!😎", 'MAIN');
                } else {
                    var elements = [];
                    var buttons = [
                        {
                            title: 'Upload Due',
                            type: 'postback',
                            payload: 'ADD_DUE'
                        }
                    ];
                    if (classes.length > 4) {
                        var more = {
                            title: 'Load More'
                        };
                        buttons.push(more);
                    }
                    classes.forEach(function(value) {
                        var object = {}
                        object.title = value.name;
                        object.subtitle = value.due;
                        elements.push(object);
                    });
                    var messageData = {
                        recipient:{
                            id:recipientId
                        }, message: {
                            attachment: {
                                type: "template",
                                payload: {
                                    template_type: "list",
                                    top_element_style: "compact",
                                    elements: elements,
                                    buttons: buttons
                                }
                            }
                        }
                    };

                    callSendAPI(messageData);
                }
            }
        })
    },

    sendTextReplyWithWatson: function(recipientId, text, callback) {
       var requestJSON = {
           input: {
               text: text
           }
       };
       request({
           uri: 'https://' + WS_USER + ':' + WS_PW + '@' + WS_API_URL + WSID + '/message?version=2016-09-20',
           method: 'POST',
           json: requestJSON
       }, function(error, response, body) {
           if (error) {
               console.log(error);
           } else {
               var output = body.output.text;
               if (output != 'NA') {
                   callback(recipientId, output[0]);
               } else {
                   var requestJSON = {
                        query: [
                            text
                        ],
                        location: {
                            latitude: 37.459157,
                            longitude: -122.17926
                        },
                        timezone: "PST",
                        lang: "en",
                        sessionId: "1234567890"
                   };
                   request({
                       uri: 'https://api.api.ai/v1/query?v=20150910',
                       method: 'POST',
                       authentication: 'Bearer 0cf49c2ecd7c467583c8c86883bfa72c',
                       json: requestJSON
                   }, function(err, res, body) {
                       var output = body.result.fullfillment.speech;
                       callback(recipientId, output);
                   });
               }
           }
       });
    },

    /*
    * Send a receipt message using the Send API.
    *
    */
    sendReceiptMessage: function(recipientId) {
        // Generate a random receipt ID as the API requires a unique ID
        var receiptId = "order" + Math.floor(Math.random()*1000);

        var messageData = {
            recipient: {
                id: recipientId
            },
            message:{
                attachment: {
                    type: "template",
                    payload: {
                        template_type: "receipt",
                        recipient_name: "Peter Chang",
                        order_number: receiptId,
                        currency: "USD",
                        payment_method: "Visa 1234",
                        timestamp: "1428444852",
                        elements: [{
                            title: "Oculus Rift",
                            subtitle: "Includes: headset, sensor, remote",
                            quantity: 1,
                            price: 599.00,
                            currency: "USD",
                            image_url: SERVER_URL + "/assets/riftsq.png"
                        }, {
                            title: "Samsung Gear VR",
                            subtitle: "Frost White",
                            quantity: 1,
                            price: 99.99,
                            currency: "USD",
                            image_url: SERVER_URL + "/assets/gearvrsq.png"
                        }],
                        address: {
                            street_1: "1 Hacker Way",
                            street_2: "",
                            city: "Menlo Park",
                            postal_code: "94025",
                            state: "CA",
                            country: "US"
                        },
                        summary: {
                            subtotal: 698.99,
                            shipping_cost: 20.00,
                            total_tax: 57.67,
                            total_cost: 626.66
                        },
                        adjustments: [{
                            name: "New Customer Discount",
                            amount: -50
                        }, {
                            name: "$100 Off Coupon",
                            amount: -100
                        }]
                    }
                }
            }
        };

        callSendAPI(messageData);
    },

    /*
    * Send a message with Quick Reply buttons.
    *
    */
    sendQuickReply: function(recipientId, question, quick_replies) {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                text: question,
                quick_replies: quick_replies
            }
        };

        callSendAPI(messageData);
    },

    /*
    * Send a read receipt to indicate the message has been read
    *
    */
    sendReadReceipt: function(recipientId) {
        console.log("Sending a read receipt to mark message as seen");

        var messageData = {
            recipient: {
                id: recipientId
            },
            sender_action: "mark_seen"
        };

        callSendAPI(messageData);
    },

    /*
    * Send INFO of receipt type.
    *
    */
    sendInfoMenu: function(recipientId) {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message:{
                attachment:{
                    type:"template",
                    payload:{
                        template_type:"button",
                        text:"What info to access?\
                        Personal or Class",
                        buttons:[
                            {
                                type:"postback",
                                title:"My Personal Info",
                                payload:"MY_PERSONAL_INFO"
                            },
                            {
                                type:"postback",
                                title:"Class Info",
                                payload:"CLASS_INFO"
                            }
                        ]
                    }
                }
            }
        };

        callSendAPI(messageData);
    },

    sendClassInfoMenu: function(recipientId) {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                attachment: {
                    type: "template",
                    payload:{
                        template_type:"button",
                        text:"Choose a class",
                        buttons:[
                            {
                                type:"postback",
                                title:"MATH 110",
                                payload:"MATH_110"
                            },
                            {
                                type:"postback",
                                title:"CompSci 188",
                                payload:"COMPSCI_188"
                            }
                        ]
                    }
                }
            }
        };

        callSendAPI(messageData);
    },

    sendMyPersonalInfoMenu: function(recipientId) {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                attachment: {
                    type: "template",
                    payload: {
                        template_type: "generic",
                        elements: [{
                            title: "Teddy Zhang",
                            subtitle: "UC Berkeley Sophomore",
                            item_url: "http://caldining.berkeley.edu/menus/all-locations-d1",
                            image_url: SERVER_URL + "/assets/Picture2.png",

                        }]
                    }
                }
            }
        };

        callSendAPI(messageData);
    },

    /*
    * Send Manage Menu
    *
    */
    sendManageMenu: function(recipientId) {
        console.log("Sending Manage Menu");

        var messageData = {
            recipient: {
                id: recipientId
            },
            message:{
                attachment:{
                    type:"template",
                    payload:{
                        template_type:"button",
                        text:"Things to change",
                        buttons:[
                            {
                                type:"postback",
                                title:"Add Assignment",
                                payload:"ADD_ASS"
                            },
                            {
                                type:"postback",
                                title:"Enroll Class",
                                payload:"ENROLL_CLASS"
                            },
                            {
                                type:"postback",
                                title:"Drop Class",
                                payload:"DROP_CLASS"
                            }
                        ]
                    }
                }
            }
        };

        callSendAPI(messageData);
    },


    /*
    * Turn typing indicator on
    *
    */
    sendTypingOn: function(recipientId) {
        console.log("Turning typing indicator on");

        var messageData = {
            recipient: {
                id: recipientId
            },
            sender_action: "typing_on"
        };

        callSendAPI(messageData);
    },

    /*
    * Turn typing indicator off
    *
    */
    sendTypingOff: function(recipientId) {
        console.log("Turning typing indicator off");

        var messageData = {
            recipient: {
                id: recipientId
            },
            sender_action: "typing_off"
        };

        callSendAPI(messageData);
    },

    /*
    * Send a message with the account linking call-to-action
    *
    */
    sendAccountLinking: function(recipientId) {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                attachment: {
                    type: "template",
                    payload: {
                        template_type: "button",
                        text: "Welcome. Link your account.",
                        buttons:[{
                            type: "account_link",
                            url: SERVER_URL + "/authorize"
                        }]
                    }
                }
            }
        };

        callSendAPI(messageData);
    },


}

function error(senderID) {
    module.exports.sendTextMessageWithMenu(senderID, global.ErrorEnum.DBERROR, 'MAIN');
}

/*
* Call the Send API. The message data goes in the body. If successful, we'll
* get the message id in a response
*
*/
function callSendAPI(messageData) {
    request({
        uri: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: PAGE_ACCESS_TOKEN },
        method: 'POST',
        json: messageData

    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var recipientId = body.recipient_id;
            var messageId = body.message_id;

            if (messageId) {
                console.log("Successfully sent message with id %s to recipient %s",
                messageId, recipientId);
            } else {
                console.log("Successfully called Send API for recipient %s",
                recipientId);
            }
        } else {
            console.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
        }
    });


}
