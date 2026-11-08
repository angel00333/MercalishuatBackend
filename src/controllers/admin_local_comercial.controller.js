const adminLocalService =
  require(
    '../services/admin_local_comercial.service',
  );

// ============================================================
// VALIDAR ID
// ============================================================

function validarId(valor) {
  const id =
    Number(valor);

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    const error =
      new Error(
        'ID de local inválido',
      );

    error.status = 400;

    throw error;
  }

  return id;
}

// ============================================================
// VALIDAR BOOLEAN
// ============================================================

function validarBoolean(
  valor,
  nombreCampo,
) {
  if (
    typeof valor !== 'boolean'
  ) {
    const error =
      new Error(
        `El campo ${nombreCampo} debe ser booleano`,
      );

    error.status = 400;

    throw error;
  }

  return valor;
}

// ============================================================
// LISTAR
// ============================================================

async function listar(
  req,
  res,
  next,
) {
  try {
    const resultado =
      await adminLocalService.listar({
        pagina:
          req.query.pagina,

        limite:
          req.query.limite,

        buscar:
          req.query.buscar,

        estado:
          req.query.estado ??
          'todos',

        tipoOperacion:
          req.query
              .tipo_operacion,
      });

    return res.json({
      success: true,

      data:
        resultado.locales,

      paginacion: {
        pagina:
          resultado.pagina,

        limite:
          resultado.limite,

        total:
          resultado.total,

        paginas:
          resultado.paginas,
      },

      resumen:
        resultado.resumen,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================================
// OBTENER DETALLE
// ============================================================

async function obtener(
  req,
  res,
  next,
) {
  try {
    const id =
      validarId(
        req.params.id,
      );

    const local =
      await adminLocalService
          .obtenerPorId(
        id,
      );

    if (!local) {
      return res.status(404).json({
        success: false,

        message:
          'Local comercial no encontrado',
      });
    }

    return res.json({
      success: true,

      data:
        local,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================================
// OCULTAR / REACTIVAR
// ============================================================

async function cambiarEstado(
  req,
  res,
  next,
) {
  try {
    const id =
      validarId(
        req.params.id,
      );

    const activo =
      validarBoolean(
        req.body.activo,
        'activo',
      );

    const local =
      await adminLocalService
          .cambiarEstado(
        id,
        activo,
      );

    if (!local) {
      return res.status(404).json({
        success: false,

        message:
          'Local comercial no encontrado',
      });
    }

    return res.json({
      success: true,

      message:
        activo
            ? 'Local reactivado correctamente'
            : 'Local ocultado correctamente',

      data:
        local,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================================
// CAMBIAR DISPONIBILIDAD
// ============================================================

async function cambiarDisponibilidad(
  req,
  res,
  next,
) {
  try {
    const id =
      validarId(
        req.params.id,
      );

    const disponible =
      validarBoolean(
        req.body.disponible,
        'disponible',
      );

    const local =
      await adminLocalService
          .cambiarDisponibilidad(
        id,
        disponible,
      );

    if (!local) {
      return res.status(404).json({
        success: false,

        message:
          'Local comercial no encontrado',
      });
    }

    return res.json({
      success: true,

      message:
        disponible
            ? 'Local marcado como disponible'
            : 'Local marcado como no disponible',

      data:
        local,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listar,
  obtener,
  cambiarEstado,
  cambiarDisponibilidad,
};