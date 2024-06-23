if(process.env.NODE_ENV != "production"){
  require("dotenv").config();
}
const express = require("express");
const app =   express();
const mongoose = require("mongoose");
//const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
//const wrapAsync = require("./utils/wrapAsync.js");
const expressError = require("./utils/expressError.js");
//const Review = require("./models/review.js");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const { isLoggedIn } = require("./middleware.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

// const dburl = process.env.ATLASDB_URL;

main()
.then(()=>{
    console.log("connected to db");
})
.catch((err) => { 
    console.log(err);
});

async function main() {
    await mongoose.connect("mongodb://127.0.0.1:27017/wanderlust");
}

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname,"/public")));


// const store = MongoStore.create({
//     mongoUrl:dburl,
//     crypto:{
//      secret: process.env.SECRET,
//     },
//     touchAfter:24*3600,
//  });

//  store.on("error",()=>{
//    console.log("error on mongo session store",err);
//  })

const sessionOption ={
    
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { 
        expires:Date.now()+7*24*60*60*1000,
        maxAge:7*24*60*60*1000,
        httpOnly:true,
  }
};





app.use(session(sessionOption));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// app.use((req,res,next)=>{
//     res.locals.success=req.flash("success");
//     res.locals.error=req.flash("error");
//     res.locals.curruser=req.user;
//     next();
// })

app.use((req,res,next)=>{
    res.locals.success=req.flash("success");
    res.locals.error=req.flash("error");
    res.locals.curruser=req.user;
    next();
})

app.use("/listing",listingRouter);
app.use("/listing/:id/review",reviewRouter);
app.use("/",userRouter);

app.get("/book",isLoggedIn,(req,res)=>{
    res.render("listings/book.ejs");
    req.flash("success","Booked");
    res.redirect("/listing");
})

app.all("*",(req,res,next)=>{
    next(new expressError(404,"page not found"));
});

app.use((err,req,res,next)=>{
 let{statuscode=500,message}=err;
res.status(statuscode).render("error.ejs",{message});
});



app.listen(8000,()=>{
    console.log("server is on");
})
