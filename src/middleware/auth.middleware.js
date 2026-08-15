const jwt = require('jsonwebtoken');


const verificarToken = (
  req,
  res,
  next
) => {

  try {

    const authHeader =
      req.headers.authorization;


    if (!authHeader) {

      return res.status(401).json({
        message:
          'Token no proporcionado',
      });
    }


    const partes =
      authHeader.split(' ');


    if (
      partes.length !== 2 ||
      partes[0] !== 'Bearer'
    ) {

      return res.status(401).json({
        message:
          'Formato de token incorrecto',
      });
    }


    const token =
      partes[1];


    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );


    req.usuario = decoded;


    next();


  } catch (error) {

    return res.status(401).json({
      message:
        'Token inválido o expirado',
    });
  }
};


module.exports = {
  verificarToken,
};