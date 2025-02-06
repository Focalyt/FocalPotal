const AWS = require('aws-sdk');
const multer = require('multer');
const fs = require('fs');
const uuid = require('uuid/v1');
const path = require('path');
// const mongoose = require('mongoose');
const Post = require('../../models/post'); // PostSchema import करें

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
// Define the custom error
class InvalidParameterError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvalidParameterError';
  }
}

const s3 = new AWS.S3({ region, signatureVersion: 'v4' });
const allowedVideoExtensions = ['mp4', 'mkv', 'mov', 'avi', 'wmv'];
const allowedImageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];

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

module.exports.uploadPostFiles = async (req, res) => {
  try {
    // Validate user authentication
    const userId = req.user?._id || req.session?.user?._id;
    const userType = req.user?.userType || req.session?.user?.userType || req.body?.userType || "admin";
    let postdata = JSON.parse(req.body.data);
    const tags = postdata.map(item => ({
      userId: item._id,
      name: item.name,
      userType: item.userType
    }));

    if (!userId || !userType) {
      return res.status(401).send({
        status: false,
        message: 'User not authenticated',
      });
    }

    const files = req.files?.files;
    if (!files) {
      return res.status(400).send({
        status: false,
        message: 'No files uploaded',
      });
    }

    const content = req.body?.content;
    if (!content) {
      return res.status(400).send({
        status: false,
        message: 'Post content is required',
      });
    }

    const filesArray = Array.isArray(files) ? files : [files];
    const uploadedFiles = [];
    const uploadPromises = [];

    // Process and upload files
    filesArray.forEach((item) => {
      const { name, mimetype } = item;
      const ext = name?.split('.').pop().toLowerCase();

      console.log(`Processing File: ${name}, Extension: ${ext}`);

      // Validate file type
      if (!allowedImageExtensions.includes(ext) && !allowedVideoExtensions.includes(ext)) {
        throw new Error(
          `File type not supported: ${ext}. Allowed types are ${[
            ...allowedImageExtensions,
            ...allowedVideoExtensions,
          ].join(', ')}`
        );
      }

      // Determine fileType
      const fileType = allowedImageExtensions.includes(ext) ? 'image' : 'video';

      // Set S3 Key (path) based on file type
      const key = `post/${userId}/${fileType}s/${uuid()}.${ext}`;
      const params = {
        Bucket: bucketName,
        Key: key,
        Body: item.data,
        ContentType: mimetype,
      };

      // Upload to S3
      uploadPromises.push(
        s3.upload(params).promise().then((uploadResult) => {
          uploadedFiles.push({
            fileURL: uploadResult.Location,
            fileType, // Only 'image' or 'video'
          });
        })
      );
    });

    // Wait for all uploads to complete
    await Promise.all(uploadPromises);

    // Save post to MongoDB
    const newPost = new Post({
      content,
      files: uploadedFiles,
      createdBy: userId,
      userType,
      tags
    });

    const savedPost = await newPost.save();

    return res.send({
      status: true,
      message: 'Post created successfully',
      data: savedPost,
    });
  } catch (err) {
    console.error('Error uploading files:', err);
    return res.status(500).send({
      status: false,
      message: err.message || 'Internal Server Error',
    });
  }
};

module.exports.editPost = async (req, res) => {
  try {
    const userId = req.user?._id || req.session?.user?._id;
    if (!userId) {
      return res.status(401).send({ status: false, message: 'Unauthorized' });
    }

    const { id, content, tags } = req.body;
    const existingFiles = JSON.parse(req.body.existingFiles || '[]');
    const parsedTags = JSON.parse(tags || '[]');
    
    const updateData = {
      content,
      tags: parsedTags.map(tag => ({
        userId: tag._id,
        name: tag.name,
        userType: tag.userType
      }))
    };

    // Handle new file uploads
    if (req.files?.files) {
      const files = Array.isArray(req.files.files) ? req.files.files : [req.files.files];
      const uploadedFiles = [];
      const uploadPromises = [];

      files.forEach((item) => {
        const { name, mimetype } = item;
        const ext = name?.split('.').pop().toLowerCase();

        if (!allowedImageExtensions.includes(ext) && !allowedVideoExtensions.includes(ext)) {
          throw new Error(`Unsupported file type: ${ext}`);
        }

        const fileType = allowedImageExtensions.includes(ext) ? 'image' : 'video';
        const key = `post/${userId}/${fileType}s/${uuid()}.${ext}`;
        
        uploadPromises.push(
          s3.upload({
            Bucket: bucketName,
            Key: key,
            Body: item.data,
            ContentType: mimetype,
          }).promise().then((uploadResult) => {
            uploadedFiles.push({
              fileURL: uploadResult.Location,
              fileType
            });
          })
        );
      });

      await Promise.all(uploadPromises);
      
      // Combine existing and new files
      updateData.files = [...existingFiles, ...uploadedFiles];
    } else {
      updateData.files = existingFiles;
    }

    const updatedPost = await Post.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedPost) {
      return res.status(404).send({ status: false, message: 'Post not found' });
    }

    res.send({
      status: true,
      message: 'Post updated successfully',
      data: updatedPost
    });

  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).send({
      status: false,
      message: error.message || 'Internal Server Error'
    });
  }
};

module.exports.getUploadUrl = async (req, res) => {
  try {
    const {
      type, ext,
    } = req.body;
    const key = `post/${req.user._id}/${uuid()}.${ext}`;
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
    let userId = req.user?._id || req.session.user?._id
    const key = `post/${userId}/${uuid()}.${ext}`;
    if (!mimetypes.includes(ext.toLowerCase())) throw new InvalidParameterError('File type not supported!');

    const data = req.files.file.data
    const params = {
      Bucket: bucketName, Body: data, Key: key, ContentType,
    };

    s3.upload(params, function (err, data) {
      if (err) {
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
      if (err) {
        console.log(err, '<<<<<<<<<<<<<error')
        return res.send({ status: false, error: err })
      }
      console.log('============> ', data)
      return res.send({ status: true, data });
    })

  } catch (err) { return req.errFunc(err); }
};


module.exports.uploadPostMultipleFiles = async (req, res) => {
  try {
    // Validate user authentication
    const userId = req.params.userId || req.session.user?._id;
    if (!userId) {
      return res.status(401).send({
        status: false,
        message: 'User not authenticated',
      });
    }

    // Validate file existence
    const files = req.files?.files;
    if (!files) {
      return res.status(400).send({
        status: false,
        message: 'No files uploaded',
      });
    }

    // Handle single or multiple files
    const filesArray = Array.isArray(files) ? files : [files];
    const ResponseData = [];
    const uploadPromises = [];

    // Process each file
    filesArray.forEach((item) => {
      const { name, mimetype } = item;
      const ext = name?.split('.').pop().toLowerCase();

      console.log(`Processing File: ${name}, Extension: ${ext}`);

      // Validate video file extension
      if (!allowedVideoExtensions.includes(ext)) {
        throw new Error(
          `File type not supported: ${ext}. Allowed types are ${allowedVideoExtensions.join(', ')}`
        );
      }

      const key = `post/${userId}/${uuid()}.${ext}`;
      const params = {
        Bucket: bucketName,
        Key: key,
        Body: item.data,
        ContentType: mimetype,
      };

      // Add S3 upload promise to the array
      uploadPromises.push(
        s3.upload(params).promise().then((uploadResult) => {
          ResponseData.push(uploadResult);
        })
      );
    });

    // Wait for all uploads to complete
    await Promise.all(uploadPromises);

    // Return success response
    return res.send({
      status: true,
      message: 'Video files uploaded successfully',
      data: ResponseData,
    });
  } catch (err) {
    console.error('Error uploading video files:', err);
    return res.status(500).send({
      status: false,
      message: err.message || 'Internal Server Error',
    });
  }
};

module.exports.uploadAdminMultipleFiles = async (req, res) => {
  try {
    let userId = req.user?._id || req.session.user?._id
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
      const key = `post/${userId}/${uuid()}.${ext}`;

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

      const key = `post/${_id}/${uuid()}.${ext}`;

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

module.exports.uploadPostVideoFile = async (req, res) => {
  try {
    const { name, mimetype: ContentType } = req.files.file;
    const ext = name.split('.').pop().toLowerCase();
    const key = `post/${req.user._id}/${uuid()}.${ext}`;
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



