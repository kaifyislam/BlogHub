//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const homeStartingContent = ""
const aboutContent = ""
const contactContent = ""

const app = express();

app.use(express.static("public"));
app.use(express.static("login_public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://kaifyIslam:test123@cluster0.fkvkf.mongodb.net/HubDB", { useNewUrlParser: true });
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  secret: String
});

const blogSchema = ({
  title: String,
  content: String,
  author: String,
  date: {
    type: Date,
    default: Date.now
  }
})

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);
const Post = mongoose.model("Post", blogSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
  clientID: '67213339349-ub7ci9ssl1r4shjtpgovon6avq7nn9qi.apps.googleusercontent.com',
  clientSecret: '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',
  callbackURL: "https://kaifys-blog.onrender.com/auth/google/secrets",
  
},
function(accessToken, refreshToken, profile, cb) {
  console.log(profile);
  User.findOrCreate({username: profile.displayName, googleId: profile.id }, function(err, user) {
    return cb(err, user)
  });
}
));
// passport.use(new FacebookStrategy({
//   clientID: 274397585492877,
//   clientSecret: 57762452ef72270ab191c37ab8f29ea3,
//   callbackURL: "https://kaifys-hub.onrender.com/auth/facebook/secrets",
// },
// function(accessToken, refreshToken, profile, cb) {
//   console.log(profile);
//   User.findOrCreate({ username: profile.displayName, facebookId: profile.id }, function(err, user) {
//     return cb(err, user);
//   });
// }
// ));

// Middleware to check if the user is authenticated
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next(); // If authenticated, continue to the next middleware
  } else {
    res.redirect("/login"); // If not authenticated, redirect to the login page
  }
}

app.get("/", function(req, res) {
  res.render("login_home");
});

app.get("/secrets", ensureAuthenticated, function(req, res) {
  User.find({}, function(err, foundUsers) {
    if (err) {
      console.log(err);
    } else {
      if (foundUsers) {
        Post.find({}).then((element) => {
          res.render("home", {
            startingContent: homeStartingContent,
            posts: element
          });
        });
      } else {
        res.redirect("/login")
      }
    }
  });
});

app.get("/about", function(req, res) {
  res.render("about", { aboutContent: aboutContent });
});

app.get("/contact", function(req, res) {
  res.render("contact", { contactContent: contactContent });
});

app.get("/compose", function(req, res) {
  res.render("compose");
});

app.post("/compose", function(req, res) {
  const newpost = new Post({
    title: req.body.postTitle,
    content: req.body.postBody,
    author: req.body.postAuthor,
    date: new Date()
  })
  newpost.save();
  res.redirect("/secrets");
});

app.get("/posts/:postId", function(req, res) {
  const requestedTitleId = req.params.postId
  Post.findOne({ _id: requestedTitleId }).then((element) => {
    res.render("post", {
      title: element.title,
      content: element.content,
      author: element.author,
      date: element.date
    })
  });
});

app.post("/delete", (req, res) => {
  const checkboxId = req.body.checkbox;
  Post.findByIdAndRemove(checkboxId).then(
    console.log("Post Deleted Successfully")
  )
  res.redirect("/secrets")
});

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
);

app.get("/auth/google/secrets",
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect("/secrets");
  });

app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get("/login", function(req, res) {
  res.render("login");
});

app.get("/register", function(req, res) {
  res.render("register");
});

app.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/");
});

app.post("/register", function(req, res) {
  User.register({ username: req.body.username }, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets");
      });
    }
  });
});

app.post("/login", function(req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });
  req.login(user, function(err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets");
      });
    }
  });
});

app.listen(3000, function() {
  console.log("Server started on port 3000.");
});
