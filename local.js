const func = require('./function');
func.mute_enforcer({query: {"API_KEY": process.env['API_KEY']}});
