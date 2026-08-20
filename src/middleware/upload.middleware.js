const multer = require('multer');

const storage = multer.memoryStorage();

const filtroImagen = (req, file, cb) => {
  const tiposPermitidos = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  if (!tiposPermitidos.includes(file.mimetype)) {
    return cb(
      new Error(
        'Solo se permiten imágenes JPG, PNG o WEBP'
      ),
      false
    );
  }

  cb(null, true);
};

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: filtroImagen,
});

module.exports = upload;