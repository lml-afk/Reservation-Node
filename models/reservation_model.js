const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reservation_schema = new Schema({
    eventname: {
        type: String,
        required: true
    },
    start_time: {
        type: Date,
        required: true
    },
    end_time: {
        type: Date,
        required: true
    }
});
const reservation_model = mongoose.model('reservation', reservation_schema);

module.exports = reservation_model;