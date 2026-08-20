const cloudinary =
  require('../config/cloudinary');

const pool =
  require('../config/db');


// ==========================================
// SUBIR BUFFER A CLOUDINARY
// ==========================================

const subirBuffer = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream =
      cloudinary.uploader.upload_stream(
        {
          folder: 'mercalishuat/productos',

          resource_type: 'image',

          transformation: [
            {
              width: 1600,
              height: 1600,
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
  });
};


// ==========================================
// VERIFICAR QUE EL PRODUCTO SEA DEL USUARIO
// ==========================================

const obtenerProductoDelUsuario =
  async (productoId, usuarioId) => {

    const resultado =
      await pool.query(
        `
        SELECT
          p.id,
          p.emprendimiento_id

        FROM productos p

        INNER JOIN emprendimientos e
          ON e.id = p.emprendimiento_id

        WHERE p.id = $1
          AND e.usuario_id = $2
        `,
        [
          productoId,
          usuarioId,
        ]
      );

    return resultado.rows[0] || null;
  };


// ==========================================
// SUBIR IMAGEN
// ==========================================

const subirImagenProducto =
  async (req, res) => {

    let resultadoCloudinary = null;

    try {

      const usuarioId =
        req.usuario.id;

      const {
        productoId,
      } = req.params;


      if (!req.file) {

        return res.status(400).json({
          message:
            'Debes seleccionar una imagen',
        });
      }


      const producto =
        await obtenerProductoDelUsuario(
          productoId,
          usuarioId
        );


      if (!producto) {

        return res.status(404).json({
          message:
            'Producto no encontrado o no pertenece a tu tienda',
        });
      }


      // ======================================
      // LIMITAR A 5 IMÁGENES
      // ======================================

      const cantidad =
        await pool.query(
          `
          SELECT COUNT(*)::INTEGER AS total

          FROM imagenes

          WHERE producto_id = $1
          `,
          [productoId]
        );


      if (cantidad.rows[0].total >= 5) {

        return res.status(400).json({
          message:
            'El producto ya tiene el máximo de 5 imágenes',
        });
      }


      // ======================================
      // SUBIR A CLOUDINARY
      // ======================================

      resultadoCloudinary =
        await subirBuffer(
          req.file.buffer
        );


      // ======================================
      // PRIMERA FOTO = PRINCIPAL
      // ======================================

      const esPrincipal =
        cantidad.rows[0].total === 0;


      const resultado =
        await pool.query(
          `
          INSERT INTO imagenes
          (
            producto_id,
            url,
            public_id,
            principal
          )

          VALUES
          ($1, $2, $3, $4)

          RETURNING
            id,
            producto_id,
            url,
            public_id,
            principal,
            fecha_creacion
          `,
          [
            productoId,
            resultadoCloudinary.secure_url,
            resultadoCloudinary.public_id,
            esPrincipal,
          ]
        );


      return res.status(201).json({

        message:
          'Imagen subida correctamente',

        imagen:
          resultado.rows[0],
      });


    } catch (error) {

      console.error(
        'Error subiendo imagen:',
        error
      );


      // Si Cloudinary recibió la imagen
      // pero PostgreSQL falló, la eliminamos.
      if (resultadoCloudinary?.public_id) {

        try {

          await cloudinary.uploader.destroy(
            resultadoCloudinary.public_id
          );

        } catch (errorEliminar) {

          console.error(
            'Error limpiando Cloudinary:',
            errorEliminar
          );
        }
      }


      return res.status(500).json({
        message:
          'No se pudo subir la imagen',
      });
    }
  };


// ==========================================
// LISTAR IMÁGENES DEL PRODUCTO
// ==========================================

const listarImagenesProducto =
  async (req, res) => {

    try {

      const {
        productoId,
      } = req.params;


      const resultado =
        await pool.query(
          `
          SELECT
            id,
            url,
            principal

          FROM imagenes

          WHERE producto_id = $1

          ORDER BY
            principal DESC,
            id ASC
          `,
          [productoId]
        );


      return res.json({
        imagenes:
          resultado.rows,
      });


    } catch (error) {

      console.error(
        'Error obteniendo imágenes:',
        error
      );


      return res.status(500).json({
        message:
          'Error interno del servidor',
      });
    }
  };


// ==========================================
// ESTABLECER FOTO PRINCIPAL
// ==========================================

const establecerImagenPrincipal =
  async (req, res) => {

    const client =
      await pool.connect();


    try {

      const usuarioId =
        req.usuario.id;

      const {
        productoId,
        imagenId,
      } = req.params;


      const producto =
        await obtenerProductoDelUsuario(
          productoId,
          usuarioId
        );


      if (!producto) {

        return res.status(404).json({
          message:
            'Producto no encontrado',
        });
      }


      await client.query(
        'BEGIN'
      );


      const imagen =
        await client.query(
          `
          SELECT id

          FROM imagenes

          WHERE id = $1
            AND producto_id = $2
          `,
          [
            imagenId,
            productoId,
          ]
        );


      if (imagen.rows.length === 0) {

        await client.query(
          'ROLLBACK'
        );

        return res.status(404).json({
          message:
            'Imagen no encontrada',
        });
      }


      await client.query(
        `
        UPDATE imagenes

        SET principal = FALSE

        WHERE producto_id = $1
        `,
        [productoId]
      );


      await client.query(
        `
        UPDATE imagenes

        SET principal = TRUE

        WHERE id = $1
          AND producto_id = $2
        `,
        [
          imagenId,
          productoId,
        ]
      );


      await client.query(
        'COMMIT'
      );


      return res.json({
        message:
          'Imagen principal actualizada',
      });


    } catch (error) {

      await client.query(
        'ROLLBACK'
      );


      console.error(
        'Error estableciendo imagen principal:',
        error
      );


      return res.status(500).json({
        message:
          'Error interno del servidor',
      });


    } finally {

      client.release();
    }
  };


// ==========================================
// ELIMINAR IMAGEN
// ==========================================

const eliminarImagenProducto =
  async (req, res) => {

    const client =
      await pool.connect();


    try {

      const usuarioId =
        req.usuario.id;

      const {
        productoId,
        imagenId,
      } = req.params;


      const producto =
        await obtenerProductoDelUsuario(
          productoId,
          usuarioId
        );


      if (!producto) {

        return res.status(404).json({
          message:
            'Producto no encontrado',
        });
      }


      const resultadoImagen =
        await client.query(
          `
          SELECT
            id,
            public_id,
            principal

          FROM imagenes

          WHERE id = $1
            AND producto_id = $2
          `,
          [
            imagenId,
            productoId,
          ]
        );


      if (
        resultadoImagen.rows.length === 0
      ) {

        return res.status(404).json({
          message:
            'Imagen no encontrada',
        });
      }


      const imagen =
        resultadoImagen.rows[0];


      // ======================================
      // BORRAR CLOUDINARY
      // ======================================

      await cloudinary.uploader.destroy(
        imagen.public_id
      );


      // ======================================
      // BORRAR POSTGRESQL
      // ======================================

      await client.query(
        'BEGIN'
      );


      await client.query(
        `
        DELETE FROM imagenes

        WHERE id = $1
        `,
        [imagenId]
      );


      // ======================================
      // SI ERA PRINCIPAL, ELEGIR OTRA
      // ======================================

      if (imagen.principal) {

        const siguiente =
          await client.query(
            `
            SELECT id

            FROM imagenes

            WHERE producto_id = $1

            ORDER BY id ASC

            LIMIT 1
            `,
            [productoId]
          );


        if (
          siguiente.rows.length > 0
        ) {

          await client.query(
            `
            UPDATE imagenes

            SET principal = TRUE

            WHERE id = $1
            `,
            [
              siguiente.rows[0].id,
            ]
          );
        }
      }


      await client.query(
        'COMMIT'
      );


      return res.json({
        message:
          'Imagen eliminada correctamente',
      });


    } catch (error) {

      try {
        await client.query(
          'ROLLBACK'
        );
      } catch (_) {}


      console.error(
        'Error eliminando imagen:',
        error
      );


      return res.status(500).json({
        message:
          'No se pudo eliminar la imagen',
      });


    } finally {

      client.release();
    }
  };


module.exports = {
  subirImagenProducto,
  listarImagenesProducto,
  establecerImagenPrincipal,
  eliminarImagenProducto,
};