const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
require('dotenv').config()

app.use(cors())

app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
console.log(mongoose.connection.readyState)

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const exerciseSchema = new mongoose.Schema({
  userId: String, description: String, duration: Number, date: Date
})
const Exercise = mongoose.model("Exercise", exerciseSchema)

let personSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true }
})
let Person = mongoose.model("Person", personSchema)


app.post("/api/exercise/new-user", (req, res) => {
  const newPerson = new Person({username: req.body.username});
  newPerson.save((err, data)=>{
    if(err) {
    res.json("Username already taken")  
    } else {
res.json({ "username": data.username, "_id": data.id })
    }
  })
});


app.post("/api/exercise/add", (req, res) => {
  let {userId, description, duration, date} = req.body;
  if(!date){
    date = new Date();
  }
Person.findById(userId, (err, data)=>{
  if(!data){
    res.send("Unknown userId")
  } else {
const username = data.username;
let newExercise = new Exercise({userId, description, duration, date})
newExercise.save((err, data)=>{
  res.json({username, description, duration: +duration, _id: userId, date: new Date(date).toDateString()})
})
  }
})
})

app.get("/api/exercise/log", (req, res) => {
  const {userId, from, to, limit} = req.query;
  Person.findById(userId, (err, data) => {
    if(!data){
      res.send("Unknown userId")
    } else {
      const username = data.username;
      console.log({"from": from, "to": to, "limit": limit});
      Exercise.find({userId},{date: {$gte: new Date(from), $lte: new Date(to)}}).select(["id","description", "duration", "date"]).limit(+limit)
      .exec( (err, data) => {
        let customdata = data.map(exer => {
          let dateFormatted = new Date(exer.date).toDateString();
          return {id: exer.id, description: exer.description, duration: exer.duration, date: dateFormatted}
          })
          if(!data){
            res.json({
              "userId": userId,
              "username": username,
              "count": 0,
              "log": []})
          } else {
            res.json({
              "userId": userId,
              "username": username,
              "count": data.length,
              "log": customdata})
          }
      })
    }
  })
})




app.get("/api/exercise/users", (req, res)=>{
  Person.find({}, (err, data) => {
    if(!data) {
      res.json("No users")
    } else {
      res.json(data)
    }
  })
})




const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
