var net = require('net');

var client = net.connect({
  host: 'ec2-18-221-58-190.us-east-2.compute.amazonaws.com',
  port: '4000',
});

client.pipe(process.stdout);
process.stdin.pipe(client);