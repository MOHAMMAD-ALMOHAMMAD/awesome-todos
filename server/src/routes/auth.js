const express = require('express');
const cookieParser = require('cookie-parser');
const routes = express.Router();
const passport=require("passport");
const JwtStrategy = require('passport-jwt').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt=require("jsonwebtoken");
const User=require("../models/User");

const parseTokenCookie = (req) => {
 let cookie=null
  if(req && req.headers.cookie) {
    cookie = req.headers.cookie.split("token=")[1];
  }
    return cookie;
}
const jwtOptions = {
  jwtFromRequest: parseTokenCookie,
  secretOrKey: process.env.SECRET_KEY
};

passport.use(
  new JwtStrategy(jwtOptions, (payload, done) => {
   
    done(null, payload);
  })
);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GAPP_CLIENT_ID,
      clientSecret: process.env.GAPP_CLIENT_SECRET,
      callbackURL: 'http://localhost:3000/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      // Here, you can generate a JWT with the user's information
  
     
     
     const userExist=await User.findOne({providerId:profile.id})
       if(!userExist) {
        await User.create({
          firstname:profile.name.givenName,
          lastname:profile.name.familyName,
          name: profile.displayName,
          email: profile.emails[0].value,
          providerId: profile.id,
          profilePicture: profile.photos[0].value,
          provider:profile.provider,

        })
       }
    
     const user = {
      name: profile.displayName,
      email: profile.emails[0].value,
      providerId: `google-${profile.id}`,
      avatar: profile.photos[0].value,
    };

    const expiresIn = 14 * 24 * 60 * 60; // 14 days in seconds
    const now = Math.floor(Date.now() / 1000); // Convert milliseconds to seconds
    const expiresAt = now + expiresIn;
  
    const token = jwt.sign(
      {
        ...user,
        exp: expiresAt,
        iat: now,
      },
      process.env.SECRET_KEY
    );

    done(null, token);
    }
  )
);


routes.get('/google',
 passport.authenticate("google",{scope:["profile","email","openid"]}),
 (req, res) => {
 
});

routes.get('/me',passport.authenticate("jwt",{session:false}), 
async (req, res) => {

res.json(req.user);
});

routes.get('/google/callback',
passport.authenticate("google",{ session:false,failureRedirect: 'http://localhost:3000' }),

 (req, res) => {

  res.cookie('token', req.user, { httpOnly: true });

  res.redirect("http://localhost:3000");

});

routes.get('/logout',passport.authenticate("jwt",{session:false}),
 (req, res) => {
  res.clearCookie("token");
  res.end();
});

module.exports = routes;
