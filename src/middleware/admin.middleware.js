const jwt = require('jsonwebtoken');
const pool = require('../config/db');

async function adminMiddleware(req, res, next) {
  try {
    // =========================================================
    // OBTENER TOKEN
    // =========================================================

    const authorization =
      req.headers.authorization || '';

    if (!authorization.startsWith('Bearer ')) {
      return res.status(401).json({
        ok: false,
        mensaje: 'Token de autenticación requerido',
      });
    }

    const token =
      authorization.substring(7).trim();

    if (!token) {
      return res.status(401).json({
        ok: false,
        mensaje: 'Token de autenticación requerido',
      });
    }

    // =========================================================
    // VERIFICAR JWT
    // =========================================================

    let decoded;

    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );
    } catch (error) {
      return res.status(401).json({
        ok: false,
        mensaje: 'Token inválido o expirado',
      });
    }

    const usuarioId =
      Number(decoded.id);

    if (
      !Number.isInteger(usuarioId) ||
      usuarioId <= 0
    ) {
      return res.status(401).json({
        ok: false,
        mensaje: 'Sesión inválida',
      });
    }

    // =========================================================
    // CONSULTAR ROL ACTUAL EN BASE DE DATOS
    //
    // No confiamos únicamente en el rol guardado en el JWT.
    // Si el rol cambia en PostgreSQL, el permiso cambia aquí.
    // =========================================================

    const resultado =
      await pool.query(
        `
        SELECT
          u.id,
          u.nombre,
          u.correo,
          u.rol_id,
          r.nombre AS rol
        FROM usuarios u
        INNER JOIN roles r
          ON r.id = u.rol_id
        WHERE u.id = $1
        LIMIT 1
        `,
        [
          usuarioId,
        ]
      );

    if (resultado.rowCount === 0) {
      return res.status(401).json({
        ok: false,
        mensaje: 'Usuario no encontrado',
      });
    }

    const usuario =
      resultado.rows[0];

    // =========================================================
    // SOLO ADMINISTRADOR
    // =========================================================

    if (Number(usuario.rol_id) !== 3) {
      return res.status(403).json({
        ok: false,
        mensaje:
          'No tienes permisos de administrador',
      });
    }

    req.usuario = {
      ...decoded,

      id:
        usuario.id,

      nombre:
        usuario.nombre,

      correo:
        usuario.correo,

      rol_id:
        usuario.rol_id,

      rol:
        usuario.rol,
    };

    next();
  } catch (error) {
    console.error(
      'ERROR ADMIN MIDDLEWARE:',
      error
    );

    return res.status(500).json({
      ok: false,
      mensaje:
        'Error verificando permisos administrativos',
    });
  }
}

module.exports =
  adminMiddleware;