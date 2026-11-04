const adminService =
  require('../services/admin.service');

// ============================================================
// DASHBOARD
// ============================================================

exports.dashboard =
  async (
    req,
    res
  ) => {
    try {
      const datos =
        await adminService.obtenerDashboard();

      return res.status(200).json({
        ok: true,
        data:
          datos,
      });
    } catch (error) {
      console.error(
        'ERROR DASHBOARD ADMIN:',
        error
      );

      return res.status(500).json({
        ok: false,
        mensaje:
          'Error cargando el dashboard administrativo',
      });
    }
  };

// ============================================================
// LISTAR USUARIOS
// ============================================================

exports.listarUsuarios =
  async (
    req,
    res
  ) => {
    try {
      const resultado =
        await adminService.listarUsuarios({
          pagina:
            req.query.pagina,

          limite:
            req.query.limite,

          buscar:
            req.query.buscar,

          rolId:
            req.query.rol_id,
        });

      return res.status(200).json({
        ok: true,

        data:
          resultado.usuarios,

        paginacion:
          resultado.paginacion,
      });
    } catch (error) {
      console.error(
        'ERROR LISTANDO USUARIOS ADMIN:',
        error
      );

      return res.status(500).json({
        ok: false,
        mensaje:
          'Error cargando usuarios',
      });
    }
  };

// ============================================================
// USUARIO POR ID
// ============================================================

exports.obtenerUsuario =
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
        !Number.isInteger(id) ||
        id <= 0
      ) {
        return res.status(400).json({
          ok: false,
          mensaje:
            'ID de usuario inválido',
        });
      }

      const usuario =
        await adminService.obtenerUsuarioPorId(
          id
        );

      if (!usuario) {
        return res.status(404).json({
          ok: false,
          mensaje:
            'Usuario no encontrado',
        });
      }

      return res.status(200).json({
        ok: true,
        data:
          usuario,
      });
    } catch (error) {
      console.error(
        'ERROR OBTENIENDO USUARIO ADMIN:',
        error
      );

      return res.status(500).json({
        ok: false,
        mensaje:
          'Error cargando usuario',
      });
    }
  };

exports.cambiarEstadoUsuario = async (
  req,
  res
) => {
  try {
    const id =
        Number(req.params.id);

    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {
      return res.status(400).json({
        ok: false,
        mensaje:
            'ID de usuario inválido',
      });
    }

    if (
        typeof req.body.activo !==
        'boolean'
    ) {
      return res.status(400).json({
        ok: false,
        mensaje:
            'El campo activo debe ser true o false',
      });
    }

    const usuario =
        await adminService
            .cambiarEstadoUsuario(
      id,
      req.body.activo,
      Number(req.usuario.id),
    );

    if (!usuario) {
      return res.status(404).json({
        ok: false,
        mensaje:
            'Usuario no encontrado',
      });
    }

    return res.status(200).json({
      ok: true,

      mensaje:
          usuario.activo
              ? 'Usuario reactivado correctamente'
              : 'Usuario suspendido correctamente',

      data:
          usuario,
    });
  } catch (error) {
    console.error(
      'ERROR CAMBIANDO ESTADO USUARIO:',
      error,
    );

    return res
        .status(error.status || 500)
        .json({
      ok: false,

      mensaje:
          error.message ||
          'Error modificando el estado del usuario',
    });
  }
};