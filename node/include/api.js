'use strict'


const
request             =   require('request'),
config              =   require('config'),
SERVER_URL          =   config.get('serverURL'),
PAGE_ACCESS_TOKEN   =   config.get('pageAccessToken');


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
    sendTextMessage: function(recipientId, messageText) {
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
    * Send list of dues.
    *
    */
    sendDuesList: function(recipientId) {
        var messageData = {
            recipient:{
                id:recipientId
            }, message: {
                attachment: {
                    type: "template",
                    payload: {
                        template_type: "list",
                        top_element_style: "compact",
                        elements: [
                            {
                                title: "Classic Black T-Shirt",
                                subtitle: "100% Cotton, 200% Comfortable",
                                buttons: [
                                    {
                                        type: "postback",
                                        title: "Bookmark Item",
                                        payload: "DEVELOPER_DEFINED_PAYLOAD"
                                    }
                                ]
                            },
                            {
                                title: "Classic Gray T-Shirt",
                                subtitle: "100% Cotton, 200% Comfortable"
                            }
                        ]
                    }
                }
            }

        };

        callSendAPI(messageData);
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
    sendQuickReply: function(recipientId, question, title1, payload1, title2, payload2) {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                text: question,
                quick_replies: [
                    {
                        "content_type":"text",
                        "title":title1,
                        "payload":payload1
                    },
                    {
                        "content_type":"text",
                        "title":title2,
                        "payload":payload2
                    }
                ]
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