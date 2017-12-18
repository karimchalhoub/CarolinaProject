'use strict';

var fs = require('fs');

 exports.get = function(event, context) {
   var contents = fs.readFileSync("public/index.html");
   context.succeed({
     statusCode: 200,
     body: contents.toString(),
     headers: {'Content-Type': 'text/html'}
   });
 };

//----------------- Main handler ----------------

exports.handler = (event, context, callback) => {
    try {

        var request = event.request;
        var session = event.session;

        console.log(`applicationId=${session.application.applicationId}`);

        if (session.new) {
            console.log(`New session started with requestId=${request.requestId}, sessionId=${session.sessionId}`);
        }

        if (request.type === 'LaunchRequest') {
            console.log(`Launch requestId=${request.requestId}, sessionId=${session.sessionId}`);

            getWelcomeResponse((response) => {
                callback(null, response);
            });
        }

        if (request.type === 'IntentRequest') {
            console.log(`Intent requestId=${request.requestId}, sessionId=${session.sessionId}`);

            const intent = request.intent;
            const intentName = intent.name;

            if (intentName === 'HelloIntent') {
                getSayHello(intent, (response) => {
                    callback(null, response);
                });
            } else if (intentName === 'AMAZON.HelpIntent') {
                getWelcomeResponse((response) => {
                    callback(null, response);
                });
            } else if (intentName === 'AMAZON.StopIntent' || intentName === 'AMAZON.CancelIntent') {
                handleSessionEndRequest((response) => {
                    callback(null, response);
                });
            } else {
                throw new Error('Invalid Intent');
            }
        }

    } catch (err) {
        callback(err);
    }
}

//----------------- Functions that control the skill's behavior ----------------
//for Launch & Help Requests
function getWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    const sessionAttributes = {};
    const cardTitle = 'Welcome to Carolina Project';
    const speechOutput = 'Welcome to the Alexa Carolina Project! ' +
        'I\'m only getting started. So I can\'t do too many things just yet.' +
        'For now, you can only say, Carolina, say hi to John, for example.';

    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    const repromptText = 'You can do this.' +
        'Just say, Carolina, say hello to tony, for example.';
    const shouldEndSession = false;

    callback(buildResponse(sessionAttributes, cardTitle, speechOutput, repromptText, shouldEndSession));
}

//For IntentRequest Name HelloIntent
function getSayHello(myIntent, callback) {

    const cardTitle = myIntent.name;
    var shouldEndSession = true;
    let firstName = myIntent.slots.FirstName.value;
    let sessionAttributes = {};
    let repromptText = '';
    let speechOutput = '';

    if (firstName) {
        speechOutput = `Hi ${firstName}! Your name is spelled...`;
    } else {
        speechOutput = 'I don\'t understand that. Can you repeat your request please?';
        repromptText = 'I don\'t understand that. Can you repeat your request please?';
        shouldEndSession = false;
    }

    callback(buildResponse(sessionAttributes, cardTitle, speechOutput, repromptText, shouldEndSession));
}

//For End Session Request
function handleSessionEndRequest(callback) {
    const cardTitle = 'Session Ended';
    const speechOutput = 'Thank you for trying the Alexa Carolina Skill. Have a nice day!';

    const shouldEndSession = true;

    callback(buildResponse({}, cardTitle, speechOutput, null, shouldEndSession));
}


// --------------- Helper that builds all of the responses -----------------------

function buildResponse(sessionAttributes,title, output, repromptText, shouldEndSession) {
    return {
        version: '1.0',
        sessionAttributes,
        response: {
            outputSpeech: {
                type: 'PlainText',
                text: output,
            },
            card: {
                type: 'Simple',
                title: `Session Title - ${title}`,
                content: `Session Output - ${output}`,
            },
            reprompt: {
                outputSpeech: {
                    type: 'PlainText',
                    text: repromptText,
                },
            },
            shouldEndSession
        }
    }
}