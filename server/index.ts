import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

import path from 'path';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../../client/dist')));

// Fallback to React Router / index.html
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});

let rooms: Record<string, { players: string[], state: any }> = {};

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('joinRoom', (roomId) => {
        if (!rooms[roomId]) {
            rooms[roomId] = { players: [], state: {} };
        }

        if (rooms[roomId].players.length < 2) {
            rooms[roomId].players.push(socket.id);
            socket.join(roomId);
            console.log(`User ${socket.id} joined room ${roomId}`);

            if (rooms[roomId].players.length === 2) {
                io.to(roomId).emit('gameStart', { roomId });
            }
        }
    });

    socket.on('submitAction', ({ roomId, action }) => {
        // Simple turn sync logic placeholder
        socket.to(roomId).emit('opponentAction', action);
    });

    socket.on('buyPowerUp', ({ roomId, itemId, permanent }) => {
        socket.to(roomId).emit('opponentBoughtPowerUp', { itemId, permanent });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
