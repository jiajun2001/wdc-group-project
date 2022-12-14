var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var bodyParser = require("body-parser");
var session = require("express-session");
// module1 for storing Session in MySQL Database
var mysqlStore = require("express-mysql-session")(session);

var db = require("./utils/db");
var indexRouter = require("./routes/index");
var authRouter = require("./routes/auth");
var profileRouter = require("./routes/profile");
var eventRouter = require("./routes/event");
var authEventRouter = require("./routes/auth-event");
var availabilityRouter = require("./routes/availability");
var authAvailabilityRouter = require("./routes/auth-availability");
var searchRouter = require("./routes/search");
var adminRouter = require("./routes/admin");
var attendanceRouter = require("./routes/attendance");
var settingsRouter = require("./routes/settings");
const { pathToHtml } = require("./utils/routes");

// module2 for storing Session in MySQL Database
var sessionStore = new mysqlStore(db.options);

var app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// configure session
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false,
    // Reference: https://darifnemma.medium.com/how-to-store-session-in-mysql-database-using-express-mysql-session-ae2f67ef833e
    store: sessionStore, // storing Session in MySQL Database
  })
);

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

var nodemailer = require("nodemailer");
const { userIsAdmin, userIsLoggedIn } = require("./utils/auth");

var transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email", // hostname
  secureConnection: false, // TLS requires secureConnection to be false
  secure: false,
  port: 587, // port for secure SMTP,
  pool: true,
  maxConnections: 5,
  tls: {
    ciphers: "SSLv3",
  },
  auth: {
    user: "hy7tjayeu3f3ganq@ethereal.email",
    pass: "kGSvXP3g4974KTHGgW",
  },
});

app.use(function (req, _, next) {
  req.pool = db.connectionPool;
  req.transporter = transporter;
  next();
});

function fileFilter(req, file, cb) {
  // Allowed ext
  const filetypes = /jpeg|jpg|png/;

  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb("Error: Images Only!");
  }
}

// Public routes
app.use("/", indexRouter);
app.use("/", authRouter);
app.use("/", eventRouter);
app.use("/", availabilityRouter);
app.use("/", searchRouter);
app.use("/", attendanceRouter);

// User authenticated routes
app.use(function (req, res, next) {
  if (!userIsLoggedIn(req.session.user)) {
    return res.redirect("/404");
  } else {
    next();
  }
});

app.use("/", authEventRouter);
app.use("/", authAvailabilityRouter);
app.use("/", profileRouter);
app.use("/", settingsRouter);

// Admin authenticated routes
app.use(function (req, res, next) {
  if (!userIsAdmin(req.session.user)) {
    return res.redirect("/404");
  } else {
    next();
  }
});

app.use("/admin", adminRouter);

// catch 404
app.use((req, res, next) => {
  res.sendFile(pathToHtml("404.html"));
});

module.exports = app;
