// Global variables
let ws = null;
let isSenderMode = true;
let username = '';
let wsServer = null;
let connectedClients = new Set();

// Elements
const statusBadge = document.querySelector('.status-badge');
const connectBtn = document.getElementById('connect-btn');
const disconnectBtn = document.getElementById('disconnect-btn');
const toggleModeBtn = document.getElementById('toggle-mode-btn');
const nameInput = document.getElementById('name');
const targetInput = document.getElementById('target');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const messagesContainer = document.getElementById('messages');
const modeDisplay = document.getElementById('mode-display');
const localAddressDisplay = document.getElementById('local-address');
const remoteAddressDisplay = document.getElementById('remote-address');

// Event Listeners
connectBtn.addEventListener('click', handleConnection);
disconnectBtn.addEventListener('click', handleDisconnection);
toggleModeBtn.addEventListener('click', toggleMode);
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Initialize the application
function init() {
    updateUIForMode();
    
    // Set default target for easier testing
    if (isSenderMode) {
        targetInput.value = 'ws://localhost:8080';
    }
}

// Toggle between sender and receiver modes
function toggleMode() {
    // If connected, disconnect first
    if (ws) {
        handleDisconnection();
    }
    
    // If server is running, stop it
    if (wsServer) {
        stopWebSocketServer();
    }
    
    isSenderMode = !isSenderMode;
    updateUIForMode();
}

// Update UI based on current mode
function updateUIForMode() {
    if (isSenderMode) {
        modeDisplay.textContent = 'Sender';
        toggleModeBtn.textContent = 'Switch to Receiver Mode';
        targetInput.disabled = false;
        targetInput.placeholder = 'Enter target IP or address';
    } else {
        modeDisplay.textContent = 'Receiver';
        toggleModeBtn.textContent = 'Switch to Sender Mode';
        targetInput.value = 'ws://localhost:8080';
        targetInput.disabled = true;
    }
}

// Handle connection button click
function handleConnection() {
    username = nameInput.value.trim();
    
    if (!username) {
        addSystemMessage('Please enter your name before connecting.');
        return;
    }
    
    if (isSenderMode) {
        connectAsClient();
    } else {
        startWebSocketServer();
    }
}

// Connect as a WebSocket client (sender mode)
function connectAsClient() {
    const targetAddress = targetInput.value.trim();
    
    if (!targetAddress) {
        addSystemMessage('Please enter a target address.');
        return;
    }
    
    try {
        addSystemMessage(`Connecting to ${targetAddress}...`);
        
        ws = new WebSocket(targetAddress);
        
        ws.onopen = () => {
            setConnectedState(true);
            addSystemMessage('Connected successfully!');
            
            // Send user information
            const initData = {
                type: 'init',
                name: username
            };
            ws.send(JSON.stringify(initData));
            
            // Update connection details
            localAddressDisplay.textContent = 'Client';
            remoteAddressDisplay.textContent = targetAddress;
        };
        
        ws.onmessage = (event) => {
            handleIncomingMessage(event.data);
        };
        
        ws.onclose = () => {
            setConnectedState(false);
            addSystemMessage('Connection closed.');
            clearConnectionDetails();
        };
        
        ws.onerror = (error) => {
            addSystemMessage('Connection error. Please check the target address.');
            console.error('WebSocket error:', error);
            setConnectedState(false);
        };
    } catch (error) {
        addSystemMessage(`Failed to connect: ${error.message}`);
        console.error('Connection error:', error);
    }
}

// Start WebSocket server (receiver mode)
function startWebSocketServer() {
    if (!window.WebSocket) {
        addSystemMessage('Your browser does not support WebSockets.');
        return;
    }

    // Simulate WebSocket server with WebSockets
    addSystemMessage('Starting receiver mode at ws://localhost:8080');
    addSystemMessage('Waiting for incoming connections...');
    
    try {
        // In a real scenario, this would be a separate server file.
        // For demo purposes, we're using a client-side WebSocket
        ws = new WebSocket('ws://localhost:8080');
        
        ws.onopen = () => {
            setConnectedState(true);
            addSystemMessage('Receiver mode active!');
            
            // Send identity as server
            const initData = {
                type: 'init',
                name: username,
                isServer: true
            };
            ws.send(JSON.stringify(initData));
            
            // Update connection details
            localAddressDisplay.textContent = 'localhost:8080';
            remoteAddressDisplay.textContent = 'Listening...';
        };
        
        ws.onmessage = (event) => {
            handleIncomingMessage(event.data);
        };
        
        ws.onclose = () => {
            setConnectedState(false);
            addSystemMessage('Receiver mode stopped.');
            clearConnectionDetails();
        };
        
        ws.onerror = (error) => {
            // This is expected if no server is running
            addSystemMessage(`
                No server detected at localhost:8080.
                Please setup a WebSocket server or use a service like <a href="https://websocketking.com" target="_blank">WebSocket King</a> for testing.
            `);
            console.log('Expected error in receiver mode:', error);
        };
    } catch (error) {
        addSystemMessage(`Failed to start receiver mode: ${error.message}`);
        console.error('Receiver mode error:', error);
    }
}

// Stop WebSocket server
function stopWebSocketServer() {
    if (wsServer) {
        addSystemMessage('Stopping receiver mode...');
        wsServer = null;
    }
}

// Handle disconnection button click
function handleDisconnection() {
    if (ws) {
        ws.close();
        ws = null;
    }
    
    setConnectedState(false);
}

// Send a message
function sendMessage() {
    if (!ws) {
        addSystemMessage('Not connected. Please connect first.');
        return;
    }
    
    const message = messageInput.value.trim();
    if (!message) return;
    
    try {
        const messageData = {
            type: 'message',
            content: message,
            sender: username,
            timestamp: new Date().toISOString()
        };
        
        ws.send(JSON.stringify(messageData));
        addMessageToChat(messageData, true);
        messageInput.value = '';
    } catch (error) {
        addSystemMessage(`Failed to send message: ${error.message}`);
        console.error('Send error:', error);
    }
}

// Handle incoming messages
function handleIncomingMessage(data) {
    try {
        const messageData = JSON.parse(data);
        
        switch (messageData.type) {
            case 'init':
                // Handle connection initialization
                addSystemMessage(`${messageData.name} has joined the chat.`);
                if (messageData.isServer) {
                    remoteAddressDisplay.textContent = `${messageData.name} (Server)`;
                } else {
                    remoteAddressDisplay.textContent = `${messageData.name} (Client)`;
                }
                break;
                
            case 'message':
                // Handle chat message
                addMessageToChat(messageData, false);
                break;
                
            default:
                console.log('Unknown message type:', messageData);
        }
    } catch (error) {
        console.error('Error handling incoming message:', error, data);
    }
}

// Add a message to the chat
function addMessageToChat(messageData, isSent) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${isSent ? 'sent' : 'received'}`;
    
    const senderElement = document.createElement('div');
    senderElement.className = 'sender';
    senderElement.textContent = messageData.sender;
    
    const contentElement = document.createElement('div');
    contentElement.className = 'content';
    contentElement.textContent = messageData.content;
    
    const timestampElement = document.createElement('div');
    timestampElement.className = 'timestamp';
    timestampElement.textContent = formatTimestamp(messageData.timestamp);
    
    messageElement.appendChild(senderElement);
    messageElement.appendChild(contentElement);
    messageElement.appendChild(timestampElement);
    
    messagesContainer.appendChild(messageElement);
    scrollToBottom();
}

// Add a system message
function addSystemMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'system-message';
    messageElement.innerHTML = message;
    
    messagesContainer.appendChild(messageElement);
    scrollToBottom();
}

// Set the UI state based on connection status
function setConnectedState(isConnected) {
    if (isConnected) {
        statusBadge.classList.remove('disconnected');
        statusBadge.classList.add('connected');
        statusBadge.textContent = 'Connected';
        
        connectBtn.disabled = true;
        disconnectBtn.disabled = false;
        messageInput.disabled = false;
        sendBtn.disabled = false;
        toggleModeBtn.disabled = true;
        nameInput.disabled = true;
        targetInput.disabled = true;
    } else {
        statusBadge.classList.remove('connected');
        statusBadge.classList.add('disconnected');
        statusBadge.textContent = 'Disconnected';
        
        connectBtn.disabled = false;
        disconnectBtn.disabled = true;
        messageInput.disabled = true;
        sendBtn.disabled = true;
        toggleModeBtn.disabled = false;
        nameInput.disabled = false;
        targetInput.disabled = isSenderMode ? false : true;
    }
}

// Clear connection details
function clearConnectionDetails() {
    localAddressDisplay.textContent = 'Not connected';
    remoteAddressDisplay.textContent = 'Not connected';
}

// Format timestamp for display
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Scroll messages container to bottom
function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);
