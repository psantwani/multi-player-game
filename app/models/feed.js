var mongoose = require('mongoose');

module.exports = mongoose.model('Feed', {
    gameId      : String,
    createdBy	: String,
    playerCount	: Number,
    available	: Boolean,
    createdAt   : Number,
    updatedAt	: Number
});