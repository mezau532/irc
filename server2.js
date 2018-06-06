const net = require('net');

var clients = {}
var rooms = {};
//Stores the number of active clients
var clientCount = 0;

const server = net.createServer((connection) => {
    var clientName = null;
    var room = null;
    var command = null;

    function broadcast( msg ){
        if (room === null) {
            connection.write('Please join a room first: [JOIN ROOM: <room>]\r\n');
            return;
        }
        for( let r in rooms ){
            if( r === room ){
                for ( let client in rooms[r] ){
                    if(rooms[r][client] != connection){
                        rooms[r][client].write(msg);
                    } 
                }

            }
        }
    }

    console.log('client connected');
    clientCount += 1;
    console.log(`${clientCount} clients connected`)

    connection.write(`Please user command: [POST USERNAME: <username>]\r\n`);
    connection.setEncoding('utf-8');
    connection.on('data', data => {
        command = data.replace('\n', '');
        console.log(`client data: ${command}`);
        if (clientName == null) {
            if (command.includes('POST USERNAME: ')) {
                clientName = command.replace('POST USERNAME: ', '');
                if (Object.keys(clients).includes(clientName)) {
                    connection.write(`${clientName} is taken please choose another name\r\n`);
                    clientName = null;
                    command = null;
                    return;
                }
                clients[clientName] = connection;
                connection.write(` - Welcome! , There are ${clientCount} active users\r\n`);
              //  broadcast(` - ${clientName} has joined the room\r\n`);
                command = null;
            }
            else {
                connection.write(`Please user command: [POST USERNAME: <username>]\r\n`);
            }
        }
        else {
            if (command.includes('PUT USERNAME: ')) {
                delete clients[clientName];
                clientName = command.replace('PUT USERNAME: ', '');
                clients[clientName] = connection;
                if (room != null && rooms[room] != null) {
                    delete rooms[room][clientName];
                }
                connection.write(`Username changed to ${clientName}\r\n`);
                command = null;
            } else if (command.includes('POST ROOM: ')) {
                room = command.replace('POST ROOM: ', '');
                rooms[room] = [];
                connection.write(`Created room ${room}\r\n`);
                command = null;
                room = null;
            } else if (command.includes('GET ROOMS')) {
                var roomList = Object.keys(rooms);
                if (roomList.length == 0) {
                    connection.write('no rooms :(\r\n');
                    command = null;
                    return;
                }
                connection.write(`${roomList}\r\n`);
                command = null;
            } else if (command.includes('JOIN ROOM: ')) {
                room = command.replace('JOIN ROOM: ', '');
                var roomsList = Object.keys(rooms);
                if (!roomsList.includes(room)) {
                    connection.write(`no room ${room}\r\n`);
                } else {
                    rooms[room][clientName] = connection;
                    var roomClientsCount = Object.keys(rooms[room]).length;
                    connection.write(` - Welcome to ${room}! , There are ${roomClientsCount} users in this room\r\n`);
                    broadcast(`${clientName} joined the room\r\n`);
                }
            } else if (command.includes('LEAVE ROOM')) {
                if (room != null && rooms[room] != null) {
                    delete rooms[room][clientName];
                    broadcast(`${clientName} left the room\r\n`);
                    room = null;
                }
            } else if (command.includes('POST MESSAGE: ')) {
                var msg = command.replace('POST MESSAGE: ', '');
                var time = new Date(Date.now());
                broadcast(`[${time}] ${clientName} - ${msg}\r\n`);
            } else if (command.includes('GET USERS: ')){
                var checkRoom = command.replace('GET USERS: ', '');
                if (rooms[checkRoom] != null) {
                    connection.write(`${Object.keys(rooms[checkRoom])}\r\n`);
                    command = null;
                } else {
                    connection.write(`${checkRoom} room does not exist`);
                }
            } else {
                connection.write('invalid command\r\n');
                command = null;
            }
        }
        
    });

    connection.on('close', () => {
        clientCount -= 1;
        console.log('client disconnected');
        broadcast(`${clientName} disconnected\r\n`);
        delete clients[clientName];
        if (room != null && rooms[room != null]) {
            delete rooms[room][clientName];
        }
        console.log(`${clientCount} clients connected`);
    });

    connection.on('error', (error) => {
        console.log(`Error : ${error}`);
    });

//    connection.pipe(connection);
});

server.listen(4000, () => console.log('server listening'));