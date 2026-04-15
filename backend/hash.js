const bcrypt = require("bcrypt");

const password = "098765";

bcrypt.hash(password, 10).then((hash) => {
    console.log(hash);
});
