const mongoose = require('mongoose');

const garageSchema = new mongoose.Schema({
    gragename : {
        type:String,
        require:true
    },

    grageDescription : {
        type:String,
        require:true
    },

    grageImages : String,

    gragePricePerHoure : {
        type:Number,
        require:true
    },


    lat : {
        type:Number,
        require:true
    },

    lng : {
        type:Number,
        require:true
    },

    openDate :{
        type:Date,
        require:true
    },

    endDate :{
        type:Date,
        require:true
    },

    active : {
        type:Boolean,
        default:true
    },

    driver :[{
        type: mongoose.Schema.ObjectId,
        ref:'Admin',
        require:true
    }],

    subOwner :[{
        type: mongoose.Schema.ObjectId,
        ref:'Admin',
        require:true
    }],


} , {timestamps :true})

const garageModel = mongoose.model("Garages" , garageSchema)

module.exports = garageModel;