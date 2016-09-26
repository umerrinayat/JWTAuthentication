
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var morgan = require('morgan');

var jwt = require('jsonwebtoken');
var config = require('./config');
var User = require('./app/models/user');


var port = process.env.PORT || 8080;

mongoose.connect(config.database, function(){
    console.log('Database is connected');
});
app.set('superSecret', config.secret);


app.use(bodyParser.urlencoded({ extended: false}));
app.use(bodyParser.json());
app.use(morgan('dev'));


app.get('/', function(req, res){
    res.send('Hello! The API is at http://localhost:'+ port + '/api');
});

app.get('/setup', function(req, res){
    
    // This
    var nick = new User({
        name: 'Umer Inayat',
        password: '12345',
        admin: true
    });

    nick.save(function(err){
        if(err) throw err;

        console.log('User save successfully');
        res.json({ success: true });
    });
});




var apiRoutes = express.Router();




// This route is for first time token generation

apiRoutes.post('/authenticate', function(req, res){
    User.findOne({
        name: req.body.name
    }, function(err, user){

        if(err) throw err;
        
        if(!user){
            res.json({ success: false, message: 'Authentication failed, No User Found in database'});
        }else if(user){
            console.log(user.name);
            if(user.password != req.body.password){
                console.log('database user ' + user.name);
                console.log('user          ' + req.body.password);
                res.json({ success: false, message: 'Authentication failed, Password is not correct'});
            }else{

                var token = jwt.sign(user, app.get('superSecret'), {
                    expiresIn : '1440m'
                });

                res.json({
                    success: true,
                    message: 'Enjoy your token',
                    token: token
                });
            }
        }
    });
});


//This route is to make sure token is correct

apiRoutes.use(function(req, res, next){

    var token = req.body.token ||req.query.token || req.headers['x-access-token'];
    console.log(token);
    if(token){
        jwt.verify(token, app.get('superSecret'), function(err, decoded){
            if(err){
                res.json({
                    success: false,
                    message: 'Failed to authenticate token'
                });
            }else{
                console.log('Token is verified');
                req.decoded = decoded;
                next();
            }
        });
    }else{
        return res.status(403).send({
            success: false,
            message: 'No token is provided'
        });
    }
});



apiRoutes.get('/', function(req, res){
    res.json({ message: 'Welcome to collest api on the earth'});
});



apiRoutes.get('/users', function(req, res){
    User.find({}, function(err, users){
        res.json(users);
    });
});


app.use('/api', apiRoutes);















app.listen(port);
console.log('Magic happen at localhost:'+ port);