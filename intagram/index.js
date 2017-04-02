var express = require('express');
var cookieParser = require('cookie-parser');
var fs = require('fs');
// Bluebird - full featured promise library with unmatched performance
var Bluebird = require('bluebird');
var router = express.Router();
var config = require('./config');
var Lob = require('lob')(config.lob_api_key);
var instagramApi = require('instagram-node').instagram();

Bluebird.promisifyAll(instagramApi);

/* Redirect use to Instagram for authentication */
router.get('/authorize-user', function (req,res) {
	instagramApi({
		client_id: config.intagram_client_id,
		client_secret: config.intagram_client_secret
	});
	res.redirect(instagramApi.get_authorization_url(config.intagram_redirect_uri));
});

/* Set cookie once Instagram sends back access code */
route.get('/handleauth', function (req,res) {
	instagramApi.authorize_userAsync(req.query.code, config.intagram_redirect_uri)
			.then(function (result) {
				res.cookie('instaToken', result.access_token, {maxAge: 900000, httpOnly: true });
				res.redirect('/');
			})
			.catch(function (err) {
				console.log(err);
			})
});

route.get('/', function(req, res){
	if(req.cookies.instaToken) {
		instagramApi.use({access_token: req.cookies.instaToken});
		//Grab last 50 images from Instagram account
		return instagramApi.user_self_media_recentAsync(50)
				//Spread - like calling .then, but the fulfillment value must be an array
				.spread(function (medias, pagination, remaining, limit) {
					//Generate Random number for the array index
					return instagramApi.mediaAsync(medias[Math.floor(Math.random() * medias.length - 1) + 1])
				})
				.then(function (image) {
					res.render('index', {
						image: image[0].images.standard_resolution.url
					});
				})
				.catch(function (errors) {
					console.log(errors);
				});
	} else {
		res.render('index', {
			//Trigger to show Instagram login form
			showLogin: true
		})
	}
});

