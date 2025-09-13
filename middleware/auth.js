import jwt from 'jsonwebtoken'

const verifyToken = async (req, res, next) => {
  let token = null //Tambahan Baru
  const authHeader = req.headers['authorization']

  if (!authHeader || !authHeader.startsWith('Bearer')) {
    return res.status(401).json({
      status: 'fail',
      message: 'Access token not provided'
    })
  }

  // Tambahan Baru
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1]
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    req.user = decoded

    next()
  } catch (error) {
    return res.status(403).json({
      status: 'fail',
      message: 'Invalid or expired access token',
      error: error.message
    })
  }
}

export default verifyToken
