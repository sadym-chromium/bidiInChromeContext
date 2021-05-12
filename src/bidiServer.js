`use strict`;
const WebSocket = require('ws');

const WebSocketServer = require('websocket').server;

const http = require('http');

const debug = require('debug');

// const debugInternal = debug('bidiServer');
const debugSend = debug('biDiServer:SEND ►');
const debugRecv = debug('biDiServer:RECV ◀');

const biDiPort = process.env.BIDI_PORT || 8080;

module.exports = {
    runBidiServer: async function (onConnection) {
        return await runBidiServer(onConnection);
    }
};

const runBidiServer = async (onConnection) => {
    const server = http.createServer(function (request, response) {
        debug((new Date()) + ' Received request for ' + request.url);
        response.writeHead(404);
        response.end();
    });
    server.listen(biDiPort, function () {
        console.log(`${new Date()} Server is listening on port ${biDiPort}`);
    });

    const wsServer = new WebSocketServer({
        httpServer: server,
        // You should not use autoAcceptConnections for production
        // applications, as it defeats all standard cross-origin protection
        // facilities built into the protocol and the browser.  You should
        // *always* verify the connection's origin and decide whether or not
        // to accept it.
        autoAcceptConnections: false
    });

    wsServer.on('request', async function (request) {
        // A session per connection.
        // if (!originIsAllowed(request.origin)) {
        //     // Make sure we only accept requests from an allowed origin.
        //     request.reject();
        //     console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
        //     return;
        // }

        const messageHandlers = [];

        onConnection({
            initialisationComplete: function () {
                let connection;
                try {
                    connection = request.accept();
                } catch (e) {
                    console.log((new Date()) + ' Cannot accept connection from origin', request.origin, e);
                    return;
                }

                connection.on('message', function (message) {
                    const messageStr = message.utf8Data;
                    debugRecv(messageStr)
                    for (let handler of messageHandlers)
                        handler(messageStr);
                });

                return {
                    setOnMessageHandler: function (handler) {
                        messageHandlers.push(handler);
                    },
                    sendMessage: function (message) {
                        const messageStr = JSON.stringify(message);
                        debugSend(messageStr);
                        connection.sendUTF(messageStr);
                    }
                };
            }
        });
    });

    // debugInternal("launching bidi websocket server");

    // const wss = new WebSocket.Server({
    //     port: biDiPort,
    // });

    // debugInternal("bidi websocket server launched on port ", biDiPort);

    // await new Promise((resolve) => {
    //     wss.on('connection', function connection(bidiWsConnection) {
    //         _bidiWsConnection = bidiWsConnection
    //         debugInternal("bidi websocket server connected");

    //         // Proxy BiDi messages to internal connection.
    //         _bidiWsConnection.on('message', message => {
    //             debugRecv(message);
    //             _onMessage(message);
    //         });

    //         resolve();
    //     });
    // });

    // return {
    //     sendMessage: async function (message) {
    //         debugSend(message);
    //         _bidiWsConnection.send(message);
    //     },
    // }
};