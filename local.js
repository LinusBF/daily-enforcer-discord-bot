const func = require('./function');
func.enforcer({query: {"API_KEY": process.env['API_KEY']}});
