const multer = require('multer');

const storage =
  multer.memoryStorage();

const extensionesPermitidas = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
];

const tiposPermitidos = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

const filtroImagen = (
  req,
  file,
  cb
) => {
  const nombre =
    file.originalname.toLowerCase();

  const extensionCorrecta =
    extensionesPermitidas.some(
      (extension) =>
        nombre.endsWith(extension)
    );

  const tipoCorrecto =
    tiposPermitidos.includes(
      file.mimetype
    );

  // Algunos clientes web pueden mandar
  // application/octet-stream aunque
  // el archivo tenga extensión correcta.
  const tipoGenerico =
    file.mimetype ===
    'application/octet-stream';

  if (
    extensionCorrecta &&
    (tipoCorrecto ||
      tipoGenerico)
  ) {
    return cb(
      null,
      true
    );
  }

  return cb(
    new Error(
      'Solo se permiten imágenes JPG, PNG o WEBP'
    ),
    false
  );
};

const upload = multer({
  storage,

  limits: {
    fileSize:
      5 * 1024 * 1024,
  },

  fileFilter:
    filtroImagen,
});

module.exports = upload;