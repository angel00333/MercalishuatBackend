const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const pool = require('../config/db');


// =========================================
// REGISTRO
// =========================================

const registrar = async (req, res) => {
  try {
    const {
      nombre,
      correo,
      password,
      rol,
    } = req.body;


    // Validar campos
    if (
      !nombre ||
      !correo ||
      !password ||
      !rol
    ) {
      return res.status(400).json({
        message:
          'Todos los campos son obligatorios',
      });
    }


    // Validar roles permitidos
    const rolesPermitidos = [
      'usuario',
      'emprendedor',
    ];

    if (!rolesPermitidos.includes(rol)) {
      return res.status(400).json({
        message:
          'El tipo de cuenta no es válido',
      });
    }


    // Revisar correo duplicado
    const usuarioExistente =
      await pool.query(
        `
        SELECT id
        FROM usuarios
        WHERE LOWER(correo) = LOWER($1)
        `,
        [correo]
      );


    if (usuarioExistente.rows.length > 0) {
      return res.status(409).json({
        message:
          'Este correo ya está registrado',
      });
    }


    // Buscar rol
    const resultadoRol =
      await pool.query(
        `
        SELECT id
        FROM roles
        WHERE nombre = $1
        `,
        [rol]
      );


    if (resultadoRol.rows.length === 0) {
      return res.status(400).json({
        message:
          'Rol no encontrado',
      });
    }


    const rolId =
      resultadoRol.rows[0].id;


    // Cifrar contraseña
    const passwordHash =
      await bcrypt.hash(
        password,
        10
      );


    // Insertar usuario
    const resultado =
      await pool.query(
        `
        INSERT INTO usuarios
        (
          nombre,
          correo,
          password,
          rol_id
        )

        VALUES
        ($1, $2, $3, $4)

        RETURNING
          id,
          nombre,
          correo,
          fecha_creacion
        `,
        [
          nombre,
          correo.toLowerCase(),
          passwordHash,
          rolId,
        ]
      );


    return res.status(201).json({
      message:
        'Usuario registrado correctamente',

      usuario: {
        ...resultado.rows[0],
        rol,
      },
    });


  } catch (error) {

    console.error(
      'Error registrando usuario:',
      error
    );


    return res.status(500).json({
      message:
        'Error interno del servidor',
    });
  }
};



// =========================================
// LOGIN
// =========================================

const login = async (req, res) => {

  try {

    const {
      correo,
      password,
    } = req.body;


    if (!correo || !password) {

      return res.status(400).json({
        message:
          'Correo y contraseña son obligatorios',
      });
    }


    const resultado =
      await pool.query(
        `
        SELECT
          u.id,
          u.nombre,
          u.correo,
          u.password,
          u.activo,
          r.nombre AS rol

        FROM usuarios u

        INNER JOIN roles r
          ON r.id = u.rol_id

        WHERE LOWER(u.correo) =
              LOWER($1)
        `,
        [correo]
      );


    if (resultado.rows.length === 0) {

      return res.status(401).json({
        message:
          'Correo o contraseña incorrectos',
      });
    }


    const usuario =
      resultado.rows[0];


    if (!usuario.activo) {

      return res.status(403).json({
        message:
          'La cuenta está desactivada',
      });
    }


    const passwordCorrecta =
      await bcrypt.compare(
        password,
        usuario.password
      );


    if (!passwordCorrecta) {

      return res.status(401).json({
        message:
          'Correo o contraseña incorrectos',
      });
    }


    const token =
      jwt.sign(
        {
          id: usuario.id,
          rol: usuario.rol,
        },

        process.env.JWT_SECRET,

        {
          expiresIn: '7d',
        }
      );


    return res.status(200).json({

      message:
        'Inicio de sesión correcto',

      token,

      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
      },
    });


  } catch (error) {

    console.error(
      'Error iniciando sesión:',
      error
    );


    return res.status(500).json({
      message:
        'Error interno del servidor',
    });
  }
};



// =========================================
// PERFIL
// =========================================

const perfil = async (req, res) => {

  try {

    const resultado =
      await pool.query(
        `
        SELECT
          u.id,
          u.nombre,
          u.correo,
          u.fecha_creacion,
          r.nombre AS rol

        FROM usuarios u

        INNER JOIN roles r
          ON r.id = u.rol_id

        WHERE u.id = $1
        `,
        [req.usuario.id]
      );


    if (resultado.rows.length === 0) {

      return res.status(404).json({
        message:
          'Usuario no encontrado',
      });
    }


    return res.json({
      usuario:
        resultado.rows[0],
    });


  } catch (error) {

    console.error(
      'Error obteniendo perfil:',
      error
    );


    return res.status(500).json({
      message:
        'Error interno del servidor',
    });
  }
};



module.exports = {
  registrar,
  login,
  perfil,
};