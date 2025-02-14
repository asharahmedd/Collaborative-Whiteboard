const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

// Store all strokes, lines, circles, and text (global canvas state)
let canvasState = [];

// Store active clients and their usernames
let clients = [];

wss.on('connection', (ws) => {
    console.log('New client connected!');

    // Send current canvas state to new clients
    ws.send(
        JSON.stringify({
            type: 'init',
            canvasState, // Send the entire canvas state (strokes, lines, text)
        })
    );

    // Handle messages from clients
    ws.on('message', (message) => {
        const data = JSON.parse(message);

        if (data.type === 'username') {
            // Register the username for the client
            ws.username = data.username;
            clients.push(data.username);

            // Broadcast the updated client list to all clients
            broadcast({
                type: 'clients',
                clients,
            });
        } else if (data.type === 'draw') {
            // Store the stroke
            canvasState.push({ type: 'draw', stroke: data.stroke });
            console.log('Received stroke data from client:', data.stroke);

            // Broadcast stroke to all clients
            broadcast({
                type: 'draw',
                stroke: data.stroke,
            });
        } else if (data.type === 'clear') {
            // Clear the canvas state
            canvasState = [];

            // Broadcast clear command to all clients
            broadcast({
                type: 'clear',
            });
        } else if (data.type === 'line') {
            console.log('Received line data from client:', data.line);
            // Store the line directly
            canvasState.push({ type: 'line', line: data.line });
        
            // Broadcast line to all clients
            broadcast({
                type: 'line',
                line: data.line,
            });
        } 
         else if (data.type === 'text') {
            // Store the text
            canvasState.push({
                type: 'text',
                text: { x: data.x, y: data.y, value: data.text, color: data.color },
            });

            // Broadcast text to all clients
            broadcast({
                type: 'text',
                text: { x: data.x, y: data.y, value: data.text, color: data.color },
            });
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');

        // Remove the disconnected user's name from the client list
        clients = clients.filter((username) => username !== ws.username);

        // Broadcast the updated client list to all clients
        broadcast({
            type: 'clients',
            clients,
        });
    });
});

// Helper function to broadcast messages to all connected clients
const broadcast = (data) => {
    console.log('Broadcasting data to clients:', data)
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
};

console.log('WebSocket server running on ws://localhost:8080');