// Load environment variables.
require('dotenv-expand')(require('dotenv').config());

const BOT_TOKEN = process.env.BOT_TOKEN;
const VERIFICATION_TOKEN = process.env.VERIFICATION_TOKEN;
const DESTINATION_CHANNEL = process.env.DESTINATION_CHANNEL;

const slack = new (require('@slack/client').WebClient)(BOT_TOKEN);
const bodyParser = require('body-parser');
const express = require('express');
const https = require('https');
const url = require('url');
const util = require('util');
const app = express();

// Set up middleware.
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.query());
app.use(bodyParser.json());
app.use(
    (req, res, next) => {
        if (! req.body || ! ('payload' in req.body)) {
            return next();
        }

        // Extract the "payload" property.
        req.body = JSON.parse(req.body.payload);

        if (! req.body.token || req.body.token !== VERIFICATION_TOKEN) {
            return res.status(400).send('Bad token.');
        }

        next();
    }
);


// incoming dialog response.
app.post('/slack', async (req, res) => {
    console.log('request body', req.body);
    res.end();

    // Handle dialog submission.
    if ('type' in req.body) {
        let color = undefined;
        let urgency = '';

        switch(req.body.submission.urgency) {
            case 'low':
                color = '#7ED17E';
                urgency = '[Urgency: Low]';
                break;
            case 'medium':
                color = undefined;
                break;
            case 'high':
                color = '#D76855';
                urgency = '*[Urgency: High]*';
                break;
        }

        slack.chat.postMessage({
            channel: DESTINATION_CHANNEL,
            attachments: [
                {
                    color,
                    title: req.body.submission.summary,
                    pretext: `IT support request opened by <@${req.body.user.id}> ${urgency}`,
                    text: req.body.submission.description,
                }
            ]
        }).then(
            () => {},
            (e) => {
                console.error('unable to send IT support message', e);

                buildRequestForResponse(req.body.response_url).end(
                    JSON.stringify({
                        text: `Oh dear. Your IT support request couldn't be sent. Please try again.`,
                        response_type: 'ephemeral'
                    })
                );
            }
        );
    }

    // Handle display of dialog.
    else {
        slack.dialog.open({
            trigger_id: req.body.trigger_id,
            dialog: {
                callback_id: 'submit',
                title: 'Request IT Support',
                submit_label: 'Create',
                elements: [
                    {
                        type: "text",
                        name: 'summary',
                        label: "Summary",
                        placeholder: "Single sentence outlining what you need."
                    },
                    {
                        type: "select",
                        name: "urgency",
                        label: "Urgency",
                        placeholder: 'Select the urgency of this support ticket.',
                        value: 'medium',
                        options: [
                            {
                                label: "Low",
                                value: 'low',
                            },
                            {
                                label: "Medium",
                                value: 'medium',
                            },
                            {
                                label: "High",
                                value: 'high',
                            }
                        ]
                    },
                    {
                        type: 'textarea',
                        name: 'description',
                        label: 'Full description',
                        placeholder: 'Please provide the full description of what you require. Please include all necessary information.',
                    }
                ]
            }
        }).then(
            () => {

            },
            (e) => {
                console.error('cannot submit dialog', util.inspect(e, {depth:4}));

                buildRequestForResponse(req.body.response_url).end(
                    JSON.stringify({
                        text: `Oh dear. Your IT support request couldn't be sent. Please try again.`,
                        response_type: 'ephemeral'
                    })
                );
            }
        );
    }
});


// Start listening.
app.listen(3000);


/**
 *
 * @param responseUrl
 * @returns {ClientRequest}
 */
function buildRequestForResponse(responseUrl) {
    const request = https.request(
        Object.assign(
            {},
            url.parse(responseUrl),
            {
                method: 'POST'
            }
        )
    );

    // request.on('response', message => {
    //     const chunks = [];
    //     message.on('data', chunk => chunks.push(chunk));
    //     message.on('end', () => console.log(chunks.join('')));
    // });

    return request;
}