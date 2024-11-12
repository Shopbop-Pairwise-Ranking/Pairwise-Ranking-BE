const bcrypt = require("bcryptjs");

const encryptPassword = (plainTextPassword) => {
    const salt = bcrypt.genSaltSync(+process.env.SALT_ROUNDS);
    return bcrypt.hashSync(plainTextPassword, salt);
};

const verifyPassword = (plainTextPassword, hashedPassword) => {
    return bcrypt.compareSync(plainTextPassword, hashedPassword);
};

module.exports = {
  encryptPassword,
  verifyPassword,
};
