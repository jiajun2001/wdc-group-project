var express = require("express");
var passport = require("passport");
var LocalStrategy = require("passport-local");
var argon2 = require("argon2");
const { userIsLoggedIn } = require("../utils/auth");
const { pathToHtml } = require("../utils/routes");

// add multer library
var multer = require("multer");
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/user-profiles");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "." + file.originalname.split(".").pop());
  },
});
var upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype == "image/png" ||
      file.mimetype == "image/jpg" ||
      file.mimetype == "image/jpeg"
    ) {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error("Only .png, .jpg and .jpeg format allowed!"));
    }
  },
});

// remove a file
const fs = require("fs");

var router = express.Router();

router.put("/edit-profile", upload.array("file", 1));
router.put("/edit-profile", function (req, res, next) {
  // Ensure the user is logged in
  if (!userIsLoggedIn(req.session.user)) {
    return res.status(401).send("Unauthorized Access!!");
  }
  // Get all data from request body
  req.pool.getConnection(function (err, connection) {
    if (err) {
      return res.status(500).send("An interval server error occurred.");
    }

    // Deference
    let { first_name, last_name, birthday, instagram_handle, facebook_handle, state, country } =
      req.body;

    if (
      !first_name ||
      !last_name ||
      !birthday ||
      !instagram_handle ||
      !facebook_handle ||
      !state ||
      !country
    ) {
      return res.status(400).send("Insufficient Data");
    }

    if (req.files != null && req.files.length > 0) {
      let query = "select profile_picture from User_Profile where email = ?";
      connection.query(query, [req.session.user.email], function (err, rows, fields) {
        connection.release();
        if (err) {
          return res.status(500).send("An interval server error occurred.");
        }
        let previousPath = rows[0]["profile_picture"];
        // if previousPath exists
        if (previousPath !== "/user-profiles/defaultUserProfile.png") {
          try {
            fs.unlinkSync("public" + previousPath);
          } catch (err) {
            console.error(err);
          }
        }

        req.files.forEach(function (file) {
          // Sends path name back to database
          var path = `/user-profiles/${file.filename}`;

          var query =
            "update User_Profile set first_name = ?, last_name = ?, birthday = ?, instagram_handle = ?, facebook_handle = ?, state = ?, country = ?, profile_picture = ? where email = ?";
          connection.query(
            query,
            [
              first_name,
              last_name,
              birthday,
              instagram_handle,
              facebook_handle,
              state,
              country,
              path,
              req.session.user.email,
            ],
            function (err, rows, fields) {
              if (err) {
                return res.status(500).send("An interval server error occurred.");
              }

              // Update user session
              let userSession = req.session.user;
              userSession["profile_picture"] = path;
              req.session.user = userSession;

              return res.send({ path });
            }
          );
        });
      });
    } else {
      let query =
        "update User_Profile set first_name = ?, last_name = ?, birthday = ?, instagram_handle = ?, facebook_handle = ?, state = ?, country = ? where email = ?";
      connection.query(
        query,
        [
          first_name,
          last_name,
          birthday,
          instagram_handle,
          facebook_handle,
          state,
          country,
          req.session.user.email,
        ],
        function (err, rows, fields) {
          connection.release();
          if (err) {
            return res.status(500).send("An interval server error occurred.");
          }
          return res.status(200).end();
        }
      );
    }
  });
});

router.get("/get-profile", function (req, res, next) {
  if (!userIsLoggedIn(req.session.user)) {
    return res.status(401).send("Unauthorized Access !!");
  }
  req.pool.getConnection(function (err, connection) {
    if (err) {
      return res.status(500).send("An interval server error occurred.");
    }
    // Get data
    var query = "select * from User_Profile where email = ?";
    connection.query(query, [req.session.user.email], function (err, rows, fields) {
      connection.release();
      if (err) {
        return res.status(500).send("An interval server error occurred.");
      }
      // check
      if (!rows && rows.length == 0) {
        return res.send("User not found!");
      }
      return res.send(rows[0]);
    });
  });
});

// Rendering Pages
router.get("/profile", function (req, res, next) {
  if (!userIsLoggedIn(req.session.user)) {
    res.redirect("/");
  }
  res.sendFile(pathToHtml("profile.html"));
});

module.exports = router;
