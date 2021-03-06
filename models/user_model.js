const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const user_schema = new Schema({
    name: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        required: true
    },
    reservations: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'reservation',
        req: true
    }]
});
const user_model = mongoose.model('user', user_schema);

module.exports = user_model;