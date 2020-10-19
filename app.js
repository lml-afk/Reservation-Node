const express = require('express');
const body_parser = require('body-parser');
const mongoose = require('mongoose');
const app = express();
require('dotenv').config();
const {MongoClient} = require('mongodb');
const PORT = process.env.PORT || 8080;

const mongoose_url = process.env.mongoose_url;

app.use(body_parser.json());

app.use(body_parser.urlencoded({
    extended: true
}));

const user_model = require('./models/user_model');
const reservation_model = require('./models/reservation_model');

app.post('/reservations/register',function (req, res) {
    const user_name = req.body.user_name;
    const user_password = req.body.user_password;

    console.log(req.body);

    user_model.findOne({
        name: user_name
    }).then((user) => {
        if (user) {
            console.log('Username already registered');
            res.json('User already exists');
        }
        let new_user = new user_model({
            //set name to lower case for easier queries later
            name: user_name.toLowerCase(),
            password: user_password,
            reservations: []
        });
        new_user.save().then(() => {
            console.log('user added');
            res.json(new_user);   
        });
    });
});


app.post('/reservations/reservation',function (req, res){

    const user_name = req.body.user_name;
    const eventname =  req.body.eventname;
    const start_time = req.body.start_time;
    
    //set +1 hours to end_time
    const end_time = new Date(start_time);
    end_time.setHours(end_time.getHours() +1);

    user_model.findOne({
        name: user_name
    }).then((user)=>{
        if(!user){
            res.json('No such user');
        }
        let new_reservation = new reservation_model({
            eventname: eventname.toLowerCase(),
            start_time: new Date(start_time),
            end_time: new Date(end_time)
        });
        new_reservation.save().then(()=>{
            user.reservations.push(new_reservation);
            user.save().then(() =>{
                res.json(new_reservation);
            })
        })
    })
})

app.get('/reservations/user',function (req, res){
        const user_name = req.body.user_name;

        user_model.findOne({name: user_name}).populate('reservations').exec(function (err,user){
         
            if (err){
                console.log(err)
                res.json(err)
            } else {
                if (user === null)
                res.json('No such user');
                else
                    res.json(user.reservations)
            }
        })
});

/*
app.get('/reservations/all_reservations', async function(req,res){
      
    
	const client = new MongoClient(mongoose_url, {
		useUnifiedTopology: true,
		useNewUrlParser: true,
    });

    try {
        await client.connect();
    
    }catch(err){
        console.log(err);
        res.json(err)
    }
   
})
*/

app.get('/reservations/all_reservations', async function(req,res){
      
    MongoClient.connect(mongoose_url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("test");
        dbo.collection("reservations").find({}).toArray(function(err, result) {
            if (err) throw err;
            console.log(result);
            res.json(result);
        });
      }); 
})



mongoose.connect(mongoose_url, {
    useUnifiedTopology: true,
    useNewUrlParser: true
}).then(() => {
    console.log('Mongoose connected');
    console.log('Start Express server');
    console.log('Server running on port:'+PORT);
    app.listen(PORT);
});


