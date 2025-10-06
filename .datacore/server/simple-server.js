// .datacore/server/simple-server.js

const http = require('http');

const HOST = '127.0.0.1'; // Only listen on the local machine for security
const PORT = 8000;      // The port our server will run on

// Create the server instance
const server = http.createServer((req, res) => {
  // Set the response headers
  res.setHeader('Content-Type', 'application/json');
  res.writeHead(200);

  // This is the JSON data we will send back to any request
  const responseData = {
    status: 'online',
    message: 'Hello from the Datacore-launched server!',
    timestamp: new Date().toISOString()
  };

  // Send the JSON response and end the connection
  res.end(JSON.stringify(responseData));
});

// Start listening for connections
server.listen(PORT, HOST, () => {
  // This console log is important! Our component will display it.
  console.log(`Node.js server started. Listening on http://${HOST}:${PORT}`);
});

// Graceful shutdown logic (optional but good practice)
process.on('SIGINT', () => {
  console.log('Server shutting down...');
  server.close(() => {
    process.exit(0);
  });
});