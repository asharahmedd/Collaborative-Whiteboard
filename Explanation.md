# Chaos Theory – Documentation

This document explains how WebSocket communication, canvas rendering, and state synchronization work together to enable real-time collaboration on a shared canvas. By leveraging WebSockets, this system ensures low-latency updates, allowing multiple users to draw on the same canvas simultaneously.

---

## 1. WebSocket Communication

WebSockets allow full-duplex communication between multiple clients and servers, maintaining a persistent connection that enables real-time updates. The WebSocket server is a central hub to manage and distribute drawing data among all connected clients. 

In this context, A web socket server listens for connections, and then the client connects to the server and sends/receives the messages. 

### How WebSocket Communication Works:

- **WebSocket Server**:
  - Listens for incoming client connections.
  - Runs on `ws://localhost:8080`.
  - Manages and broadcasts drawing updates to connected clients.

- **Client Connection**:
  - Clients connect to the server using:
    ```javascript
    const ws = new WebSocket('ws://localhost:8080');
    ```
  - Clients send and receive drawing updates via WebSocket messages.

### Sending and Broadcasting Data:

The server broadcasts updates to all connected clients (e.g. when a user draws on the canvas, others see the change instantly.  When a user draws on the canvas, their drawing actions are captured as structured data, such as stroke positions and colors. This data is then sent to the WebSocket server, which immediately broadcasts it to all other connected clients.   

**The webserver broadcasts using a helper function:**
```javascript
const broadcast = (data) => {
    console.log('Broadcasting data to clients:', data)
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
};
```


The data is sent using the following commands in their respective sending functions. We do this so that the server can differentiate between types of data:

- **Commands for Sending Data**:
  ```javascript
  // Sending a line
  ws.send(JSON.stringify({ type: 'line', stroke }));

  // Sending a stroke
  ws.send(JSON.stringify({ type: 'stroke', stroke }));

  // Sending text
  ws.send(JSON.stringify({ type: 'text', text, x, y, color }));
  ```
The server broadcasts this data to all other connected clients, and each client renders the updates locally. This ensures that all users see the same drawing in real-time.
The client updates using the renderStroke function. 

Different render stroke functions for different types of data.  

- **Below is for line and stroke:**
  ```javascript
  const renderStroke = ({ x, y, color, strokeSize, isStart, lastX,lastY })     => {
  ctx.strokeStyle = color;
  ctx.lineWidth = strokeSize;
  if (isStart) {
      ctx.beginPath();
      ctx.moveTo(x, y);
  } else {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };
  ```

**When a Client Connects:**
	A new WebSocket connection is established. The server sends the current canvas state (all previous drawings) to the new client. The client is asked to provide a username stored on the server and broadcasted to all clients. The usernames are stored in an array; they are sent to the server and are updated dynamically.
 
 Usernames are sent to the server, and they are updated in the update client list functions(preview in the code):
  ```javascript
  ws.send(JSON.stringify({ type: 'username', username }));
  ```

**Sending and Receiving Messages:**
  When users draw, erase, or add text, the changes are sent via Web Sockets. Client sends a message (e.g., drawing a stroke, adding text, clearing canvas). Server processes the message, updates the canvas State, and broadcasts it to all connected clients. The client then processes each data from the server and make respective changes based on the data type.
If it is a drawing or a text, it renders it on the screen. If it is a client, it updates the client list. 
- The function for this:
```javascript
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Received data from server:', data);
    if (data.type === 'init') {
        // Restore canvas state
        if (Array.isArray(data.canvasState)) {
            data.canvasState.forEach((item) => {
                if (item.type === 'draw') {
                    renderStroke(item.stroke);
                } else if (item.type === 'line') {
                    renderStroke({
                        x: item.line.x,
                        y: item.line.y,
                        lastX: item.line.lastX,
                        lastY: item.line.lastY,
                        color: item.line.color,
                        strokeSize: item.line.strokeSize,
                    });
                } else if (item.type === 'text') {
                    renderText(item.text.x, item.text.y, item.text.value, item.text.color);
                }
            });
        }
    } else if (data.type === 'draw') {
        renderStroke(data.stroke);
    } else if (data.type === 'line') {
        renderStroke({
            x: data.line.x,
            y: data.line.y,
            lastX: data.line.lastX,
            lastY: data.line.lastY,
            color: data.line.color,
            strokeSize: data.line.strokeSize,
        });
    }  else if (data.type === 'text') {
       renderText(data.text.x, data.text.y, data.text.value, data.text.color);
    } else if (data.type === 'clear') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    } else if (data.type === 'clients') {
        updateClientList(data.clients);
    }
};
```
**When a Client Disconnects:**
	The server removes the user from the list of active clients. The updated client list is broadcast simultaneously. The server removes that particular client from the list.
 ```
clients = clients.filter((username) => username !== ws.username);
```
---

## 2. Canvas Rendering
The whiteboard interface includes a <canvas> element in the HTML file. In JavaScript, we get a reference to this canvas using `document.getElementById("canvas")` and access its context using `canvas.getContext("2d")`.
```javacript
const canvas = document.getElementById('whiteboard');
const ctx = canvas.getContext('2d');
```
The context is what allows us to draw on the canvas. It provides a 2D context, allowing the users to draw shapes and lines and listen to the user input, such as mouse or touch events. It then updates in real time based on WebSocket messages.
Here, the canvas works in a similar way to the explanation above. The users interact with the canvas (e.g., drawing). Events trigger WebSocket messages (mouse-move, mouse-down, etc.).  

The canvas updates locally and then sends the updates to others via Web Sockets. When receiving data from Web Sockets, the client redraws the updates that were received.  

**How Canvas Rendering Works:**  
	When a user clicks on the canvas, mouse-down starts drawing. As they move the mouse, the mouse-move continuously updates the drawing. When they release the mouse, the mouse-up stops drawing. Each stroke is sent to the server (send-Stroke function). The server broadcasts the stroke to other users, who render it using the render-Stroke function.  
 
**Here, we have different functionalities in terms of tools.**   

We can have a drawing tool, a line tool, a text tool, and a clear tool.

**- Stroke Tool (default): Draws smooth strokes.**
  - When a user clicks on the canvas (mouse down), the drawing starts, and the starting position is captured. The stroke is sent as well as rendered at the same time:
  ```javascript
  const { x, y } = getMousePosition(e);
  sendStroke({ x, y, color, strokeSize, isStart: true });
  renderStroke({ x, y, color: currentColor, strokeSize, isStart: true });
  ```

  - As the mouse moves (mouse move), new positions are captured and sent to the server,and  the previewing is sent as well as rendered at the same time:
  ```javascript
  sendStroke({ x, y, color, strokeSize, isStart: false, lastX, lastY });
  renderStroke({ x, y, color: currentColor, strokeSize, isStart: false, lastX, lastY });
  ```

  -	When the mouse is released (mouse up),the drawing stops:
  ```javascript
  isDrawing = false; 
  ctx.closePath();
  ```

**-	Line Tool:**
  -	Click once to start the line. Move the mouse to preview the line. Click again to complete the line and send it to the server.
  -	The line preview and line drawing are shown using `ctx.putImageData` to restore the canvas state and `ctx.stroke` to draw the previewed line:
  ```javascript
  const previewLine = (e) => { 
  ctx.putImageData(savedCanvas, 0, 0); 
  ctx.beginPath(); 
  ctx.moveTo(lineStart.x, lineStart.y);
  ctx.lineTo(x, y);
  ctx.stroke(); 
  };
```
  - The finalized line is sent to the server and rendered(shown above) locally as well:
  ```javascript
  sendStrokeLine({ x: lineStart.x, y: lineStart.y, lastX: x, lastY: y, color, strokeSize });
  ```

**- Text Tool:**
  -	Click on the canvas to place; a prompt asks for the text input; the text is drawn and sent to the user.
    ```javascript
    const text = prompt ('Enter text:');
    ctx.fillText(text, x, y);
    ws.send(JSON.stringify({ type: 'text', text, x, y, color }));
    ```
    
**- Clearing the Canvas:**
  -	When a user clicks the "Clear" button. The server resets the canvas State array; A clear command is broadcasted to all clients.
  -	Each client clears their canvas.
  ```javascript
  ctx.clearRect(0, 0, canvas.width, canvas.height);  
  ws.send(JSON.stringify({ type: 'clear' }));
  ```
---

## 3. State Synchronization  

State Synchronization ensures all connected users see the same drawing, even if they join late. When a new user connects, the server can send a snapshot of the current canvas state to ensure consistency.   
The canvas state is stored as an array `(let canvasState = [];)` in which all kinds of strokes and data are stored using a normal push:  
```javascript
canvasState.push({ type: 'line', line: data.line });
canvasState.push({
                type: 'text',
                text: { x: data.x, y: data.y, value: data.text, color: data.color },
            });
```
If the WebSocket connection is disrupted, clients may attempt to reconnect automatically.  
In case of prolonged disconnection, a local buffer can store unsent drawing events, which are transmitted once the connection is restored. 
State Synchronization across clients means that the canvas state stores all past strokes, lines, and text. When a new client joins, the server sends the entire state. 
**It sends everything using:**
```javascript
ws.send(JSON.stringify({ type: 'init', canvasState }));
```
The client replays all strokes and text to match the latest version. 


## 4. What Happens When the Network Connection is Disrupted

If a user loses their connection, they will stop receiving drawing updates from others, and their changes won’t be sent to the server, but they can still draw locally on their canvas. However, when they reconnect, the server can resend the latest state of the canvas, ensuring they don’t miss any updates. If the server goes down, all users will be disconnected, and drawing updates will be lost unless a backup or database storage mechanism is implemented.
This system allows multiple users to draw together in real-time with very little delay. The WebSocket server ensures smooth communication, while the canvas on each user’s screen updates instantly, creating a seamless shared drawing experience.


## What Happens If the Connection is Lost? 

**Temporary disconnection:** If a user loses internet temporarily, their local drawing continues. When the connection is restored, they receive all updates from the server.  

**Permanent Disconnection:** If the WebSocket connection is closed, the user is removed from the active clients list. They must reconnect to see updates

## How the Key Parts Work Together
**1.	WebSocket Server:** The WebSocket server maintains open connections with multiple clients, allowing real-time bidirectional communication. It receives drawing data from one client and distributes it to others, ensuring all users stay in sync. The server can also store drawing data to allow new users to receive the current state of the canvas when they join.  

**2.	Client-Side Canvas Rendering:** Each client has a canvas element displaying the drawing. The client captures user inputs, such as mouse movements and clicks, to determine when and where strokes should be drawn. This data is sent to the WebSocket server and rendered locally to provide instant feedback.  

**3.	State Synchronization**: Since multiple users draw simultaneously, keeping the canvas synchronized is essential. Each client listens for WebSocket server updates and renders strokes from other users. This ensures that all clients display the same canvas, even though they are interacting independently.
   
**How Communication Works**  

•	When a user starts drawing, the client captures the stroke details (coordinates, color, thickness, etc.).  
•	The client sends this data through the WebSocket connection to the server.  
•	The server receives the data and immediately broadcasts it to all other connected clients.  
•	Each client receives the drawing data and updates their canvas accordingly.  
•	If a new client joins, the server can send previously stored strokes to update them.  

---
## Helper Functions:

**- Random Color:**  

```javascript
function getRandomColor() {
    return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
}
let color = getRandomColor();

```
**- Resizing Canvas:** 

```javascript
const resizeCanvas = () => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.putImageData(imageData, 0, 0);
};
```
**- Toggling the Background:**(it activates whenever the client cicks on change background)  

```javascript
const toggleBackground = () => {
    document.body.classList.toggle('dark-mode');
};
```
**- Saving the drawing:**  

```javascript
const saveDrawing = () => {
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'drawing.png';
    link.click();
};
```

**- Timer Start/Update:**

```javascript
const startTimer = () => {
    startTime = Date.now();
    updateTimer();
};

// Update the timer
const updateTimer = () => {
    const elapsedTime = Date.now() - startTime;
    const hours = Math.floor(elapsedTime / 3600000);
    const minutes = Math.floor((elapsedTime % 3600000) / 60000);
    const seconds = Math.floor((elapsedTime % 60000) / 1000);

    timerElement.textContent = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    requestAnimationFrame(updateTimer);
};

```









