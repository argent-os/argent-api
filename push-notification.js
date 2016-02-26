"use strict";

var apn  = require ('apn');
var path = require('path');
var fs = require('fs');

var options = {
    "cert": fs.readFileSync(path.join(__dirname, "/cert.pem")),
    "key":  fs.readFileSync(path.join(__dirname, "/key.pem")),
    "passphrase": "***",
    "gateway": "gateway.sandbox.push.apple.com",
    "port": 2195,
    "enhanced": true,
    "cacheLength": 5,
};

var tokens = ["8af7e01f609d474b947cdc1d218b402e85150095328d71e78985d6f05e6274c3"];

if(tokens[0] === "<insert token here>") {
	console.log("Please set token to a valid device token for the push notification service");
	process.exit();
}

// Create a connection to the service using mostly default parameters.

var service = new apn.connection({ options: options, production: false });

service.on("connected", function() {
    console.log("Connected");
});

service.on("transmitted", function(notification, device) {
    console.log("Notification transmitted to:" + device.token.toString("hex"));
});

service.on("transmissionError", function(errCode, notification, device) {
    console.error("Notification caused error: " + errCode + " for device ", device, notification);
    if (errCode === 8) {
        console.log("A error code of 8 indicates that the device token is invalid. This could be for a number of reasons - are you using the correct environment? i.e. Production vs. Sandbox");
    }
});

service.on("timeout", function () {
    console.log("Connection Timeout");
});

service.on("disconnected", function() {
    console.log("Disconnected from APNS");
});

service.on("socketError", console.error);


// If you plan on sending identical paylods to many devices you can do something like this.
function pushNotificationToMany() {
    console.log("Sending the same notification each of the devices with one call to pushNotification.");
    var note = new apn.notification();
    note.setAlertText("Hello, welcome to PayKloud!");
    note.badge = 3;
    note.sound = "ping.iff";
    note.alert = "\uD83D\uDCE7 \u2709 You have a new message";
    note.payload = {'messageFrom': 'Sinan'};
    service.pushNotification(note, tokens);
}

// pushNotificationToMany();


// If you have a list of devices for which you want to send a customised notification you can create one and send it to and individual device.
function pushSomeNotifications() {
    console.log("Sending a tailored notification to %d devices", tokens.length);
    tokens.forEach(function(token, i) {
        var note = new apn.notification();
        note.setAlertText("Hello, from PayKloud! You are number: " + i);
        note.badge = 3;
        note.sound = "ping.iff";
        note.alert = "\uD83D\uDCE7 \u2709 You have a new message";
        note.payload = {'messageFrom': 'Sinan'};
        service.pushNotification(note, token);
    });
}

pushSomeNotifications();