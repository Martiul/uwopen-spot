var express = require('express');
var app = express();
var https = require('https')

// uWaterloo API
var uwaterlooApi = require('uwaterloo-api');
var uwclient = new uwaterlooApi({
    API_KEY: 'UW_API_KEY '
});

// Twilio API
var twilio = require('twilio')
const accountSid = 'TWILIO_ACCOUNT_SID'; // Your Account SID from www.twilio.com/console
const authToken = 'TWILIO_AUTH_TOKEN';   // Your Auth Token from www.twilio.com/console

const PORT = process.env.PORT || 3000;


app.listen(PORT, function () {
    console.log('Server is listen...');
});

app.get('/', function (req,res) {
    res.send("GET Request to server");
});

// checkOpenSpot: Checks periodically if courseNumber has
//                open spot, and sends a text message if it does
function checkOpenSpot (courseNumber) {

    setTimeout (() => {
        uwclient.get(`/courses/${courseNumber}/schedule`, (err, res) => {
            let spaces = res.data[0].enrollment_capacity - res.data[0].enrollment_total;
            console.log(`${courseNumber} has ${spaces} open spaces`);
            if (spaces != 0) {
                console.log(`Course number ${courseNumber} has an open spot!`);
                sendSMS(`Course number ${courseNumber} has an open spot!`);
            }
            else {
                checkOpenSpot(courseNumber);
            }
        });
    }, 600000); // Every 10 minutes
}

// checkIn: Sends a text message every so often to remind
//          the owner that their server is still running
function checkIn () {
    setTimeout ( () => {
        sendSMS(`Server is still alive`);
        checkIn();
    }, 7200000); // Every 2 hours
}

// sendSMS: Sends a text message to the owner with the provided message
//          using the Twilio API
function sendSMS (message) {
    let client = new twilio(accountSid, authToken);

    client.messages.create({
        body: message,
        to: '+OWNER_NUMBER',  // Text this number
        from: '+TWILIO_NUMBER ' // From a valid Twilio number
    })
    .then((message) => console.log(`Message successfuly sent (${message.sid}`));
}

// heroku_stayAlive: Makeshift function to prevent dynos on heroku from idling
//                   Mimiced by making a GET request to the server every so often
function heroku_stayAlive() {
    const options = {
        host: 'uwopen-spot.herokuapp.com',
    };
    setInterval( () => {
        let date = new Date();
        https.get(options, (res) => {
            res.on('data', function (chunk) {
                console.log(`Pinged Heroku server: ${date}`);
            })
        }).on('error', (err) => {
            console.log(`Error pinging Heroku server: ${date}`);
        });
    }, 60000);  // Every minute
}

checkOpenSpot(5718);
checkOpenSpot(5720);
checkIn();
heroku_stayAlive();
