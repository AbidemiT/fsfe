const express = require("express");
const server = require("http").createServer();

const app = express();

app.get("/", (req, res) => {
	res.sendFile('index.html', {root: __dirname});
});

server.on("request", app);
server.listen(3000, () => {
	console.log("Listening on port 3000");
});

process.on("SIGINT", () => {
    console.log("Caught interrupt signal");
    server.close(() => {
        console.log("Server closed");
        shutdownDB();
    });
});

/** Begin websocket */
const WebSocketServer = require("ws").Server;

const wss = new WebSocketServer({ server: server });

wss.on('connection', function connection(ws) {
    const numClients = wss.clients.size;
    console.log("New client connected. Total clients: ", numClients);

    wss.broadcast(`${numClients} clients connected`);

    if (ws.readyState === ws.OPEN) {
        ws.send("Welcome to the chat room!");
    }

    db.run(`INSERT INTO visitors (count, time)
         VALUES (${numClients}, datetime('now'))
         `);

    ws.on('close', function close() {
        wss.broadcast(`Current visitors ${numClients}`);
        console.log("Client disconnected. Total clients: ", numClients);
    });
});

wss.broadcast = function broadcast(data) {
    wss.clients.forEach(function each(client) {
        if (client.readyState === client.OPEN) {
            client.send(data);
        };
    });
};

// end websockets

// begin database
const sqlite = require("sqlite3").verbose();
const db =  new sqlite.Database(':memory:');

// Set table

db.serialize(() => {
    db.run(`
        CREATE TABLE visitors (
            count INTEGER,
            time TEXT
        )
    `);
});

function getCounts() {
    db.each("SELECT * FROM visitors", (err, row) => { 
        console.log(row);
    });
}

function shutdownDB() {
    getCounts();
    console.log("Shutting down db...");
    db.close();
}