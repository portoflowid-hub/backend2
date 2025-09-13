export const authorizeRoles = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const { role } = req.user

      if (!allowedRoles.includes(role)) {
        return res.status(403).json({
          status: 'fail',
          message: `Access denied: only [${allowedRoles.join(', ')}] allowed`
        })
      }

      next()
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message })
    }
  }
}
