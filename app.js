const express = require('express');
const body_parser = require('body-parser');
const mongoose = require('mongoose');
const app = express();
require('dotenv').config();
const {MongoClient} = require('mongodb');
const url = require('url');
const PORT = process.env.PORT || 8080;

//get mongoose url from .env file
const mongoose_url = process.env.mongoose_url;

app.use(body_parser.json());
app.use(body_parser.urlencoded({
    extended: true
}));

            //models
const user_model = require('./models/user_model');
const reservation_model = require('./models/reservation_model');

            //registration get
app.get('/reservations/register', function(req,res){
    const html = '<form action="/reservations/register" method="POST">'+
    'Enter username:' + 
    '<input type="text" name="user_name" id="user_name"/>'+
    "Enter age: " +
    '<input type="text" name="age" id="age"/>' +
    '<br>' +
    '<button type="submit">submit</button>\n</form>'
    res.send(html);
});
            //registration post
app.post('/reservations/register',function (req, res) {
    const user_name = req.body.user_name;
    const user_age = req.body.age;

        //check if username exists
    user_model.findOne({
        name: user_name
    }).then((user) => {
        if (user) {
            console.log('Username already registered');
            res.json('User already exists');
        }else{
        let new_user = new user_model({
            name: user_name.toLowerCase(),
            age: user_age,
            reservations: []
        });
        new_user.save().then(() => {
            console.log('user added');
            res.json(new_user);   
        })};
    });
});
                //get reservations html
app.get('/reservations/reservation',function (req,res) {
    const html = '<form action="/reservations/reservation" method="POST">'+
    'Enter username:' + 
    '<input type="text" name="user_name" id="user_name"/>'+
    "Enter event name: " +
    '<select name="eventname" id="eventname"><option value="poraus">Poraus</option><option value="paikkaus">Paikkaus</option><option value="tarkistus">Tarkistus</option> <option value="tekohampaat">Tekohampaat</option></select>'+
    "Choose date and time: "+
    '<input type="datetime-local" name="start_time" id="start_time" placeholder="select starting time and date"/>' +
    '<br>' +
    '<button type="submit">submit</button>\n</form>'
    res.send(html);

})
                //make a reservation for a user
app.post('/reservations/reservation',function (req, res){

    const user_name = req.body.user_name.toLowerCase();
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

            //find specific users reservations
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
            // find all reservations
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
            // find users in the range of low and high age
app.get('/reservations/users_age', function(req,res){

        const age_low = req.body.age_low;
        const age_high = req.body.age_high;
  
        user_model.find({age:{$gt:age_low, $lt:age_high}},function(err,users){
            if(err){
                return res.json(err)
            }res.json(users)
        })
})

                //modify reservation time with id
app.patch('/reservations/update:id', function(req,res){

    const id = req.body.reservation_id;
    const time_to_change = req.body.new_time;

    const end_time = new Date(time_to_change);
    end_time.setHours(end_time.getHours() +1);

  

        reservation_model.findByIdAndUpdate(
        {_id: id},
        {
        start_time: new Date(time_to_change),
        end_time: new Date(end_time)
        },
        function(err, result){
            if(err){
                res.json(err);
            }else{
               
                res.json(result)
            }}
      );
    });

// http://localhost:8080/reservations/user_reservations/?id=5f8f166aa93e373460808cca

app.get('/reservations/user_reservations', function(req,res){

    const queryObject = url.parse(req.url,true).query
    console.log(queryObject)

    if(queryObject.id){

    id = queryObject.id;
        user_model.findById(id).then((user) =>{
        user.populate('reservations')
        .execPopulate()
        .then(()=> {
            let data = user.reservations
            let html = 'Current user:' +user.name+ '<hr>'
            data.forEach((reservation)=>{
                html+= 'procedure: '+reservation.eventname;
                html+= '<br>'
                html+= 'start time: '+reservation.start_time;
                html+= '<br>'
                html+= 'end time: '+reservation.end_time;
                html+= '<br>'
                html+= 'id: '+reservation._id;
                html+= '<hr>'
                })
            res.send(html)
            })
        })
        }
        else{
            res.send('Incorrect id')
        }
})

//http://localhost:8080/reservations/deleteres:id/?id=5f8f1681a93e373460808ccd
app.post('/reservations/deleteres:id', function (req,res){
    const queryObject = url.parse(req.url,true).query
    console.log(queryObject)
    if(queryObject.id){

    id = queryObject.id;
        reservation_model.findByIdAndDelete(id).then((id) =>{
            if(id){
                res.send('deleted')
            }else{
                res.send('not found')          
        }}
    )}
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




