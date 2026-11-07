const cloudinary =
  require(
    '../config/cloudinary.locales'
  );

const ImagenLocalService =
  require(
    '../services/local_comercial_imagen.service'
  );


// ============================================================
// SUBIR BUFFER A CLOUDINARY
// ============================================================

const subirCloudinary = (
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
              'mercalishuat/locales',

          resource_type:
              'image',
        },
        (
          error,
          resultado
        ) => {
          if (error) {
            reject(
              error
            );

            return;
          }

          resolve(
            resultado
          );
        }
      );

      stream.end(
        buffer
      );
    }
  );
};


// ============================================================
// SUBIR IMÁGENES
// ============================================================

const subir = async (
  req,
  res
) => {
  const subidas = [];

  try {
    const localId =
        Number.parseInt(
          req.params.id,
          10
        );


    if (
      !Number.isInteger(
        localId
      ) ||
      localId <= 0
    ) {
      return res
          .status(400)
          .json({
        message:
            'ID de local inválido',
      });
    }


    const local =
        await ImagenLocalService
            .obtenerLocalPropio({
      localId,

      usuarioId:
          req.usuario.id,
    });


    if (!local) {
      return res
          .status(404)
          .json({
        message:
            'Local comercial no encontrado o no autorizado',
      });
    }


    if (
      !req.files ||
      req.files.length === 0
    ) {
      return res
          .status(400)
          .json({
        message:
            'Selecciona al menos una imagen',
      });
    }


    const existentes =
        await ImagenLocalService
            .contarImagenes(
      localId
    );


    // Máximo total: 10 fotos por local.
    if (
      existentes +
          req.files.length >
      10
    ) {
      return res
          .status(400)
          .json({
        message:
            'Un local puede tener como máximo 10 imágenes',
      });
    }


    let orden =
        await ImagenLocalService
            .siguienteOrden(
      localId
    );


    const imagenes = [];


    for (
      const archivo of
      req.files
    ) {
      const subida =
          await subirCloudinary(
        archivo.buffer
      );

      subidas.push(
        subida.public_id
      );


      const imagen =
          await ImagenLocalService
              .guardarImagen({
        localId,

        url:
            subida.secure_url,

        publicId:
            subida.public_id,

        orden,

        principal:
            existentes === 0 &&
            imagenes.length === 0,
      });


      imagenes.push(
        imagen
      );

      orden++;
    }


    return res
        .status(201)
        .json({
      ok:
          true,

      message:
          'Imágenes agregadas correctamente',

      data:
          imagenes,
    });

  } catch (error) {
    console.error(
      'Error subiendo imágenes del local:',
      error
    );


    // Limpiar Cloudinary si la operación falla.
    for (
      const publicId of
      subidas
    ) {
      try {
        await cloudinary
            .uploader
            .destroy(
          publicId
        );
      } catch (_) {
        // Evitar ocultar el error principal.
      }
    }


    return res
        .status(500)
        .json({
      message:
          'No fue posible subir las imágenes',
    });
  }
};


// ============================================================
// ELIMINAR IMAGEN
// ============================================================

const eliminar = async (
  req,
  res
) => {
  try {
    const localId =
        Number.parseInt(
          req.params.id,
          10
        );

    const imagenId =
        Number.parseInt(
          req.params.imagenId,
          10
        );


    if (
      !Number.isInteger(
        localId
      ) ||
      !Number.isInteger(
        imagenId
      )
    ) {
      return res
          .status(400)
          .json({
        message:
            'Identificador inválido',
      });
    }


    const imagen =
        await ImagenLocalService
            .obtenerImagenPropia({
      imagenId,

      localId,

      usuarioId:
          req.usuario.id,
    });


    if (!imagen) {
      return res
          .status(404)
          .json({
        message:
            'Imagen no encontrada o no autorizada',
      });
    }


    if (
      imagen.public_id
    ) {
      await cloudinary
          .uploader
          .destroy(
        imagen.public_id
      );
    }


    await ImagenLocalService
        .eliminarImagen({
      imagenId,
    });


    if (
      imagen.principal
    ) {
      await ImagenLocalService
          .asegurarPrincipal(
        localId
      );
    }


    return res.json({
      ok:
          true,

      message:
          'Imagen eliminada correctamente',
    });

  } catch (error) {
    console.error(
      'Error eliminando imagen del local:',
      error
    );


    return res
        .status(500)
        .json({
      message:
          'No fue posible eliminar la imagen',
    });
  }
};


// ============================================================
// IMAGEN PRINCIPAL
// ============================================================

const establecerPrincipal =
    async (
      req,
      res
    ) => {
      try {
        const localId =
            Number.parseInt(
              req.params.id,
              10
            );

        const imagenId =
            Number.parseInt(
              req.params.imagenId,
              10
            );


        if (
          !Number.isInteger(
            localId
          ) ||
          !Number.isInteger(
            imagenId
          )
        ) {
          return res
              .status(400)
              .json({
            message:
                'Identificador inválido',
          });
        }


        await ImagenLocalService
            .definirPrincipal({
          localId,

          imagenId,

          usuarioId:
              req.usuario.id,
        });


        return res.json({
          ok:
              true,

          message:
              'Imagen principal actualizada',
        });

      } catch (error) {
        console.error(
          'Error estableciendo imagen principal:',
          error
        );


        return res
            .status(
              error.statusCode ||
                  500
            )
            .json({
          message:
              error.statusCode
                  ? error.message
                  : 'Error interno del servidor',
        });
      }
    };


// ============================================================
// EXPORTACIONES
// ============================================================

module.exports = {
  subir,
  eliminar,
  establecerPrincipal,
};