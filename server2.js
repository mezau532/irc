const net = require('net');

var clients = {}
var rooms = {};
//Stores the number of active clients
var clientCount = 0;

const server = net.createServer((connection) => {
    var clientName = null;
    var userRooms = [];
    var command = null;

    function broadcastDirect( msg, usr){
        var clientNames = Object.keys(clients);
        if (!clientNames.includes(usr)){
            connection.write(`no such user\r\n`);
            return;
        }
        clients[usr].write(`[${usr}] ${msg}`);
    }

    function broadcast( msg, rm ){
        if (userRooms.length === 0) {
            connection.write('Please join a room first: [JOIN ROOM: <room>]\r\n');
            return;
        }
        for( let r in rooms ){
            if( r === rm ){
                for ( let client in rooms[r] ){
                    if(rooms[r][client] != connection){
                        rooms[r][client].write(`[${r}] ${msg}`);
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
            if (command.includes('POST ROOM: ')) {
                const newRoom = command.replace('POST ROOM: ', '');
                rooms[newRoom] = [];
                connection.write(`Created room ${newRoom}\r\n`);
                command = null;
            } else if (command.includes('GET ROOMS')) {
                var roomNames = Object.keys(rooms);
                if (roomNames.length == 0) {
                    connection.write('no rooms :(\r\n');
                    command = null;
                    return;
                }
                connection.write(`${roomNames}\r\n`);
                command = null;
            } else if (command.includes('JOIN ROOM: ')) {
                var room = command.replace('JOIN ROOM: ', '');

                var roomsList = Object.keys(rooms);
                if (!roomsList.includes(room)) {
                    connection.write(`no room ${room}\r\n`);
                } else {
                    rooms[room][clientName] = connection;
                    var roomClientsCount = Object.keys(rooms[room]).length;
                    connection.write(` - Welcome to ${room}! , There are ${roomClientsCount} users in this room\r\n`);
                    userRooms.push(room);
                    broadcast(`${clientName} joined the room\r\n`, room);
                }
            } else if (command.includes('LEAVE ROOM: ')) {
                var room = command.replace('LEAVE ROOM: ', '');
                if (userRooms.includes(room) && rooms[room] != null) {
                    broadcast(`${clientName} left the room\r\n`, room);
                    delete rooms[room][clientName];
                    var index = userRooms.indexOf(room);
                    userRooms.splice(index, 1)
                    command =  null;
                } else {
                    connection.write(`this room doesn't exist or you're not a member\r\n`);
                }

            } else if (command.includes('POST MESSAGE: ')) {
                var payload = command.replace('POST MESSAGE: ', '');
                var commandList = payload.split('#'); 
                var msg = commandList[2];
                var room = commandList[1];
                var time = new Date(Date.now());
                if (!userRooms.includes(room)) {
                    connection.write(`must join [${room}] first\r\n`);
                    command = null;
                    return
                }
                broadcast(`[${time}] ${clientName} - ${msg}\r\n`, room);
            } else if (command.includes('GET USERS: ')){
                var checkRoom = command.replace('GET USERS: ', '');
                if (rooms[checkRoom] != null) {
                    connection.write(`${Object.keys(rooms[checkRoom])}\r\n`);
                    command = null;
                    return;
                } else if ( checkRoom === 'all' ) {
                    connection.write(`${Object.keys(clients)}\r\n`);
                    command = null;
                    return;
                } else {
                    connection.write(`${checkRoom} room does not exist\r\n`);
                }
            } else if (command.includes('GET MY ROOMS')) {
                if (userRooms.length === 0) {
                    connection.write('no rooms :(\r\n');
                    command = null;
                    return;
                }
                connection.write(`${userRooms}`);
                command = null;
            } else if (command.includes('POST DIRECT: ')) {
                var payload = command.replace('POST DIRECT: ');
                var commandList = payload.split('#');
                var msg = commandList[2];
                var toUser = commandList[1];
                var time = new Date(Date.now());
                broadcastDirect(`[${time}] - ${msg}\r\n`, toUser);
                command = null;

            } else if (command.includes('GET HELP')) {
                var options = `POST USERNAME: <username>              add username
POST ROOM: <room>                        create new room <room>
JOIN ROOM: <room>                        join <room>
LEAVE ROOM: <room>                       leave <room>
POST MESSAGE: #<room>#<message>          send <message> to <room>
GET ROOMS                                list all rooms
GET USERS: <room>||<all>                 list users in <room> or <all> users
POST DIRECT: #<username>#<message>       send <message> directly to <username>\r\n`;
                connection.write(options);
            } else {
                connection.write('invalid command\r\n');
                command = null;
            }
        }
        
    });

    connection.on('close', () => {
        clientCount -= 1;
        console.log('client disconnected');
        for ( let room in rooms ) {
            if (userRooms.includes(room)) {
                broadcast(`${clientName} disconnected\r\n`, room);
                delete clients[clientName];
                if (room != null && rooms[room != null]) {
                    delete rooms[room][clientName];
                }
            }
        }
        console.log(`${clientCount} clients connected`);
    });

    connection.on('error', (error) => {
        clientCount -= 1;
        console.log(`Error : ${error}`);
    });

//    connection.pipe(connection);
});

server.listen(4000, () => console.log('server started'));