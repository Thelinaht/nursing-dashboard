const bcrypt = require("bcrypt");

const password = "111111";

bcrypt.hash(password, 10).then((hash) => {
    console.log(hash);
});
