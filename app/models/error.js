var mongoose = require('mongoose');

module.exports = mongoose.model('Error', {
    error      : String,
    errorStack	: String,
    createdAt	: Number
});