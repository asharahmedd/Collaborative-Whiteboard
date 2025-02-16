# Chaos Theory – Documentation

This document explains how WebSocket communication, canvas rendering, and state synchronization work together to enable real-time collaboration on a shared canvas. By leveraging WebSockets, this system ensures low-latency updates, allowing multiple users to draw on the same canvas simultaneously.

---

## 1. WebSocket Communication

WebSockets allow full-duplex communication between multiple clients and a server, maintaining a persistent connection that enables real-time updates. The WebSocket server acts as a central hub to manage and distribute drawing data among all connected clients. 

In this context, A web socket server listens for connections, then the client connects to the server and send/receive the messages. 

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

The data is sent using the following commands in their respective sending functions. We do this so that the server can differentiate between types of data:

- **Commands for Sending Data**:
  ```javascript
  // Sending a line
  ws.send(JSON.stringify({ type: 'line', stroke }));

  // Sending a stroke
  ws.send(JSON.stringify({ type: 'stroke', stroke }));

  // Sending text
  ws.send(JSON.stringify({ type: 'text', text, x, y, color }));
`
  The server broadcasts this data to all other connected clients, and each client renders the updates locally. This ensures that all users see the same drawing in real time.
