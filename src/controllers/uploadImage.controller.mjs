import aws from "aws-sdk";
aws.config.update({
  region: "us-east-1",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});
const S3_BUCKET = process.env.S3_BUCKET_NAME;

const getUploadSignature = async (req, res, next) => {
  const arrayData = req.body.dataArray;
  try {
    let requestDataArray = [];
    for (let i = 0; i < arrayData.length; i++) {
      const s3 = new aws.S3();
      let item = arrayData[i];
      const fileName = item.fileName;
      const fileType = item.fileType;

      const s3Params = {
        Bucket: S3_BUCKET,
        Key: fileName,
        Expires: 3000,
        ContentType: fileType,
        ContentEncoding: "base64",
        ACL: "public-read",
      };
      const data = await s3.getSignedUrlPromise("putObject", s3Params);
      const requestData = {
        signedUrl: data,
        url: `https://${S3_BUCKET}.s3.amazonaws.com/${fileName}`,
      };
      requestDataArray.push(requestData);
    }
    return res.status(200).send(requestDataArray);
  } catch (e) {
    next(e.message);
  }
};

export { getUploadSignature };
