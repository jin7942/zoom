import http from 'http';
import { Server } from 'socket.io';
import express from 'express';
import { join, resolve } from 'path';

const app = express();
const __dirname = resolve();

app.set('view engine', 'pug');
app.set('views', __dirname + '/src/views');
app.use('/public', express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.render('home');
});
app.get('/*', (req, res) => {
    res.redirect('/');
});

const httpServer = http.createServer(app);
const wsServer = new Server(httpServer);

wsServer.on('connection', (socket) => {
    socket.on('join_room', (roomName) => {
        socket.join(roomName);
        socket.to(roomName).emit('welcome');
    });

    socket.on('offer', (offer, roomName) => {
        socket.to(roomName).emit('offer', offer);
    });

    socket.on('answer', (answer, roomName) => {
        socket.to(roomName).emit('answer', answer);
    });

    socket.on('ice', (ice, roomName) => {
        socket.to(roomName).emit('ice', ice);
    });
});

httpServer.listen(80, () => console.log('server start'));
