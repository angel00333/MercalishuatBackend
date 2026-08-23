const cloudinary =
  require('../config/cloudinary');

const pool =
  require('../config/db');


const subirBuffer = (buffer) => {
  return new Promise(
    (resolve, reject) => {
      const stream =
        cloudinary.uploader.upload_stream(
          {
            folder:
              'mercalishuat/emprendimientos',

            resource_type: 'image',

            transformation: [
              {
                width: 1000,
                height: 1000,
                crop: 'limit',
                quality: 'auto',
                fetch_format: 'auto',
              },
            ],
          },

          (error, resultado) => {
            if (error) {
              reject(error);
            } else {
              resolve(resultado);
            }
          }
        );

      stream.end(buffer);
    }
  );
};


const subirImagenEmprendimiento =
  async (req, res) => {
    try {
      const usuarioId =
        req.usuario.id;

      if (!req.file) {
        return res.status(400).json({
          message:
            'Debes seleccionar una imagen',
        });
      }

      const resultado =
        await pool.query(
          `
          SELECT
            id,
            imagen_public_id

          FROM emprendimientos

          WHERE usuario_id = $1
          `,
          [usuarioId]
        );

      if (
        resultado.rows.length === 0
      ) {
        return res.status(404).json({
          message:
            'Primero debes crear tu emprendimiento',
        });
      }

      const tienda =
        resultado.rows[0];

      const imagen =
        await subirBuffer(
          req.file.buffer
        );

      await pool.query(
        `
        UPDATE emprendimientos

        SET
          imagen_url = $1,
          imagen_public_id = $2

        WHERE id = $3
        `,
        [
          imagen.secure_url,
          imagen.public_id,
          tienda.id,
        ]
      );

      if (
        tienda.imagen_public_id
      ) {
        try {
          await cloudinary.uploader
              .destroy(
                tienda.imagen_public_id
              );
        } catch (_) {}
      }

      return res.json({
        message:
          'Imagen del emprendimiento actualizada',

        imagen_url:
          imagen.secure_url,
      });

    } catch (error) {
      console.error(
        'Error subiendo imagen del emprendimiento:',
        error
      );

      return res.status(500).json({
        message:
          error.message ||
          'No se pudo subir la imagen',
      });
    }
  };


module.exports = {
  subirImagenEmprendimiento,
};