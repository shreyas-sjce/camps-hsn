var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var flash = require("connect-flash");
var passport = require("passport");
var localStrategy = require("passport-local");
var methodOverride = require("method-override");
var Campground = require("./models/campground");
var Comment   = require("./models/comment");
var User = require("./models/user");
var SeedDB = require("./seeds");

var commentRoutes = require("./routes/comments");
var campgroundRoutes = require("./routes/campgrounds");
var indexRoutes = require("./routes/index");

mongoose.connect("mongodb+srv://shreyas:Yashoda123@@cluster0-qoqhh.mongodb.net/test?retryWrites=true&w=majority",{
	useNewUrlParser: true,
	useCreateIndex: true,
	useUnifiedTopology: true
}).then(() => {
	console.log("Connected to DB!");
}).catch(err => {
	console.log("ERROR:",err.message);
});

app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine","ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());

//SeedDB();

app.use(require("express-session")({
	secret: "godzilla",
	resave: false,
	saveUninitialized: false
}));

app.locals.moment = require('moment');
app.use(passport.initialize());
app.use(passport.session());

passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req,res,next){
	res.locals.currentUser = req.user;
	res.locals.error = req.flash("error");
   res.locals.success = req.flash("success");
	next();
});


/*Campground.create(
	{
		name: "Madkeri",
		image: "https://r1imghtlak.mmtcdn.com/fe28fda882c311e584de0015c5f4277e.jfif?&output-       quality=75&downsize=520:350&crop=520:350;11,0&output-format=jpg",
		description: "This is very fantastic place to have a camp there and send the time well"
	}, function(err, campground){
		if(err){
			console.log(err);
		} else {
			console.log("New created camground: ");
		    console.log(campground);
		}
	});*/

/*app.get("/",function(req,res){
    res.render("landing");
});*/

//campgrounds Routes

/*app.get("/campgrounds",function(req,res){
	Campground.find({}, function(err, allCampgrounds){
		if(err){
		    console.log(err);
		} else{
			res.render("campgrounds/index",{campgrounds:allCampgrounds, currentUser: req.user});
		}
	});
});

app.post("/campgrounds",function(req,res){
    var name = req.body.name;
    var image = req.body.image;
	var desc = req.body.description;
    var newCampground = {name:name, image:image, description: desc};
    //Create a new campground and save to DB
	Campground.create(newCampground, function(err, newlyCreated){
		if(err){
			console.log(err);
		} else {
			res.redirect("/campgrounds");
		}
	});
});

app.get("/campgrounds/new",function(req,res){
    res.render("campgrounds/new");
});

app.get("/campgrounds/:id", isLoggedIn, function(req,res){
	Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
		if(err){
			console.log(err);
		} else {
			res.render("campgrounds/show", {campground: foundCampground});
		}
	});
});*/

//comments Routes

/*app.get("/campgrounds/:id/comments/new",isLoggedIn, function(req,res){
	Campground.findById(req.params.id, function(err, campground){
		if(err){
			console.log(err);
		} else{
			res.render("comments/new", {campground: campground});
		}
	});
});

app.post("/campgrounds/:id/comments", function(req,res){
	Campground.findById(req.params.id, function(err, campground){
		if(err){
			console.log(err);
			res.redirect("/campgrounds");
		} else {
			Comment.create(req.body.comment, function(err, comment){
				if(err){
					console.log(err);
				} else {
					campground.comments.push(comment);
					campground.save();
					res.redirect("/campgrounds/" + campground._id);
				}
			});
		}
	});
});*/

/*app.get("/register", function(req,res){
	res.render("register");
});

app.post("/register", function(req,res){
	req.body.username
	req.body.password
	var newUser = new User({username: req.body.username});
	User.register(newUser, req.body.password, function(err,user){
		if(err){
			console.log(err);
			return res.render("register");
		}
		passport.authenticate("local")(req, res, function(){
			res.redirect("/campgrounds");
		});
	});
});

app.get("/login", function(req,res){
	res.render("login");
});

app.post("/login", passport.authenticate("local", {
	successRedirect: "/campgrounds",
	failureRedirect: "/login"
}), function(req,res){
});

app.get("/logout", function(req,res){
	req.logout();
	res.redirect("/campgrounds");
});

function isLoggedIn(req,res,next){
		if(req.isAuthenticated()){
			return next();
		}
	res.redirect("/login");
}*/

app.use(indexRoutes);
app.use(commentRoutes);
app.use(campgroundRoutes);


app.listen(3000,function(){
    console.log("Yelpcamp is just started");
});