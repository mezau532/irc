var net = require('net');

var client = net.connect({
    host: 'ec2-18-221-58-190.us-east-2.compute.amazonaws.com',
    port: '4000',
});

client.on('close', () => {
    console.log('server closed connection\r\n');
    process.exit();
});
client.pipe(process.stdout);
process.stdin.pipe(client);