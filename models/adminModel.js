// const mongoose = require('mongoose');


// const adminSchema = new mongoose.Schema({

//     email : {
//         type : String,
//         require : true,
//        },

//     password : {
//         type : String,
//         require : true,
//        },  
       
//     lat : {
//         type : Number,
//         require : true,
//        },  
       
//     lng : {
//         type : Number,
//         require : true,
//        }, 
       
//     salary : {
//         type : Number,
//         require : true,
//        },  

//     garage:[ {
//         type: mongoose.Schema.ObjectId,
//         ref: "Garage",
       
//       }],
       
//        role : {
//         type : String,
//         require : true,
//         enum:['Driver','SubOwner']
//        },
       

// } , {timestamps: true})

// const adminModel = mongoose.model('Admin',adminSchema)

// module.exports =  adminModel

const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true, // Ensures unique email addresses
  },
  password: {
    type: String,
    required: true,
  },
  lat: {
    type: Number,
    required: true,
  },
  lng: {
    type: Number,
    required: true,
  },
  salary: {
    type: Number,
    required: true,
  },
  garage: [{
    type: mongoose.Schema.ObjectId,
    ref: "Garage", // Correct reference to the Garage model
  }],

  role: {
    type: String,
    required: true,
    enum: ['Driver','SubOwner'], // Restricts role to Driver or SubOwner
  },
}, { timestamps: true });

const adminModel = mongoose.model('Admin', adminSchema);

module.exports = adminModel;
