var express = require('express');
var passport = require('passport');
var LocalStrategy = require('passport-local');
var db = require('../utils/db');
var objects = require('../utils/objects');
var argon2 = require('argon2');

var router = express.Router();

router.post('/create-event', function (req, res, next) {
    // Ensure an user is logged in
    if (!req.user || objects.isEmpty(req.user)) {
        return res.status(401).send('Unauthorized Access!!');
    }
    // Get all data from request body
    db.connectionPool.getConnection(function (err, connection) {
        if (err) { return next(err); }
        // Deference
        var { title, description, proposal_date, start_date, end_date, address_line, state, country, postcode } = req.body;
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
    if (!req.user || objects.isEmpty(req.user)) {
        return res.status(401).send('Unauthorized Access!!');
    }
    db.connectionPool.getConnection(function(err, connection) {
        if (err) {return next(err); }
        var { title, description, proposal_date, start_date, end_date, address_line, state, country, postcode, event_id } = req.body;
        var query = "UPDATE Events set title = ?, description = ?, proposal_date = ?, start_date = ?, end_date = ?, address_line = ?, state = ?, country = ?, postcode = ? where event_id = ?";
        connection.query(query, [title, description, proposal_date, start_date, end_date, address_line, state, country, postcode, event_id], function(err, rows, fields) {
            connection.release();
            if (err) { return next(err); }
            return res.send("Success in modifying the event!");
        });
    });
});

router.delete('/delete-event', function(req, res, next) {
    // Ensure an user is logged in
    if (!req.user || objects.isEmpty(req.user)) {
        return res.status(401).send('Unauthorized Access!!');
    }
    db.connectionPool.getConnection(function(err, connection) {
        if (err) { return next(err); }
        var {event_id} = req.body;
        console.log(event_id);
        var query = "DELETE from Events where event_id = ?";
        connection.query(query, [event_id], function(err, rows, fields) {
            connection.release();
            if (err) { return next(err); }
            return res.send("Success in deleting an event!");
        });
    });
});

module.exports = router;