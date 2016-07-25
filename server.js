/**Load modules**/
var express			= require('express');
var app				= express();
var http			= require('http').Server(app);
var port			= process.env.PORT || 8080;
var passport		= require('passport');
var flash			= require('connect-flash');
var morgan			= require('morgan');
var cookieParser	= require('cookie-parser');
var bodyParser		= require('body-parser');
var session			= require('express-session');
var configDB		= require('./config/database.js');
var error_handler	= require('./app/error_handler.js');

/**Global variables**/
GLOBAL.mongoose		= require('mongoose');
GLOBAL.gameSocket	= require('./app/gameSocket.js');
GLOBAL.io			= require('socket.io')(http);

/**Confi Settings**/
mongoose.connect(configDB.url);
require('./config/passport')(passport);

/**Express Settings**/
app.use(express.static('public'));
app.use(morgan('dev'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(session({ secret: 'LifeOfPi'}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

require('./app/routes.js')(app, passport);

/**Start http server**/
http.listen(port, function(){
	console.log('Magic happens at ' + port);
});


//SOCKET METHODS
io.on('connection', function(user){
	user.on('loggedIn', function(data){
		gameSocket.onConnect(user, data);
	});
	user.on('game', function(data){
		gameSocket.game(user, data);
	});
	user.on('startGame', function(data){
		gameSocket.startGame(user, data);
	});
	user.on('iPlayed', function(data){
		gameSocket.userPlayed(user, data);
	});
	user.on('gameStop', function(data){
		gameSocket.gameStopped(user, data);
	});
	user.on('quitGame', function(data){
		gameSocket.quitGame(user, data);
	});
	user.on('destroyGame', function(data){
		gameSocket.destroyGame(user, data);
	});
	user.on('disconnect', function(){
		gameSocket.onDisconnect(user);
	});
});

console.log = function(msg){

};

//Error handling
process.on('uncaughtException', function(err) {
  error_handler.saveError(err);
});

