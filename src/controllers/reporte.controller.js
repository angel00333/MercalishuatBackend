const reporteService =
  require(
    '../services/reporte.service'
  );

// ============================================================
// CREAR REPORTE
// ============================================================

exports.crear =
  async (
    req,
    res
  ) => {
    try {
      const {
        tipo,
        objetivo_id,
        motivo,
        descripcion,
      } =
          req.body;

      // =======================================================
      // TIPO
      // =======================================================

      if (
          ![
            'publicacion',
            'comentario',
          ].includes(
            tipo
          )) {
        return res
          .status(400)
          .json({
            ok: false,
            mensaje:
                'El tipo debe ser publicacion o comentario',
          });
      }

      // =======================================================
      // OBJETIVO
      // =======================================================

      const objetivoId =
          Number(
        objetivo_id
      );

      if (
          !Number.isInteger(
            objetivoId
          ) ||
          objetivoId <=
              0) {
        return res
          .status(400)
          .json({
            ok: false,
            mensaje:
                'ID de contenido inválido',
          });
      }

      // =======================================================
      // MOTIVO
      // =======================================================

      const motivoLimpio =
          motivo
              ?.toString()
              .trim();

      if (
          !motivoLimpio) {
        return res
          .status(400)
          .json({
            ok: false,
            mensaje:
                'El motivo es obligatorio',
          });
      }

      if (
          motivoLimpio
                  .length >
              100) {
        return res
          .status(400)
          .json({
            ok: false,
            mensaje:
                'El motivo no puede superar los 100 caracteres',
          });
      }

      // =======================================================
      // REPORTANTE
      // =======================================================

      const reportanteId =
          Number(
        req.usuario.id
      );

      const reporte =
          await reporteService
              .crearReporte({
        reportanteId,

        tipo,

        objetivoId,

        motivo:
            motivoLimpio,

        descripcion:
            descripcion
                ?.toString()
                .trim(),
      });

      return res
        .status(201)
        .json({
          ok: true,
          mensaje:
              'Reporte enviado correctamente',
          data:
              reporte,
        });
    } catch (error) {
      console.error(
        'ERROR CREANDO REPORTE:',
        error,
      );

      return res
        .status(
          error.status ||
              500
        )
        .json({
          ok: false,
          mensaje:
              error.message ||
              'Error enviando el reporte',
        });
    }
  };

// ============================================================
// LISTAR REPORTES - ADMIN
// ============================================================

exports.listarAdmin =
  async (
    req,
    res
  ) => {
    try {
      const resultado =
          await reporteService
              .listarReportes({
        pagina:
            req.query
                .pagina,

        limite:
            req.query
                .limite,

        estado:
            req.query
                    .estado
                ?.toString()
                .toLowerCase(),
      });

      return res
        .status(200)
        .json({
          ok: true,

          data:
              resultado
                  .reportes,

          paginacion:
              resultado
                  .paginacion,
        });
    } catch (error) {
      console.error(
        'ERROR LISTANDO REPORTES:',
        error,
      );

      return res
        .status(500)
        .json({
          ok: false,
          mensaje:
              'Error cargando reportes',
        });
    }
  };

// ============================================================
// RESOLVER REPORTE - ADMIN
// ============================================================

exports.resolver =
  async (
    req,
    res
  ) => {
    try {
      const reporteId =
          Number(
        req.params.id
      );

      if (
          !Number.isInteger(
            reporteId
          ) ||
          reporteId <=
              0) {
        return res
          .status(400)
          .json({
            ok: false,
            mensaje:
                'ID de reporte inválido',
          });
      }

      const accion =
          req.body
              .accion
              ?.toString()
              .toLowerCase();

      if (
          ![
            'ocultar',
            'descartar',
          ].includes(
            accion
          )) {
        return res
          .status(400)
          .json({
            ok: false,
            mensaje:
                'La acción debe ser ocultar o descartar',
          });
      }

      const resultado =
          await reporteService
              .resolverReporte({
        reporteId,

        administradorId:
            Number(
          req.usuario.id
        ),

        accion,
      });

      return res
        .status(200)
        .json({
          ok: true,

          mensaje:
              accion ===
                      'ocultar'
                  ? 'Contenido ocultado y reporte resuelto'
                  : 'Reporte descartado',

          data:
              resultado,
        });
    } catch (error) {
      console.error(
        'ERROR RESOLVIENDO REPORTE:',
        error,
      );

      return res
        .status(
          error.status ||
              500
        )
        .json({
          ok: false,

          mensaje:
              error.message ||
              'Error resolviendo reporte',
        });
    }
  };

// ============================================================
// PUBLICACIÓN ACTIVA / OCULTA
// ============================================================

exports.cambiarEstadoPublicacion =
  async (
    req,
    res
  ) => {
    try {
      const id =
          Number(
        req.params.id
      );

      if (
          !Number.isInteger(
            id
          ) ||
          id <= 0) {
        return res
          .status(400)
          .json({
            ok: false,
            mensaje:
                'ID de publicación inválido',
          });
      }

      if (
          typeof req.body
                  .activo !==
              'boolean') {
        return res
          .status(400)
          .json({
            ok: false,
            mensaje:
                'El campo activo debe ser true o false',
          });
      }

      const resultado =
          await reporteService
              .cambiarEstadoPublicacion({
        publicacionId:
            id,

        activo:
            req.body
                .activo,
      });

      if (!resultado) {
        return res
          .status(404)
          .json({
            ok: false,
            mensaje:
                'Publicación no encontrada',
          });
      }

      return res
        .status(200)
        .json({
          ok: true,

          mensaje:
              resultado
                      .activo
                  ? 'Publicación restaurada correctamente'
                  : 'Publicación ocultada correctamente',

          data:
              resultado,
        });
    } catch (error) {
      console.error(
        'ERROR MODERANDO PUBLICACIÓN:',
        error,
      );

      return res
        .status(500)
        .json({
          ok: false,
          mensaje:
              'Error modificando publicación',
        });
    }
  };

// ============================================================
// COMENTARIO ACTIVO / OCULTO
// ============================================================

exports.cambiarEstadoComentario =
  async (
    req,
    res
  ) => {
    try {
      const id =
          Number(
        req.params.id
      );

      if (
          !Number.isInteger(
            id
          ) ||
          id <= 0) {
        return res
          .status(400)
          .json({
            ok: false,
            mensaje:
                'ID de comentario inválido',
          });
      }

      if (
          typeof req.body
                  .activo !==
              'boolean') {
        return res
          .status(400)
          .json({
            ok: false,
            mensaje:
                'El campo activo debe ser true o false',
          });
      }

      const resultado =
          await reporteService
              .cambiarEstadoComentario({
        comentarioId:
            id,

        activo:
            req.body
                .activo,
      });

      if (!resultado) {
        return res
          .status(404)
          .json({
            ok: false,
            mensaje:
                'Comentario no encontrado',
          });
      }

      return res
        .status(200)
        .json({
          ok: true,

          mensaje:
              resultado
                      .activo
                  ? 'Comentario restaurado correctamente'
                  : 'Comentario ocultado correctamente',

          data:
              resultado,
        });
    } catch (error) {
      console.error(
        'ERROR MODERANDO COMENTARIO:',
        error,
      );

      return res
        .status(500)
        .json({
          ok: false,
          mensaje:
              'Error modificando comentario',
        });
    }
  };