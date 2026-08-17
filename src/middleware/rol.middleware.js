const permitirRoles = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        message: 'Usuario no autenticado',
      });
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        message: 'No tienes permisos para realizar esta acción',
      });
    }

    next();
  };
};

module.exports = {
  permitirRoles,
};