if (process.env.NODE_ENV != 'production') {
    require('dotenv').config();
}

//npm packages
const express = require('express');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');

//built in modules
const path = require('path');

// custom modules
const listingRoutes = require('./routes/listings.js');
const reviewRoutes = require('./routes/reviews.js');
const userRoutes = require('./routes/users.js')
const ExpressError = require('./utils/expressErrors.js');
const User = require('./models/User.js')

const app = express();
const port = 8080;

//connecting to MongoDB
const dbUrl = process.env.ATLAS_URL;

mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('connected to Atlas..'))
    .catch((err) => console.log(err));

//all middlewares
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }))
app.use(methodOverride('_method'));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, 'public')));


//mongo-connect
const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.secret,
    },
    touchAfter: 24 * 3600,
})

store.on('error', () => {
    console.log('ERROR in MONGO SESSION STORE!', err)
})

//express-session
const sessionOptions = {
    store,//store=store
    secret: process.env.secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,//to prevent cross scripting attacks 
    }
}//check in inspect> application>cookies..if.. connect.sid.. sessiion is working  

app.use(session(sessionOptions));
app.use(flash());

//passport
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());//stores user info in session
passport.deserializeUser(User.deserializeUser());

//local variables..connect-flash
app.use((req, res, next) => {
    res.locals.success = req.flash('success') || null;
    res.locals.error = req.flash('error') || null;
    res.locals.currUser = req.user || null;
    next();
})


//root route
app.get('/', (req, res) => {
    res.redirect('/listings')
})
//all routes
app.use('/listings', listingRoutes);
app.use('/listings/:id/reviews', reviewRoutes);
app.use('/', userRoutes);

//custom express error (if route not match)
app.use((req, res, next) => {
    next(new ExpressError(404, 'page not found ! ! !'))
})

//err handling middleware
app.use((err, req, res, next) => {
    let { statusCode = 500, message = 'somethning went wrong' } = err;//deconstructing + default param if they dont have any .. 
    res.status(statusCode).render('error.ejs', { message })
})

app.listen(port, () => {
    console.log('Server is listening to port', port);
})    