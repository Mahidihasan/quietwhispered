import imageCompression from 'browser-image-compression';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const getCloudinaryConfig = () => {
  const cloudName =
    process.env.REACT_APP_CLOUDINARY_CLOUD_NAME ||
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset =
    process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET ||
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary env vars are missing.');
  }

  return { cloudName, uploadPreset };
};

export const uploadImageToCloudinary = async (file, options = {}) => {
  const { folder = 'journal-images', onProgress } = options;

  if (!file) {
    throw new Error('No file selected.');
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Only JPG, PNG, and WEBP images are allowed.');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File is too large. Max 5MB allowed.');
  }

  const compressed = await imageCompression(file, {
    maxSizeMB: 1.5,
    maxWidthOrHeight: 2000,
    useWebWorker: true
  });

  const { cloudName, uploadPreset } = getCloudinaryConfig();
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;

  const formData = new FormData();
  formData.append('file', compressed);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', folder);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) return;
      const percent = Math.round((event.loaded / event.total) * 100);
      onProgress(percent);
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const res = JSON.parse(xhr.responseText);
        resolve(res.secure_url);
      } else {
        reject(new Error(`Upload failed: ${xhr.statusText || xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload.'));

    xhr.open('POST', url, true);
    xhr.send(formData);
  });
};
