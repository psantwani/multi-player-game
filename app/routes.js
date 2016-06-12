module.exports = function(app, passport) {

    app.get('/', function(req, res) {
        res.render('index.ejs');
    });

    app.get('/profile', isLoggedIn, function(req, res) {
        res.render('profile.ejs', {
            user : req.user
        });
    });

    app.get('/feed', isLoggedIn, function(req, res){
        res.render('feed.ejs', {
            user : req.user
        });
    });

    app.get('/game', isLoggedIn, function(req, res){
        res.render('game.ejs',{
            gameId : req.query['game'],
            playerId : req.query['player']
        });
    });

    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

    app.get('/login', function(req, res) {
        res.render('login.ejs', { message: req.flash('loginMessage') });
    });

    app.post('/login', passport.authenticate('login', {
        successRedirect : '/feed',
        failureRedirect : '/login',
        failureFlash : true
    }));

    app.get('/signup', function(req, res) {
        res.render('signup.ejs', { message: req.flash('signupMessage') });
    });

    app.post('/signup', passport.authenticate('signup', {
        successRedirect : '/feed',
        failureRedirect : '/signup',
        failureFlash : true
    }));
    

    app.get('/connect/local', function(req, res) {
        res.render('connect-local.ejs', { message: req.flash('loginMessage') });
    });
    app.post('/connect/local', passport.authenticate('signup', {
        successRedirect : '/profile',
        failureRedirect : '/connect/local',
        failureFlash : true
    }));

    app.get('/getFeed', function(req, res){
        gameSocket.getFeed(function(data){
            res.send(data);
        });
    });

};

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();
    res.redirect('/');
}
