const login = require('./user.login');

// kinda hacky, but `login` does and returns the same data that `profile` does right now.
module.exports = (req, ...rest) => {
  req.getProfile = true;
  return login(req, ...rest);
};
