import http from 'http';
import SocketIo from 'socket.io';
import express from 'express';

const app = express();

app.set('view engine', 'pug');
app.set('views', __dirname + '/views');
app.use('/public', express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.render('home');
});
app.get('/*', (req, res) => {
    res.redirect('/');
});

const httpServer = http.createServer(app);
const wsServer = SocketIo(httpServer);

wsServer.on('connection', (socket) => {
    socket['nickname'] = 'Anon';

    socket.onAny((e) => {
        console.log('Socket Event : ' + e);
    });

    socket.on('enter_room', (roomName, nickname, done) => {
        socket['nickname'] = nickname;
        socket.join(roomName);
        socket.to(roomName).emit('welcome', socket.nickname);
        done();
    });

    socket.on('new_message', (msg, room, done) => {
        socket.to(room).emit('new_message', `${socket.nickname}: ${msg}`);
        done();
    });

    socket.on('nickname', (nickname) => (socket['nickname'] = nickname));

    socket.on('disconnecting', () => {
        socket.rooms.forEach((room) => socket.to(room).emit('bye', socket.nickname));
    });
});

httpServer.listen(3000, () => console.log('Listening on http://localhost:3000'));
