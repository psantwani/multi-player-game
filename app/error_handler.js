var mongoose = require('mongoose');
var errorSchema = require('./models/error.js');

exports.saveError = function(err){
  var errorData = {
    error: err,
    errorStack: err.stack,
    createdAt: Date.now()
  };

  var errorRecord = new errorSchema(errorData);
  errorRecord.save(function(err){
    if(err){
      console.log("Error occured in logging error to DB.");
      console.log(err);
    }
    else{
      console.log('Data added to DB');
    }
  });
};
