var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var Review = require("../models/review");
var middleware = require("../middleware");
var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var NodeGeocoder = require('node-geocoder');
 
var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: 'process.env.AIzaSyBcJelMsHcCNtv53Ngca0ygl7bDc03PEYc',
  formatter: null
};
 
var geocoder = NodeGeocoder(options);
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'dal2huydk', 
  api_key: 895522743529558, 
  api_secret: 'eSeskbMUIea4TdptqJNmvbSaFOQ'
});


//INDEX - show all campgrounds
router.get("/campgrounds", function(req, res){
    var noMatch = null;
    if(req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        // Get all campgrounds from DB
        Campground.find({name: regex}, function(err, allCampgrounds){
           if(err){
               console.log(err);
           } else {
              if(allCampgrounds.length < 1) {
                  noMatch = "No campgrounds match that query, please try again.";
              }
              res.render("campgrounds/index",{campgrounds:allCampgrounds, noMatch: noMatch});
           }
        });
    } else {
        // Get all campgrounds from DB
        Campground.find({}, function(err, allCampgrounds){
           if(err){
               console.log(err);
           } else {
              res.render("campgrounds/index",{campgrounds:allCampgrounds, noMatch: noMatch});
           }
        });
    }
});

// router.post("/campgrounds",  middleware.isLoggedIn, upload.single('image'), function(req,res){
//     cloudinary.uploader.upload(req.file.path, function(result) {
//   // add cloudinary url for the image to the campground object under image property
//   req.body.campground.image = result.secure_url;
//   // add author to campground
//   req.body.campground.author = {
//     id: req.user._id,
//     username: req.user.username
//   }
//   Campground.create(req.body.campground, function(err, campground) {
//     if (err) {
//       req.flash('error', err.message);
//       return res.redirect('back');
//     }
//     res.redirect('/campgrounds/' + campground.id);
//   });
// });
// });

//CREATE - add new campground to DB
router.post("/campgrounds", middleware.isLoggedIn, function(req, res){
  // get data from form and add to campgrounds array
  var name = req.body.name;
  var image = req.body.image;
  var desc = req.body.description;
  var author = {
      id: req.user._id,
      username: req.user.username
  }
  geocoder.geocode(req.body.location, function (err, data) {
    if (err || !data.length) {
      req.flash('error', 'Invalid address');
      return res.redirect('back');
    }
    var lat = data[0].latitude;
    var lng = data[0].longitude;
    var location = data[0].formattedAddress;
    var newCampground = {name: name, image: image, description: desc, author:author, location: location, lat: lat, lng: lng};
    // Create a new campground and save to DB
    Campground.create(newCampground, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
            //redirect back to campgrounds page
            console.log(newlyCreated);
            res.redirect("/campgrounds");
        }
    });
  });
});

router.get("/campgrounds/new",  middleware.isLoggedIn, function(req,res){
    res.render("campgrounds/new");
});

router.get("/campgrounds/:id", function (req, res) {
    //find the campground with provided ID
    Campground.findById(req.params.id).populate("comments").populate({
        path: "reviews",
        options: {sort: {createdAt: -1}}
    }).exec(function (err, foundCampground) {
        if (err) {
            console.log(err);
        } else {
            //render show template with that campground
            res.render("campgrounds/show", {campground: foundCampground});
        }
    });
});


router.get("/campgrounds/:id",  middleware.isLoggedIn, function(req,res){
	Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
		if(err){
			console.log(err);
		} else {
			res.render("campgrounds/show", {campground: foundCampground});
		}
	});
});
 
router.get("/campgrounds/:id/edit", middleware.checkCampgroundOwnership, function(req,res){
	Campground.findById(req.params.id, function(err, foundCampground){
		if(err){
			res.redirect("/campgrounds");
		} else {
			res.render("campgrounds/edit", {campground: foundCampground});
		}
	});
});

// router.post("/campgrounds/:id", middleware.checkCampgroundOwnership, function(req,res){
// 	Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, updatedCampground){
// 		if(err){
// 			res.redirect("/campgrounds");
// 		} else {
// 			res.redirect("/campgrounds/" + req.params.id);
// 		}
// 	});
// });

// UPDATE CAMPGROUND ROUTE
router.post("/campgrounds/:id", middleware.checkCampgroundOwnership, function(req, res){
  geocoder.geocode(req.body.location, function (err, data) {
    if (err || !data.length) {
      req.flash('error', 'Invalid address');
      return res.redirect('back');
    }
    req.body.campground.lat = data[0].latitude;
    req.body.campground.lng = data[0].longitude;
    req.body.campground.location = data[0].formattedAddress;

    Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, campground){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            req.flash("success","Successfully Updated!");
            res.redirect("/campgrounds/" + campground._id);
        }
    });
  });
});


router.delete("/campgrounds/:id", middleware.checkCampgroundOwnership, function (req, res) {
    Campground.findById(req.params.id, function (err, campground) {
        if (err) {
            res.redirect("/campgrounds");
        } else {
            // deletes all comments associated with the campground
            Comment.remove({"_id": {$in: campground.comments}}, function (err) {
                if (err) {
                    console.log(err);
                    return res.redirect("/campgrounds");
                }
                // deletes all reviews associated with the campground
                Review.remove({"_id": {$in: campground.reviews}}, function (err) {
                    if (err) {
                        console.log(err);
                        return res.redirect("/campgrounds");
                    }
                    //  delete the campground
                    campground.remove();
                    req.flash("success", "Campground deleted successfully!");
                    res.redirect("/campgrounds");
                });
            });
        }
    });
});


module.exports = router;