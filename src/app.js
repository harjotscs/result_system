const express = require("express");
const hbs = require("hbs");
const path = require("path");
const bodyParser = require("body-parser");
const passport = require("passport");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo")(session);
const flash = require("connect-flash");

const csrf = require("csurf");

require("./db/mongoose");

const linksRouter = require("./routers/links");
const userRouter = require("./routers/user");
const paymentsRouter = require("./routers/payments");
const { expand } = require("./utils/helper");

const initialiizePassport = require("./utils/passport-config");
initialiizePassport(passport);

const publicDirectoryPath = path.join(__dirname, "../public");
const partialsDirectoryPath = path.join(__dirname, "../views/partials");

const app = express();

hbs.registerPartials(partialsDirectoryPath);

app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        store: new MongoStore({ mongooseConnection: mongoose.connection }),
        cookie: { maxAge: 180 * 60 * 1000 },
    })
);
app.use(passport.initialize());
app.use(passport.session());

const csrfProtection = csrf();
app.use(csrfProtection);

app.use(express.static(publicDirectoryPath));
app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});
app.use(flash());

app.use(linksRouter);
app.use(userRouter);
app.use(paymentsRouter);

app.set("view engine", "hbs");

const port = process.env.PORT;

hbs.registerHelper("expand", expand);

app.get("/test", (req, res) => {
    res.render('forgot');
})
app.get("*", (req, res) => {
    res.render("404");
});

app.listen(port, () => {
    console.log(`Server Up and runing on Port: ${port}`);
});