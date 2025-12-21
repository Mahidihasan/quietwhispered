const jwt = require('jsonwebtoken');

module.exports = {
    // Protect routes
    protect: async (req, res, next) => {
        try {
            let token;
            
            // Get token from header
            if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
                token = req.headers.authorization.split(' ')[1];
            }
            // Get token from cookie
            else if (req.cookies.token) {
                token = req.cookies.token;
            }

            // Check if token exists
            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'Not authorized to access this route'
                });
            }

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // You can add user to request object if needed
            req.user = decoded;
            
            next();
        } catch (error) {
            console.error('Auth error:', error);
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route'
            });
        }
    },

    // Generate JWT token
    generateToken: (id) => {
        return jwt.sign({ id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRE || '24h'
        });
    },

    // Set JWT as HTTP-only cookie
    sendTokenResponse: (user, statusCode, res) => {
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRE || '24h'
        });

        const options = {
            expires: new Date(
                Date.now() + (process.env.JWT_COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000
            ),
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        };

        res
            .status(statusCode)
            .cookie('token', token, options)
            .json({
                success: true,
                token,
                user: {
                    id: user._id,
                    username: user.username
                }
            });
    }
};