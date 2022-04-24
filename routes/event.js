var express = require('express');
var passport = require('passport');
var LocalStrategy = require('passport-local');
var db = require('../utils/db');
var objects = require('../utils/objects');
var argon2 = require('argon2');

var router = express.Router();

router.post('/create-event', function (req, res, next) {
    // Ensure an user is logged in
    console.log(req.user);
    if (!req.user || objects.isEmpty(req.user)) {
        return res.status(401).send('Unauthorized Access!!');
    }
    // Get all data from request body
    db.connectionPool.getConnection(function (err, connection) {
        if (err) { return next(err); }
        // Deference
        var { title, description, proposal_date, start_date, end_date, address_line, state, country, postcode } = req.body;
        console.log(req.body);
        console.log(req.user);
        console.log(req.user.email);
        var query = "INSERT INTO Events (title, description, created_by, proposal_date, start_date, end_date, custom_link, address_line, state, country, postcode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        connection.query(query, [title, description, req.user.email, proposal_date, start_date, end_date, req.url, address_line, state, country, postcode], function (err, rows, fields) {
            connection.release();
            if (err) { return next(err); }
            return res.send("Success in creating an event");
        });
    });
});

router.post('/edit-event', function (req, res, next) {
    // Ensure an user is logged in
    if (!req.user) {
        return res.status(401).send('Unauthorized Access!!');
    }

});

module.exports = router;