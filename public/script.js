const ws = new WebSocket('ws://localhost:8080');

let isDrawing = false;
let canvas, ctx;
let isTextToolActive = false;
let isLineToolActive = false; 
let lineStart = null;
let savedCanvas = null;
let username;
const statusElement = document.getElementById('status');
const timerElement = document.getElementById('timer');
const textToolBtn = document.getElementById('textTool');
const lineToolBtn = document.getElementById('lineTool');
const changeBackgroundBtn = document.getElementById('changeBackground');
const saveDrawingBtn = document.getElementById('saveDrawing');
const clearCanvasBtn = document.getElementById('clearButton');
let strokeSize = 2; //default stroke size
let startTime;
let lastX = 0;
let lastY = 0;

// Generate a random color for each user
function getRandomColor() {
    return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
}
let color = getRandomColor();

// Initialize the canvas
const initCanvas = () => {
    canvas = document.getElementById('whiteboard');
    ctx = canvas.getContext('2d', { willReadFrequently: true });

    resizeCanvas();

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    clearCanvasBtn.addEventListener('click', clearCanvas);
    changeBackgroundBtn.addEventListener('click', toggleBackground);
    textToolBtn.addEventListener('click', toggleTextTool);
    saveDrawingBtn.addEventListener('click', saveDrawing);
    lineToolBtn.addEventListener('click', toggleLineTool);
    document.getElementById('strokeSize').addEventListener('input', changeStrokeSize);
    window.addEventListener('resize', resizeCanvas);
    
};

// Resize canvas and restore content
const resizeCanvas = () => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.putImageData(imageData, 0, 0);
};

// Start drawing
const startDrawing = (e) => {
    if (isTextToolActive || isLineToolActive) return; // Prevent drawing if text or line tool is actives
    isDrawing = true;
    const { x, y } = getMousePosition(e);
    lastX = x;
    lastY = y;
    currentColor=color;
    sendStroke({ x, y, color: currentColor, strokeSize, isStart: true });
    renderStroke({ x, y, color: currentColor, strokeSize, isStart: true });
};

// Draw on the canvas
const draw = (e) => {
    if (!isDrawing || isTextToolActive || isLineToolActive) return; // Prevent drawing if text or line tool is active

    const { x, y } = getMousePosition(e);

    let currentColor;
    currentColor=color;
    // Send and render the stroke
    sendStroke({ x, y, color: currentColor, strokeSize, isStart: false, lastX, lastY });
    renderStroke({ x, y, color: currentColor, strokeSize, isStart: false, lastX, lastY });

    // Update the last position
    lastX = x;
    lastY = y;
};

// Stop drawing
const stopDrawing = () => {
    isDrawing = false;
    ctx.closePath(); // Close the path to avoid connecting strokes
};

// Get mouse position
const getMousePosition = (e) => {
    const rect = canvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
    };
};

// Send stroke to the server
const sendStroke = (stroke) => {
    console.log("sending stroke data",stroke) //for debuggin purpose
    ws.send(JSON.stringify({ type: 'draw', stroke }));//stringify the stroke data and send it to the server
};

const sendStrokeLine = (line) => {
    console.log('Sending line data to server:', line);//for debugging purpose
    ws.send(JSON.stringify({ type: 'line', line }));//stringify the line data and send it to the server
};


// Clear canvas
const clearCanvas = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ws.send(JSON.stringify({ type: 'clear' }));
};

// Toggle background between dark and light modes
const toggleBackground = () => {
    document.body.classList.toggle('dark-mode');
};

const toggleTextTool = () => {
    textToolBtn.classList.toggle('active'); // Add or remove the 'active' class
    lineToolBtn.classList.remove('active');// Remove the 'active' class from the line tool button
    isTextToolActive = !isTextToolActive;
    isLineToolActive = false;
    statusElement.textContent = isTextToolActive ? 'Texting Mode' : 'Drawing Mode';

    // Enable or disable text tool
    if (isTextToolActive) {
        canvas.addEventListener('click', addText);
    } else {
        canvas.removeEventListener('click', addText);
    }
};

 // Stores the canvas state for preview

const toggleLineTool = () => {
    isLineToolActive = !isLineToolActive;
    isTextToolActive = false;
    
    statusElement.textContent = isLineToolActive ? 'Line Mode' : 'Drawing Mode';
    lineToolBtn.classList.toggle('active'); // Add or remove the 'active' class
    textToolBtn.classList.remove('active');

    if (isLineToolActive) {
        canvas.addEventListener('mousedown', startLine);
        canvas.addEventListener('mousemove', previewLine);
        canvas.addEventListener('mouseup', endLine);
    } else {
        canvas.removeEventListener('mousedown', startLine);
        canvas.removeEventListener('mousemove', previewLine);
        canvas.removeEventListener('mouseup', endLine);
    }
};

const startLine = (e) => {
    if (!isLineToolActive) return;
    lineStart = getMousePosition(e);

    // Save the current canvas state for previewing
    savedCanvas = ctx.getImageData(0, 0, canvas.width, canvas.height);
};

const previewLine = (e) => {
    if (!isLineToolActive || !lineStart) return;

    const { x, y } = getMousePosition(e);

    // Restore the saved canvas state (removes previous previews)
    ctx.putImageData(savedCanvas, 0, 0);

    // Draw the preview line
    ctx.beginPath();
    ctx.moveTo(lineStart.x, lineStart.y);
    ctx.lineTo(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = strokeSize;
    ctx.stroke();
    ctx.closePath();
};

const endLine = (e) => {
    if (!isLineToolActive || !lineStart) return;

    const { x, y } = getMousePosition(e);

    ctx.putImageData(savedCanvas, 0, 0);

    // Draw the solid line
    ctx.beginPath();
    ctx.moveTo(lineStart.x, lineStart.y);
    ctx.lineTo(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = strokeSize;
    ctx.setLineDash([]); // Solid line
    ctx.stroke();
    ctx.closePath();

    // Send the final line data to WebSocket as a single object
    sendStrokeLine({
        x: lineStart.x,
        y: lineStart.y,
        lastX: x,
        lastY: y,
        color,
        strokeSize,
    });

    lineStart = null;
};


// Change stroke size
const changeStrokeSize = (e) => {
    strokeSize = e.target.value;
};

// Add text to the canvas
const addText = (e) => {
    if (!isTextToolActive) return;
    const { x, y } = getMousePosition(e);
    const text = prompt('Enter text:');
    if (text) {
        ctx.fillStyle = color;
        ctx.font = '20px Arial';
        ctx.fillText(text, x, y);
        ws.send(JSON.stringify({ type: 'text', text, x, y, color }));
    }
};

// Save drawing as an image
const saveDrawing = () => {
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'drawing.png';
    link.click();
};

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

// Render a stroke
const renderStroke = ({ x, y, color, strokeSize, isStart, lastX, lastY }) => {
    console.log('Rendering stroke:', { x, y, lastX, lastY, color, strokeSize });
    ctx.strokeStyle = color;
    ctx.lineWidth = strokeSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (isStart) {
        ctx.beginPath();
        ctx.moveTo(x, y);
    } else {
        if (lastX !== undefined && lastY !== undefined) {
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(x, y);
            ctx.stroke();
            ctx.closePath();
        }
    }
};


// Render text
const renderText = (x, y, value, color) => {
    ctx.fillStyle = color;
    ctx.font = '20px Arial';
    ctx.fillText(value, x, y);
};

// Start the timer
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

// Pad single digit numbers with a leading zero
const pad = (number) => {
    return number.toString().padStart(2, '0');
};

// Initialize the canvas
initCanvas();

//when connections first established
ws.onopen = () => {
    username = prompt('Enter your name:'); // Ask for the name
    ws.send(JSON.stringify({ type: 'username', username })); // Send the username to the server
    console.log('WebSocket connection opened');
    console.log(username)
    startTimer();
};

// Update the client list
const updateClientList = (clients) => {
    const clientListElement = document.getElementById('clientList');
    const clientListHeading = document.getElementById('clientListHeading');
    clientListHeading.textContent = `Active Clients (${clients.length})`;
    clientListElement.innerHTML = ''; // Clear the existing list

    clients.forEach((client) => {
        const clientItem = document.createElement('li');
        clientItem.style.display = 'flex';
        clientItem.style.alignItems = 'center';

        // Display a colored circle next to the client name
        const colorCircle = document.createElement('span');
        colorCircle.style.width = '10px';
        colorCircle.style.height = '10px';
        colorCircle.style.borderRadius = '50%';
        colorCircle.style.border = '1px solid';
        colorCircle.style.backgroundColor = 'green';
        colorCircle.style.marginRight = '5px';

        clientItem.appendChild(colorCircle);
        clientItem.appendChild(document.createTextNode(client));
        clientItem.style.color = 'white';
        clientListElement.appendChild(clientItem);
    });
};