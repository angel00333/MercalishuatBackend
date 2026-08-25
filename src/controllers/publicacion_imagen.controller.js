const cloudinary =
  require('../config/cloudinary');

const pool =
  require('../config/db');


const subirBuffer = (
  buffer
) => {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const stream =
          cloudinary.uploader
              .upload_stream(
        {
          folder:
            'mercalishuat/publicaciones',

          resource_type:
            'image',

          transformation: [
            {
              width: 1400,
              height: 1400,
              crop: 'limit',
              quality: 'auto',
              fetch_format: 'auto',
            },
          ],
        },

        (
          error,
          resultado
        ) => {
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


const subirImagen = async (
  req,
  res
) => {
  try {
    const usuarioId =
        req.usuario.id;

    const {
      id,
    } = req.params;

    if (!req.file) {
      return res.status(400).json({
        message:
          'Selecciona una imagen',
      });
    }

    const publicacion =
        await pool.query(
      `
      SELECT p.id

      FROM publicaciones p

      INNER JOIN emprendimientos e
        ON e.id = p.emprendimiento_id

      WHERE p.id = $1
        AND e.usuario_id = $2
      `,
      [
        id,
        usuarioId,
      ]
    );

    if (
      publicacion.rows.length === 0
    ) {
      return res.status(403).json({
        message:
          'No puedes modificar esta publicación',
      });
    }

    const cantidad =
        await pool.query(
      `
      SELECT COUNT(*)::INTEGER AS total

      FROM imagenes_publicacion

      WHERE publicacion_id = $1
      `,
      [id]
    );

    if (
      cantidad.rows[0].total >= 5
    ) {
      return res.status(400).json({
        message:
          'Máximo 5 imágenes por publicación',
      });
    }

    const imagen =
        await subirBuffer(
      req.file.buffer
    );

    const resultado =
        await pool.query(
      `
      INSERT INTO imagenes_publicacion
      (
        publicacion_id,
        url,
        public_id,
        orden
      )

      VALUES (
        $1,
        $2,
        $3,
        $4
      )

      RETURNING *
      `,
      [
        id,
        imagen.secure_url,
        imagen.public_id,
        cantidad.rows[0].total,
      ]
    );

    return res.status(201).json({
      message:
        'Imagen subida',

      imagen:
        resultado.rows[0],
    });

  } catch (error) {
    console.error(
      'Error subiendo imagen de publicación:',
      error
    );

    return res.status(500).json({
      message:
        error.message ||
        'No se pudo subir la imagen',
    });
  }
};


const eliminarImagen = async (
  req,
  res
) => {
  try {
    const usuarioId =
        req.usuario.id;

    const {
      id,
      imagenId,
    } = req.params;

    const resultado =
        await pool.query(
      `
      SELECT ip.*

      FROM imagenes_publicacion ip

      INNER JOIN publicaciones p
        ON p.id = ip.publicacion_id

      INNER JOIN emprendimientos e
        ON e.id = p.emprendimiento_id

      WHERE ip.id = $1
        AND ip.publicacion_id = $2
        AND e.usuario_id = $3
      `,
      [
        imagenId,
        id,
        usuarioId,
      ]
    );

    if (
      resultado.rows.length === 0
    ) {
      return res.status(404).json({
        message:
          'Imagen no encontrada',
      });
    }

    const imagen =
        resultado.rows[0];

    await cloudinary.uploader.destroy(
      imagen.public_id
    );

    await pool.query(
      `
      DELETE FROM imagenes_publicacion
      WHERE id = $1
      `,
      [imagenId]
    );

    return res.json({
      message:
        'Imagen eliminada',
    });

  } catch (error) {
    console.error(
      'Error eliminando imagen:',
      error
    );

    return res.status(500).json({
      message:
        'Error interno del servidor',
    });
  }
};


module.exports = {
  subirImagen,
  eliminarImagen,
};