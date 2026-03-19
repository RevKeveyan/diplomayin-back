const multer = require('multer');

const storage = multer.diskStorage({
    destination(req, file, cb){
            cb(null, 'public/images');
        },
    filename(req,  file, cb ){
        cb(null, Date.now().toString()+'-'+file.originalname);
    }
});

module.exports = multer({storage});
    