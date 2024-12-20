const AWS = require('aws-sdk');
const multer = require('multer');
const fs = require('fs');
const uuid = require('uuid/v1');
const path = require('path');

const {
  accessKeyId,
  secretAccessKey,
  region,
  bucketName,
  mimetypes,
} = require('../../../config');


AWS.config.update({
  accessKeyId,
  secretAccessKey,
  region,
});

const s3 = new AWS.S3({ region, signatureVersion: 'v4' });

const destination = path.resolve(__dirname, '..', '..', '..', 'public', 'temp');
if (!fs.existsSync(destination)) fs.mkdirSync(destination);

const storage = multer.diskStorage({
  destination,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${basename}-${Date.now()}${ext}`);
  },
});

const upload = multer({ storage }).single('file');

module.exports.getUploadUrl = async (req, res) => {
  try {
    const {
      type, ext,
    } = req.body;
    const key = `uploads/${req.user._id}/${uuid()}.${ext}`;
    if (!mimetypes.includes(ext.toLowerCase())) throw new InvalidParameterError('File type not supported!');
    const params = { Bucket: bucketName, ContentType: type, Key: key };

    const url = await s3.getSignedUrl('putObject', params);
    const data = { url, key };
    return res.send({ status: true, data });
  } catch (err) { return req.errFunc(err); }
};


module.exports.uploadSingleImage = async (req, res) => {
  try {
    const { name, mimetype: ContentType } = req.files.file;
    const ext = name.split('.').pop();
    let userId =  req.user?._id || req.session.user?._id
    const key = `uploads/${userId}/${uuid()}.${ext}`;
    if (!mimetypes.includes(ext.toLowerCase())) throw new InvalidParameterError('File type not supported!');

    const data = req.files.file.data
    const params = {
      Bucket: bucketName, Body: data, Key: key, ContentType,
    };

    s3.upload(params, function (err, data) {
      if(err){
        return res.send({ status: false, err });
      }
      return res.send({ status: true, data });
    });

  } catch (err) { return req.errFunc(err); }
};

module.exports.deleteSingleFile = async (req, res) => {
  try {
    const key = req.body.key
    const params = {
      Bucket: bucketName, Key: key
    };

    s3.deleteObject(params, function (err, data) {
      if(err) {
        console.log(err, '<<<<<<<<<<<<<error')
        return res.send({status: false, error: err})
      }
      console.log('============> ', data)
      return res.send({ status: true, data });
    })

  } catch (err) { return req.errFunc(err); }
};


module.exports.uploadMultipleFiles = async (req, res) => {
  try {
    let userId =  req.user?._id || req.session.user?._id
    const files = req.files.files
    let ResponseData = []
    let filesArray = []
    if (Array.isArray(files)) {
      filesArray = files
    } else {
      filesArray.push(files)
    }

    filesArray.map((item) => {
      const { name, mimetype: ContentType } = item;
      const ext = name?.split('.').pop();
      const key = `uploads/${userId}/${uuid()}.${ext}`;
      if (!mimetypes.includes(ext.toLowerCase())) throw new InvalidParameterError('File type not supported!');

      var params = {
        Bucket: bucketName,
        Key: key,
        Body: item.data
      };

      s3.upload(params, function (err, data) {
        if (err) {
          console.log('===> err ', err)
          res.send({ "status": false, "error": err });
        } else {
          ResponseData.push(data);

          if (ResponseData.length == filesArray.length) {
            return res.send({ "status": true, "Message": "File Uploaded SuceesFully", Data: ResponseData });
          }
        }
      })
    })
  } catch (err) {
    return req.errFunc(err);
  };
}

module.exports.uploadAdminMultipleFiles = async (req, res) => {
  try {
    let userId =  req.user?._id || req.session.user?._id
    const files = req.files.files
    let ResponseData = []
    let filesArray = []
    if (Array.isArray(files)) {
      filesArray = files
    } else {
      filesArray.push(files)
    }

    filesArray.map((item) => {
      const { name, mimetype: ContentType } = item;
      const ext = name?.split('.').pop();
      const key = `uploads/${userId}/${uuid()}.${ext}`;
      
      var params = {
        Bucket: bucketName,
        Key: key,
        Body: item.data
      };

      s3.upload(params, function (err, data) {
        if (err) {
          console.log('===> err ', err)
          res.send({ "status": false, "error": err });
        } else {
          ResponseData.push(data);

          if (ResponseData.length == filesArray.length) {
            return res.send({ "status": true, "Message": "File Uploaded SuceesFully", Data: ResponseData });
          }
        }
      })
    })
  } catch (err) {
    return req.errFunc(err);
  };
}

module.exports.uploadImageAndroid = (req, res) => {
  upload(req, res, () => {
    try {
      const { _id } = req.user;
      const { filename, mimetype: ContentType, path: filePath } = req.file;

      const ext = filename.split('.').pop();

      if (!ext || !mimetypes.includes(ext)) throw req.ykError('Invalid or unsupported file!');

      const key = `uploads/${_id}/${uuid()}.${ext}`;

      if (!fs.existsSync(filePath)) throw req.ykError('File not found!');

      const data = fs.readFileSync(filePath);

      const params = {
        Bucket: bucketName, Body: data, Key: key, ContentType,
      };

      return s3.putObject(params, (err) => {
        fs.unlinkSync(filePath);
        if (err) return req.errFunc();

        return res.send({ status: true, message: 'Image added successfully!', data: { key } });
      });
    } catch (err) { return req.errFunc(err); }
  });
};

module.exports.uploadVideoFile = async (req, res) => {
  try {
    const { name, mimetype: ContentType } = req.files.file;
    const ext = name.split(".").pop();
    const key = `uploads/${req.user._id}/${uuid()}.${ext}`;
    const data = req.files.file.data;
    const params = {
      Bucket: bucketName,
      Body: data,
      Key: key,
      ContentType
    };
    s3.upload(params, function (err, data) {
      return res.send({ status: true, data });
    })
  } catch (err) {
    return req.errFunc(err);
  }
}

module.exports.uploadJd = async (req, res) => {
  try {
    const { name, mimetype: ContentType } = req.files.file;
    const ext = name.split(".").pop();
    let key = `uploads/${req.user._id}/${uuid()}.${ext}`;
    if(req.body.path){
      key = `uploads/${req.body.path}/${req.user._id}/${uuid()}.${ext}`;
    }
    const data = req.files.file.data;
    const params = {
      Bucket: bucketName,
      Body: data,
      Key: key,
      ContentType
    };
    s3.upload(params, function (err, data) {
      if(err) {
        return res.send({status: false, error: err})
      }
      return res.send({ status: true, data });
    })
  } catch (err) {
    return req.errFunc(err);
  }
}

