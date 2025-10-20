const express = require('express');
const http = require('http');
const socketio = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const PORT = process.env.PORT || 3000;

// Host frontend files
// Note: Assumes frontend is in a folder named 'public' one level above the server directory.
app.use(express.static('../public'));

// --- Simple Room State Management ---
let users = {}; // Key: socket.id, Value: { name, isReady, avatar, city, ... }
let countdownInterval = null;
const COUNTDOWN_SECONDS = 60;

// --- WebSocket Connection Handling ---
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // 1. Handle User Join and Info Exchange
    socket.on('joinRoom', (userData) => {
        // Limit room size to 2 users
        if (Object.keys(users).length >= 2 && !users[socket.id]) {
            socket.emit('error', 'Room is full. Please try again later.');
            socket.disconnect();
            return;
        }

    // Assign a role to the joining client: first = player1, second = player2
    const existingRoles = Object.values(users).map(u => u.role).filter(Boolean);
    let assignedRole = 'player1';
    if (existingRoles.includes('player1') && !existingRoles.includes('player2')) assignedRole = 'player2';
    // Store current user info
    users[socket.id] = { id: socket.id, isReady: false, role: assignedRole, ...userData };
    const currentUser = users[socket.id];
    // send assigned role to client
    socket.emit('role', assignedRole);
        
        // Find the partner's ID (the only other user)
        const partnerId = Object.keys(users).find(id => id !== socket.id);

        if (partnerId) {
            const partner = users[partnerId];
            
            // A. [B -> A] Notify the existing user (Partner) about the new user (Current)
            socket.to(partnerId).emit('partnerInfo', currentUser);
            
            // B. [A -> B] Notify the new user (Current) about the existing user (Partner)
            socket.emit('partnerInfo', partner); 

            // C. If the partner is already 'Ready', notify the new user of that status
            if (partner.isReady) {
                socket.emit('partnerReadyUpdate', partner);
            }
        }
        console.log(`User ${currentUser.name} joined. Total users: ${Object.keys(users).length}`);
    });

    // 2. Handle Ready Signal (Coordination for starting the session)
    socket.on('clientReady', (data) => {
        if (!users[socket.id]) return;

        users[socket.id].isReady = data.isReady;
        
        // Broadcast my status update to the partner
        socket.broadcast.emit('partnerReadyUpdate', users[socket.id]); 

        // Check if both users are ready
        const allUsers = Object.values(users);
        const bothReady = allUsers.length === 2 && allUsers.every(user => user.isReady);

        if (bothReady) {
            // Broadcast the start signal to both
            io.emit('startGame');
            console.log("BOTH USERS READY. STARTING SESSION.");

            // start a countdown (clear previous if any)
            if (countdownInterval) {
                clearInterval(countdownInterval);
                countdownInterval = null;
            }
            let remaining = COUNTDOWN_SECONDS;
            io.emit('timeLeft', { seconds: remaining });
            countdownInterval = setInterval(() => {
                remaining -= 1;
                if (remaining <= 0) {
                    clearInterval(countdownInterval);
                    countdownInterval = null;
                    io.emit('timeLeft', { seconds: 0 });
                    io.emit('sessionEnd');
                    console.log('Session ended: countdown reached 0');
                } else {
                    io.emit('timeLeft', { seconds: remaining });
                }
            }, 1000);
        }
    });

    // 2.b Handle user profile updates (name/avatar/etc.)
    socket.on('updateUser', (data) => {
        if (!users[socket.id]) return;
        // merge incoming fields into stored user record
        users[socket.id] = { ...users[socket.id], ...data };
        // broadcast updated profile to partner(s)
        socket.broadcast.emit('partnerUpdate', users[socket.id]);
    });

    // 3. Handle Drawing Data
    socket.on('drawing', (data) => {
        // Broadcast the received drawing segment to everyone else (the partner)
        socket.broadcast.emit('drawingData', data);
    });

    // 4. Handle Disconnect
    socket.on('disconnect', () => {
        if (users[socket.id]) {
            const userName = users[socket.id].name;
            delete users[socket.id];
            
            console.log(`User ${userName} disconnected. Remaining users: ${Object.keys(users).length}`);
            
            // Notify the partner that the user has left
            socket.broadcast.emit('userLeft', socket.id);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`请访问: http://localhost:${PORT}`);
});