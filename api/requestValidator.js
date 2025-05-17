const jwt = require('jsonwebtoken');

const requestValidator = function(req, res, next) {
	let token = req.query.token || req.headers['x-access-token'];

	if (!token) {
		return res.status(401).send({message: 'Authentication token missing'});
	}

    console.log(token)

	jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {			
		if (err)
			return res.status(403).send({message: 'Failed to authenticate token.'});		
		else {
			req.loggedUser = decoded;
			next();
		}
	});
};

module.exports = requestValidator