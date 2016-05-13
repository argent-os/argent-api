module.exports = function (app, options) {

	var endpoint = {
		version: '/v1',
		base: '/cloudinary',
		upload: '/upload'		     
	};

  	var userController = require('../auth/controllers/user-controller');
	var log4js = require('log4js');
	var logger = log4js.getLogger();
	var cors = require('cors');
	var bodyParser = require('body-parser');
	var expressValidator = require('express-validator');
	var multer  = require('multer')
	var upload = multer({ dest: 'images/' })
	app.use(cors());
	app.use(bodyParser.json());
	app.use(expressValidator());

	var cloudinary = require('cloudinary');
	cloudinary.config({ 
	  cloud_name: process.env.APP_NAME, 
	  api_key: process.env.CLOUDINARY_KEY, 
	  api_secret: process.env.CLOUDINARY_SECRET 
	});

	// TODO: Secure endpoints with JWT Authentication middleware

	function deleteFileInCloudinary(pictureId) {
		cloudinary.uploader.destroy(pictureId, function(result) { logger.info(result) });
	}

	function uploadFileInCloudinary(path, userId, callback) {
	    if(path && (path != undefined)) {
			cloudinary.uploader.upload(path, 
				function(picture, err) { 
		            if(err) {
		            	logger.error(err);
		            }
		            // logger.info("successfully uploaded image");
		            var pic = {
		            	id: picture.public_id,
		            	url: picture.url,
		            	secure_url: picture.secure_url
		            }
		            updateUserPicture(userId, pic);
				}, { transformation: [{ width: 500, height: 500, crop: "fit", gravity: "face" }] }
			);
	    } else {
	        logger.error("error");
	    }
	}

	function updateUserPicture(uid, pic) {
		userController.editUserPicture(uid, pic)
	}

	// /v1/cloudinary/:uid/upload
	// note the file multipart name must be 'avatar'
	app.post(endpoint.version + endpoint.base + "/:uid" + endpoint.upload, upload.single('avatar'), function(req, res) {
	    // logger.info(req.file);
	    // pass in a path to upload to cloudinary, remove existing user image first!
	    var user_id = req.params.uid;
		userController.getUser(user_id).then(function (user) { 
			if(user.picture != undefined) {
				deleteFileInCloudinary(user.picture.id)
			}
		    uploadFileInCloudinary(req.file.path, user_id);
	    })

	    res.json({img: req.file})
	});
	 
	 
	app.get(endpoint.version + endpoint.base + "/:uid" + endpoint.upload + "/:file", function (req, res){
        file = req.params.file;
        var dirname = "/home/sinan/node/file-upload";
        var img = fs.readFileSync(dirname + "/uploads/" + file);
        res.writeHead(200, {'Content-Type': 'image/jpg' });
        res.end(img, 'binary');
	});

	return;
};