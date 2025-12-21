import cloudinary from '../config/cloudinary.js';
import { Readable } from 'stream';

const uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const file = req.file;
    const isVideo = file.mimetype.startsWith('video/');
    const resourceType = isVideo ? 'video' : 'image';

    // Convert buffer to stream
    const bufferStream = new Readable();
    bufferStream.push(file.buffer);
    bufferStream.push(null);

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: resourceType,
          folder: 'journal',
          transformation: resourceType === 'image' ? [
            { quality: 'auto', fetch_format: 'auto' }
          ] : undefined
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      bufferStream.pipe(uploadStream);
    });

    res.status(200).json({
      success: true,
      data: {
        url: result.secure_url,
        public_id: result.public_id,
        type: resourceType
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload media'
    });
  }
};

const deleteMedia = async (req, res) => {
  try {
    const { public_id, resource_type } = req.body;

    if (!public_id) {
      return res.status(400).json({
        success: false,
        message: 'Public ID is required'
      });
    }

    await cloudinary.uploader.destroy(public_id, {
      resource_type: resource_type || 'image'
    });

    res.status(200).json({
      success: true,
      message: 'Media deleted successfully'
    });

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete media'
    });
  }
};

export { uploadMedia, deleteMedia };
