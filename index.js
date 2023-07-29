const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const exerciseSchema = new mongoose.Schema({
  description: String,
  duration: Number,
  date: Date
})

const userSchema = new mongoose.Schema({
  username: String,
  log: [{
    type: exerciseSchema
  }]
})

const User = mongoose.model('User', userSchema);

app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static('public'));


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get('/api/users', (req, res) => {
  User
    .find()
    .then((data) => {
      if (data) {
        res.json(
          data.map((user) => {
            return {
              username: user.username,
              _id: user['_id']
            }
          }
        ))
      }
    })
})

app.post('/api/users', (req, res) => {
  const { username } = req.body;

  let doc = User({
    username,
  });

  doc
    .save()
    .then((data) => {
      if (data) {
        res.json({
          username,
          '_id': data['_id']
        })
      } else {
        res.json({"error": "Invalid username"});
      }
    })
})

app.post('/api/users/:_id/exercises', (req, res) => {
  const { description, duration, date } = req.body;

  let exerciseDate = new Date(date);
  if (exerciseDate == 'Invalid Date') {
    exerciseDate = new Date();
  }

  User.findOneAndUpdate({
    '_id': req.params['_id']
  }, {
    $push: {
      log: {
        description,
        duration,
        date: exerciseDate
      }
    }
  }, {
    new: true
  }).then((data) => {
    if (data) {
      res.json({
        '_id': data['_id'],
        username: data.username,
        date: exerciseDate.toDateString(),
        duration,
        description,
      })
    }
  })
})

app.get('/api/users/:_id/logs', (req, res) => {
  const {from, to, limit} = req.query;

  let fromDate = new Date(from);
  if (fromDate == 'Invalid Date') {
    fromDate = new Date('1900-01-01');
  }

  let toDate = new Date(to);
  if (toDate == 'Invalid Date') {
    toDate = new Date('2100-01-01');
  }

  User
    .findById(req.params['_id'])
    .then((data) => {
      data.log = data.log.filter((log) => log.date > fromDate && log.date < toDate).slice(0, limit || 1000);
      res.json({
        username: data.username,
        count: data.log.length,
        _id: data['_id'],
        log: data.log.map((log) => {
          return {
            description: log.description,
            duration: log.duration,
            date: new Date(log.date).toDateString()
          };
        })
      })
    })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
