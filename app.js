//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");

const homeStartingContent = "Celebrate the joy of exploration as you enter the doors of my BLOG WEBSITE , a place where words come alive to ignite your curiosity and imagination";
const aboutContent = "Welcome to Our Daily Journal, a place where we celebrate the beauty of daily life, one journal entry at a time. We believe that every day is a new chapter waiting to be written, and our mission is to inspire and guide you on your journaling journey."
const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

let posts = [];
mongoose.connect("mongodb://0.0.0.0:27017/blogDB", {useNewUrlParser : true});

const blogSchema = ({
  title : String,
  content: String,
  author : String,
  date : {
    type : Date,
    default : Date.now
  }

})

const Post = mongoose.model("Post",blogSchema);


app.get("/", function(req, res){
  Post.find({}).then((element)=>{
  res.render("home", {
    startingContent: homeStartingContent,
    posts: element
    });
  })
});

app.get("/about", function(req, res){
  res.render("about", {aboutContent: aboutContent});
});

app.get("/contact", function(req, res){
  res.render("contact", {contactContent: contactContent});
});

app.get("/compose", function(req, res){
  
  res.render("compose");
});

app.post("/compose", function(req, res){
  const newpost = new Post({
    title: req.body.postTitle,
    content: req.body.postBody,
    author : req.body.postAuthor,
    date : new Date()
  })
  newpost.save();
  
  // posts.push(post);

  res.redirect("/");

});

app.get("/posts/:postId", function(req, res){
  const requestedTitleId = req.params.postId


  Post.findOne({_id : requestedTitleId}).then( (element)=>{
    res.render("post",{
      title : element.title,
      content: element.content,
      author : element.author,
      date : element.date
    })
  }
  )

  // posts.forEach(function(post){
  //   const storedTitle = _.lowerCase(post.title);

  //   if (storedTitle === requestedTitle) {
  //     res.render("post", {
  //       title: post.title,
  //       content: post.content
  //     });
  //   }
  // });

});

app.post("/delete", (req,res)=>{
   const checkboxId = req.body.checkbox;

   Post.findByIdAndRemove(checkboxId).then(
    console.log("Post Deleted Successfully")
   )
   res.redirect("/")


})

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
