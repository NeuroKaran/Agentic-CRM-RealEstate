import { createServer } from 'http';
import { initializeSocketServer } from './services/socket-server';

const PORT = 3002;
const httpServer = createServer((req, res) => {
    res.writeHead(200);
    res.end('Socket Server Running');
});

initializeSocketServer(httpServer);

httpServer.listen(PORT, () => {
    console.log(`Socket.IO server running on port ${PORT}`);
});
