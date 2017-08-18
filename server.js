"use strict";
var mongoose = require('mongoose');
var passport = require('passport');
require('./models/Records');
require('./models/Comments');
require('./models/User');
require('./config/passport');
mongoose.connect('mongodb://test:test@ds056559.mlab.com:56559/thinkster');

var bodyParser = require('body-parser');

// init project
var express = require('express');
var app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());


// we've started you off with Express, 
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// Authentication
app.use(passport.initialize());

app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

var routes = require('./routes/index');
app.use('/',routes);  

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
 