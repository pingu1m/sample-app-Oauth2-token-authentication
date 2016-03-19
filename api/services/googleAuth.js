var User = require('../models/User.js');
var createSendToken = require('./jwt.js');
var request = require('request');
var config = require('./config');

module.exports = function (req, res) {

    var url = 'https://accounts.google.com/o/oauth2/token';
    var apiUrl = 'https://www.googleapis.com/plus/v1/people/me/openIdConnect';

    var params = {
        client_id: req.body.clientId,
        client_secret: config.GOOGLE_SECRET,
        code: req.body.code,
        redirect_uri: req.body.redirectUri,
        grant_type: 'authorization_code'
    };

    console.log(req.body.code);

    request.post(url, {
        json: true,
        form: params
    }, function (err, response, token) {
        var accessToken = token.access_token;

        var headers = {
            Authorization: 'Bearer ' + accessToken
        };

        request.get({
            url: apiUrl,
            headers: headers,
            json: true
        }, function (err, response, profile) {
            User.findOne({
                googleId: profile.sub
            }, function (err, foundUser) {

                console.log('here');
                if (foundUser) return createSendToken(foundUser, res);

                var newUser = new User();
                newUser.googleId = profile.sub;
                newUser.displayName = profile.name;
                newUser.save(function (err) {
                    if (err) return next(err);
                    createSendToken(newUser, res);
                });
            });
        });
    });
};
