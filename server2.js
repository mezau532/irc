const net = require('net');

let clients = {}
let rooms = {};
//Stores the number of active clients
let clientCount = 0;

const server = net.createServer((connection) => {
    let clientName = null;
    let room = null;
    let command = null;

    function broadcast( msg ){
        for( let client in clients ){
          if( clients[client] !== connection ){
            clients[client].write(msg);
          }
        }
    }

    console.log('client connected');
    clientCount += 1;
    console.log(`${clientCount} clients connected`)

    connection.write(`Please user command: [POST USERNAME: <username>]\r\n`);
    connection.setEncoding('utf-8');
    connection.on('data', data => {
        command = data.replace('\r\n', '');
        console.log(`client data: ${command}`);
        if (clientName == null) {
            if (command.includes('POST USERNAME: ')) {
                clientName = command.replace('POST USERNAME: ', '');
                clients[clientName] = connection;
                connection.write(` - Welcome to the IRC, There are ${clientCount} active users\r\n`);
                broadcast(` - ${clientName} has joined the room\r\n`);
                command = null;
            }
            else {
                connection.write(`Please user command: [POST USERNAME: <username>]\r\n`);
            }
        }
        else {
            if (command.includes('POST USERNAME: ')) {
                clientName = command.replace('POST USERNAME: ', '');
                clients[clientName] = connection;
                connection.write(` - Welcome to the Chatbox, There are ${clientCount} active users\r\n`);
                broadcast(` - ${clientName} has joined the room\r\n`);
                command = null;
            }
            broadcast(`${clientName} - ${command}\r\n`);
        }
        
    });

    connection.on('close', () => {
        clientCount -= 1;
        console.log('client disconnected');
        broadcast(`${clientName} disconnected\r\n`);
        delete clients[clientName];
        console.log(`${clientCount} clients connected`);
    });

    connection.on('error', (error) => {
        console.log(`Error : ${error}`);
    });

//    connection.pipe(connection);
});

server.listen(4000, () => console.log('server listening'));