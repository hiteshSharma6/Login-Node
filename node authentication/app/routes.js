const multer = require('multer');
const fs = require('fs');
const encryptor = require('file-encryptor');
const MongoClient = require('mongodb').MongoClient;


module.exports = function(app, passport) {

	app.get('/', function(req, res) {
		res.render('index.hbs');
	});

	app.get('/profile', isLoggedIn, function(req, res) {
		res.render('profile.hbs', {
			user : req.user
		});
	});

	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});


		app.get('/login', function(req, res) {
			res.render('login.hbs', { message: req.flash('loginMessage') });
		});

		app.post('/login', passport.authenticate('local-login', {
			successRedirect : '/profile',
			failureRedirect : '/login',
			failureFlash : true
		}));


		app.get('/signup', function(req, res) {
			res.render('signup.hbs', { message: req.flash('loginMessage') });
		});

		app.post('/signup', passport.authenticate('local-signup', {
			successRedirect : '/profile',
			failureRedirect : '/signup',
			failureFlash : true
		}));

	// facebook

		app.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));

		app.get('/auth/facebook/callback',
			passport.authenticate('facebook', {
				successRedirect : '/profile',
				failureRedirect : '/'
			}));

	// twitter

		app.get('/auth/twitter', passport.authenticate('twitter', { scope : 'email' }));

		app.get('/auth/twitter/callback',
			passport.authenticate('twitter', {
				successRedirect : '/profile',
				failureRedirect : '/'
			}));


	// google

		app.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));

		app.get('/auth/google/callback',
			passport.authenticate('google', {
				successRedirect : '/profile',
				failureRedirect : '/'
			}));


	// locally
		app.get('/connect/local', function(req, res) {
			res.render('connect-local.hbs', { message: req.flash('loginMessage') });
		});
		app.post('/connect/local', passport.authenticate('local-signup', {
			successRedirect : '/profile',
			failureRedirect : '/connect/local',
			failureFlash : true
		}));

	// facebook

		app.get('/connect/facebook', passport.authorize('facebook', { scope : 'email' }));

		app.get('/connect/facebook/callback',
			passport.authorize('facebook', {
				successRedirect : '/profile',
				failureRedirect : '/'
			}));

	// twitter

		app.get('/connect/twitter', passport.authorize('twitter', { scope : 'email' }));

		app.get('/connect/twitter/callback',
			passport.authorize('twitter', {
				successRedirect : '/profile',
				failureRedirect : '/'
			}));


	// google

		app.get('/connect/google', passport.authorize('google', { scope : ['profile', 'email'] }));

		app.get('/connect/google/callback',
			passport.authorize('google', {
				successRedirect : '/profile',
				failureRedirect : '/'
			}));

	// local
	app.get('/unlink/local', function(req, res) {
		var user            = req.user;
		user.local.email    = undefined;
		user.local.password = undefined;
		user.save(function(err) {
			res.redirect('/profile');
		});
	});

	// facebook
	app.get('/unlink/facebook', function(req, res) {
		var user            = req.user;
		user.facebook.token = undefined;
		user.save(function(err) {
			res.redirect('/profile');
		});
	});

	// twitter
	app.get('/unlink/twitter', function(req, res) {
		var user           = req.user;
		user.twitter.token = undefined;
		user.save(function(err) {
			res.redirect('/profile');
		});
	});

	// google
	app.get('/unlink/google', function(req, res) {
		var user          = req.user;
		user.google.token = undefined;
		user.save(function(err) {
			res.redirect('/profile');
		});
	});
	
	app.get('/lib', (req, res) => {
		res.render('upload.hbs');
	});
	
	app.get('/upload/:collectionName', (req, res) => {
		res.render('uploads.hbs');
	});

	app.post('/upload/:collectionName', (req, res) => {

		//    res.render('uploads.hbs');

		var collectionName = req.params.collectionName;
		console.log(collectionName);
		var upload = multer({
			storage: storage,
			onFileUploadComplete: function (file) {
				console.log("File Uploaded");
				console.log(file);
			}

		}).single('userFile');

		upload(req, res, (err) => {
			if (!err)
				res.send('file uploaded');
			//        console.log(req.file);
			if (req.file) {
				encryptor.encryptFile(req.file.path, req.file.path + '.dat', key, function (err) {
					// Encryption complete.
					console.log("Encryption Complete");
					MongoClient.connect('mongodb://localhost:27017/Files', (err, client) => {

						if (err) {
							return console.log('unable to connect to database');
						}
						console.log('connected');
						var db = client.db('Files');
						db.collection(collectionName).insertOne({
							fileName: req.file.originalname,
							uploadedOn: new Date().toJSON()
						}, (err, result) => {
							if (err) return console.log("Unable to insert");

							console.log(JSON.stringify(result.ops, undefined, 2));
						});
						client.close();
					});


					fs.unlink(req.file.path, () => {
						//done
					});


				});
			}
		})


	});

	app.get('/download/:collectionName', (req, res) => {

		var collectionName = req.params.collectionName;
		MongoClient.connect('mongodb://localhost:27017/Files', (err, client) => {

			var db = client.db('Files');
			db.collection(collectionName).find().toArray().then((docs) => {
				res.send(docs);
			});

			client.close();
		});
	});

	app.get('/download/:collectionName/:tag', (req, res) => {
		console.log(req.params.tag);
		var fileTag = req.params.tag;
		var address = '../node authentication/uploads/';
		encryptor.decryptFile(address + fileTag + '.dat', address + fileTag, key, () => {
			//        console.log(decryptFile);
			var file = address + req.params.tag;
			res.download(file, () => {
				fs.unlink(file, () => {
					//       console.log("file deleted");
				});

			});
			console.log("file downloaded");
			//        res.send("Downloading");
		});
	});



};

var key = 'ac123tx';

var storage = multer.diskStorage({

    destination: function (req, file, callback) {
        callback(null, './uploads/');
    },

    filename: function (req, file, callback) {
        callback(null, file.originalname);
    }
});

function isLoggedIn(req, res, next) {
	if (req.isAuthenticated())
		return next();

	res.redirect('/');
}