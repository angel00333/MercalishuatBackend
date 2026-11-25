const multer =
  require('multer');

const path =
  require('path');


// ============================================================
// STORAGE EN MEMORIA
// ============================================================

const storage =
  multer.memoryStorage();


// ============================================================
// TIPOS Y EXTENSIONES PERMITIDOS
//
// Android/Web pueden enviar una imagen válida como
// application/octet-stream. Por eso validamos MIME y, cuando el
// MIME es genérico, usamos también la extensión original.
// ============================================================

const tiposPermitidos =
  new Set([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ]);

const extensionesPermitidas =
  new Set([
    '.jpg',
    '.jpeg',
    '.png',
    '.webp',
  ]);


// ============================================================
// FILTRO
// ============================================================

const fileFilter = (
  req,
  file,
  cb
) => {
  const mimetype =
    String(
      file.mimetype || ''
    )
      .trim()
      .toLowerCase();

  const extension =
    path
      .extname(
        String(
          file.originalname || ''
        )
      )
      .trim()
      .toLowerCase();

  const mimeValido =
    tiposPermitidos.has(
      mimetype
    );

  const mimeGenerico =
    !mimetype ||
    mimetype ===
      'application/octet-stream';

  const extensionValida =
    extensionesPermitidas.has(
      extension
    );

  if (
    mimeValido ||
    (
      mimeGenerico &&
      extensionValida
    )
  ) {
    return cb(
      null,
      true
    );
  }

  return cb(
    new Error(
      'Solo se permiten imágenes JPG, JPEG, PNG o WEBP'
    )
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
