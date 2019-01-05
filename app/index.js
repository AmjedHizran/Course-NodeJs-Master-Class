// Dependencies
var http = require('http');
var https = require('https');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./config');
var fs = require('fs');

// Instantiate the HTTP server
httpServer = http.createServer(function(req,res){
    unifiedServer(req,res);
});

// Start the HTTP server
httpServer.listen(config.httpPort,function(){
    console.log("The server is listening on port " + config.httpPort);
});

 // Instantiate the HTTPS server
 httpsServerOptions = {
    'key': fs.readFileSync('./https/key.pem'),
    'cert': fs.readFileSync('./https/cert.pem')
  };
  httpsServer = https.createServer(httpsServerOptions,function(req,res){
   unifiedServer(req,res);
  });

// Start the HTTPS server
httpsServer.listen(config.httpsPort,function(){
    console.log("The server is listening on port " + config.httpsPort);
});

// All the server logic for both the http and https server
unifiedServer = function(req,res){

    // Get the URL and parse it
    var parsedUrl = url.parse(req.url,true);
    
    // Get the path
    var path = parsedUrl.pathname; 
    var trimmedPath = path.replace(/^\/+|\/+$/g,'');
    
    // Get the query string as an object
    var queryStringObject = parsedUrl.query;
    
    // Get the HTTP Method
    var method = req.method.toLowerCase();
    
    // Get the headers as an object
    var headers = req.headers;
    
    // Get the payload, if any
    var decoder = new StringDecoder('utf-8');
    var buffer = '';
    req.on('data',function(data){
        buffer += decoder.write(data);
    });
    req.on('end',function(data){
        buffer += decoder.end();
    
        // Choose the handler this request should go to, if one is not found, use the notFound handler
        var chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;
    
        // Construct the data object to send to the handler
        var data = {
            'trimmedPath' : trimmedPath,
            'queryStringObject' : queryStringObject,
            'method' : method,
            'headers' : headers,
            'payload' : buffer
        };

    // Route the request to the handler specified in the router
    chosenHandler(data,function(statusCode,payload){
        // Use the status code called back by the handler, or default to 200
        statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
        
        // Use the payload called back by the handler, or default to an empty object
        payload = typeof(payload) == 'object' ? payload : {};

        // Convert the payload to a string
        var payloadString = JSON.stringify(payload);

        // Return the response
        res.setHeader('Content-Type','application/json');
        res.writeHead(statusCode);
        res.end(payloadString);
        console.log('Returning this response: ' + statusCode);
        });
    });
};

// Define the handlers
var handlers = {};

// ping handler
handlers.ping = function(data,callback){
    callback(200);
};

// Not found handler
handlers.notFound = function(data,callback){
    callback(404);
};

var router = {
    'ping' : handlers.ping
};