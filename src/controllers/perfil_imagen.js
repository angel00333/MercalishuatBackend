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
              'mercalishuat/perfiles',

            resource_type: 'image',

            transformation: [
              {
                width: 600,
                height: 600,
                crop: 'fill',
                gravity: 'face',
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


const subirFotoPerfil =
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

      const usuario =
        await pool.query(
          `
          SELECT
            foto_perfil_public_id

          FROM usuarios

          WHERE id = $1
          `,
          [usuarioId]
        );

      if (
        usuario.rows.length === 0
      ) {
        return res.status(404).json({
          message:
            'Usuario no encontrado',
        });
      }

      const anterior =
        usuario.rows[0]
            .foto_perfil_public_id;

      const imagen =
        await subirBuffer(
          req.file.buffer
        );

      await pool.query(
        `
        UPDATE usuarios

        SET
          foto_perfil_url = $1,
          foto_perfil_public_id = $2

        WHERE id = $3
        `,
        [
          imagen.secure_url,
          imagen.public_id,
          usuarioId,
        ]
      );

      if (anterior) {
        try {
          await cloudinary.uploader
              .destroy(anterior);
        } catch (_) {}
      }

      return res.json({
        message:
          'Foto de perfil actualizada',

        foto_perfil_url:
          imagen.secure_url,
      });

    } catch (error) {
      console.error(
        'Error subiendo foto de perfil:',
        error
      );

      return res.status(500).json({
        message:
          error.message ||
          'No se pudo subir la foto',
      });
    }
  };


module.exports = {
  subirFotoPerfil,
};