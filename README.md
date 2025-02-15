# **Collaborative Whiteboard**  

A real-time, multi-user whiteboard application that enables users to draw, add text, and interact collaboratively. Built using **HTML, CSS, JavaScript, and WebSockets**, this application ensures seamless synchronization of drawings among all connected users.  

## **Features**  

- 🎨 **Drawing** – Freehand drawing with adjustable brush size.  
- ✏️ **Text Tool** – Add text anywhere on the whiteboard.  
- 📏 **Line Tool** – Draw straight lines with precision.  
- 🖼️ **Dark Mode** – Switch between light and dark backgrounds.  
- 💾 **Save Canvas** – Download your drawing as a PNG file.  
- 🗑️ **Clear Canvas** – Clear the board for all connected users.  
- 👥 **Multi-User Collaboration** – See other users' drawings in real time.  
- ⏳ **Session Timer** – Track session duration.  
- 🔗 **WebSocket Server** – Synchronizes canvas updates across users.  

## **Project Structure**  

```bash
/collaborative-whiteboard  
│── /public                            
│   │── index.html       # Frontend UI        
│   │── script.js        # Client-side logic (drawing, WebSocket handling)        
│── /server        
│   │── server.js        # WebSocket server for real-time communication        
│── README.md        # Project documentation
|── package.json       
```

## **Installation & Setup**

#### 1. Clone the Repository

    git clone https://github.com/asharahmedd/Collaborative-Whiteboard.git
    cd Collaborative-Whiteboard

#### 2. Install Dependencies
    Ensure you have Node.js installed, then install the required WebSocket package:
    npm install ws

#### 3. Start the WebSocket Server after going to the server directory

    cd server
    node server.js

#### 4. Open the Application

    Simply open index.html in a web browser. If you're using Live Server (VS Code extension), start it for better performance.


## **Usage Guide**

Open the whiteboard in a browser.  
Draw, add text, or create lines using the available tools.  
Change brush size and background color as needed.  
Save your drawing as an image or clear the canvas.  
Collaborate with others in real time—active users are displayed in the Active Clients panel.  

## **Future Enhancements**
✨ Additional Drawing Tools – Eraser, shape tools (rectangle, circle, etc.).(I have added personally)  
🔐 User Authentication – Enable user logins for persistent sessions.  
💾 Persistent Storage – Save drawings to a database for retrieval.  
📲 Mobile Optimization – Improve touch-screen compatibility. 


**Developed by [Ashar Ahmed Siddiqui]**
