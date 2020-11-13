var fs = require('fs');                                         //These 4 first variables can be viewed as importing 3 libraries we need for the server and then declaring the objects we need to use them (just like Arduino)
var http = require('http');
var express = require('express');
var app = express();

var serverPort = 2520;                                          //The port the server will run on

var server = http.createServer(app);                            //Declare and create http server because the WebSocket protocol formally is a "upgraded" version of the HTTP protocol
var io = require('socket.io').listen(server);                   //Start the WebSocket protocol on top of the HTTP server

//HTTP Server
server.listen(serverPort, function(){                           //Tell the server to start listening (open) on the port we earlier defined
    console.log('Listening on *:' + serverPort);
});

io.on('connection', function(socket){                           //Everytime a user connects an instance of socket.io is set up for the user privately
    console.log('A new user connected');                        //The server prints this message in the console

    //Client ID needs to be fetched
    var clientID = socket.id;                                   //The actual clientID in alphanumeric characters (a string variable)
    var client = io.sockets.connected[clientID];                //The client object, each client has its own object (similar to declaring an object in Arduino C)
    console.log("User ID: " + clientID);

    var clientIPRAW = client.request.connection.remoteAddress;  //Fetch the IP-address of the client that just connected
    var IPArr = clientIPRAW.split(":",4);                       //Split it, which is to say reformat the fetched data

    console.log("User IP: " + IPArr[3]);                        //Print the formatted IP-address in console

    io.emit('clientConnected', clientID, IPArr[3]);             //Send a message to the clients (listening for "clientConnected" identifier) that a new user has connected with its ID and IP

    client.on('disconnect', function(){                         //Function that is called when the client is disconnected. The server can then do something even tough the client is disconnected
        console.log("User " + clientID + " disconnected, stopping timers if any");

        for (var i = 0; i < timers.length; i++) {               //Clear the timers if the client disconnects (this instance)
            clearTimeout(timers[i]);                            //clearTimeout is the same as stopping the timer, in this case we clear all possible timers previously set
        }

    });

    //If a client calls one of the functions, use"io.emit" (to send to all clients) and not "client.emit" to only send to one client

    socket.on('changeLEDState', function(state) {                 //Function that sends the LED state to the clients listening for the identifier

        io.emit('LEDStateChange', state);                         //State can be a bool
        console.log('User ' + clientID + ' changed the LED state to: ' + state);

    });

    socket.on('changeWindowState', function(state) {            //Function that sends the window state to the clients listening for the identifier

        io.emit('windowStateChange', state);                    //State can be an int from 0-180
        console.log('User ' + clientID + ' changed the window state to: ' + state);

    });

    socket.on('changeOverrideState', function(state) {          //Function that sends the override state to the clients listening for the identifier

        io.emit('overrideState', state);                        //State can be a bool
        console.log('User ' + clientID + ' changed the override state to: ' + state);

    });


    //Data from board

    var timers = [];                                            //Stores all our timers

    socket.on('requestDataFromBoard', function(interval) {      //Function that asks clients for data every time-interval

        console.log('User ' + clientID + ' requested data with interval (ms): ' + interval);

        if(interval > 99) {                                     //If the time-interval is not more than 100ms it does not allow it to start
            timers.push(                                        //If an actual argument is given (a time period) it starts the timer and periodically calls the function
                setInterval(function(){
                    io.emit('dataRequest', 1);                  //Send "dataRequest" command/function to all clients
                }, interval)
            );
        } else {
            console.log("Too short time-interval provided");
        }


    });

    socket.on('stopDataFromBoard', function() {                 //Function that stops all timers set by a client so that data will no longer be sent to the webpage
        console.log('User ' + clientID + ' cleared data request interval');

        for (var i = 0; i < timers.length; i++) {               //For loop to clear all set timers
            clearTimeout(timers[i]);                            //clearTimeout is the same as stopping the timers, in this case we clear all timers previously set
        }

    });

    socket.on('dataFromBoard', function(data) {                 //Function that receives sensor data
                                                                //Everytime a "dataFromBoard" identifier (with data) is sent to the server, "data" tag with the actual data is sent to all clients
        io.emit('data', data);                                  //This means the web browser will receive the data, and can then graph it
        console.log('User ' + clientID + ' gained the data: ' + data);

    });

    socket.on('nodeTemperature', function(data) {               //Function that receives temperature data from client

        io.emit('temperatureData', data);                       //Sends the data to all clients listening for "temperatureData" identifier
        console.log('Received the temperature ' + data + ' C'); //Prints the data in the console

    });

    socket.on('nodePressure', function(data) {                  //Function that receives pressure data from client

        io.emit('pressureData', data);                          //Sends the data to all clients listening for "pressureData" identifier
        console.log('Received the pressure ' + data + ' hPa');

    });

    socket.on('nodeHumidity', function(data) {                  //Function that receives humidity data from client

        io.emit('humidityData', data);                          //Sends the data to all clients listening for "humidityData" identifier
        console.log('Received the relative humidity ' + data + ' %');

    });

    socket.on('nodeVOC', function(data) {                       //Function that receives VOC data from client

        io.emit('vocData', data);                               //Sends the data to all clients listening for "vocData" identifier
        console.log('Received the gas_resistance ' + data + ' kOhm');

    });

});