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
    socket.on('join_room', (roomName, done) => {
        console.log(roomName);
        socket.join(roomName);
        done();

        socket.to(roomName).emit('welcome');
    });
});

httpServer.listen(3000, () => console.log('Listening on http://localhost:3000'));
