const multer =
  require('multer');


// ============================================================
// STORAGE EN MEMORIA
// ============================================================

const storage =
  multer.memoryStorage();


// ============================================================
// TIPOS PERMITIDOS
// ============================================================

const tiposPermitidos =
  new Set([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ]);


// ============================================================
// FILTRO
// ============================================================

const fileFilter = (
  req,
  file,
  cb
) => {
  if (
    !tiposPermitidos.has(
      file.mimetype
    )
  ) {
    return cb(
      new Error(
        'Solo se permiten imágenes JPG, PNG o WEBP'
      )
    );
  }

  cb(
    null,
    true
  );
};


// ============================================================
// MULTER
// ============================================================

const upload =
  multer({
    storage,

    fileFilter,

    limits: {
      fileSize:
          5 * 1024 * 1024,

      files:
          5,
    },
  });


// ============================================================
// EXPORTACIONES
// ============================================================

module.exports = {
  subirImagenesLocal:
      upload.array(
        'imagenes',
        5
      ),
};