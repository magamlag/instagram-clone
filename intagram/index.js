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
router.get('/authorize-user', function (req, res) {
	instagramApi({
		client_id    : config.intagram_client_id,
		client_secret: config.intagram_client_secret
	});
	res.redirect(instagramApi.get_authorization_url(config.intagram_redirect_uri));
});

/* Set cookie once Instagram sends back access code */
router.get('/handleauth', function (req, res) {
	instagramApi.authorize_userAsync(req.query.code, config.intagram_redirect_uri)
			.then(function (result) {
				res.cookie('instaToken', result.access_token, {maxAge: 900000, httpOnly: true});
				res.redirect('/');
			})
			.catch(function (err) {
				console.log(err);
			})
});

router.get('/', function (req, res) {
	if (req.cookies.instaToken) {
		instagramApi.use({access_token: req.cookies.instaToken});
		//Grab last 50 images from Instagram account
		return instagramApi.user_self_media_recentAsync(50)
		//Spread - like calling .then, but the fulfillment value must be an array
				.spread(function (medias, pagination, remaining, limit) {
					//Generate Random number for the array index and
					//get URL of the images using 'mediaAsync'
					return instagramApi.mediaAsync(medias[Math.floor(Math.random() * medias.length - 1) + 1])
				})
				.then(function (image) {
					res.render('index', {
						image: image[0].images.standard_resolution.url,
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

//Create Photo and Send to Lob
router.post('/send-photo', function (req, res) {
	//Read file sync from '/photo.html' and convert to String
	var photoTemplate = fs.readFileSync(__dirname + '/photo.html').toString();
	//Create address using data from request body
	return Lob.addresses.create({
		name           : req.body.name,
		address_line1  : req.body.address,
		address_city   : req.body.city,
		address_state  : req.body.state,
		address_zip    : req.body.zip,
		address_country: 'US',
	}).then(function (address) {
		//Handle creation of photo
		return Lob.jobs.create({
			description: 'Instagram Photo',
			to         : address.id,
			from       : address.id,
			objects    : [{
				file    : photoTemplate,
				data    : {image: req.body.image},
				settings: 503
			}]
		});
		//Pass object(for example: poster)
	}).then(function (results) {
		//Rendering HTML view - complete
		res.render('complete', {url: results.objects[0].url});
	}).catch(function (errors) {
		res.render('complete', {error: errors.message})
	});
})

module.exports = router;
