const express = require('express');
const routes = express.Router();
const Todo = require('../models/Todo');
const User = require('../models/User');
const passport=require("passport");
require("./auth");
const mongoose=require("mongoose");

routes.get('/', passport.authenticate("jwt",{session:false}),
async (req, res) => {
  try{
    const correctUserProviderId = req.user.providerId.split("google-")[1];
   
       
  correctUser = await User.findOne({providerId : correctUserProviderId});      
   const toDoList = await Todo.find({user:correctUser._id});
   
    res.json(toDoList);
   

  }catch(error){
    res.json(error);
  }
});

routes.put('/:id',passport.authenticate("jwt",{session:false}), async (req, res) => {
  try{
  const todoId=req.params.id;
  let todoItem= await Todo.findById(todoId);
  if(todoItem){
    const correctUserProviderId = req.user.providerId.split("google-")[1];
    const result =await User.findOne({providerId : correctUserProviderId});
    if(result._id.toString()===todoItem.user.toString()){
      
      const updatedTodo= await Todo.findByIdAndUpdate(todoId,{text:req.body.text,done:req.body.done},{new:true});
      res.json(updatedTodo);
      
    }else{
   throw "you cant update other users Todo Items";}

  }}catch(errors){
  res.status(401).json(errors);
  }
});

routes.delete('/:id',passport.authenticate("jwt",{session:false}), async (req, res) => {
  try{
    const todoId=req.params.id;
  const todoItem= await Todo.findById(todoId);
  if(todoItem){
    const correctUserProviderId = req.user.providerId.split("google-")[1];
    const result =await User.findOne({providerId : correctUserProviderId});
    if(result._id.toString()===todoItem.user.toString()){
    
      await Todo.findByIdAndDelete(todoId);
      res.status(204).end();
    }else{
   throw "you cant delete other users Todo Items";}
      
  }
  
  }catch(error){
    res.status(401).json(error);
  }
});

routes.post('/',passport.authenticate("jwt",{session:false}) ,async (req, res) => {
  try{
    const correctUserProviderId = req.user.providerId.split("google-")[1];
    const correctUser = await User.findOne({providerId : correctUserProviderId});      
 
    console.log(req.body);
    const newToDo = await Todo.create({text:req.body.text,done:false,user:mongoose.Types.ObjectId(correctUser._id)});
    console.log(newToDo);
    res.status(201).json(newToDo);  
  }catch(error) {
     res.json(error);
  } 
});

module.exports = routes;
