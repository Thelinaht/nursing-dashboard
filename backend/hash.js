const bcrypt = require("bcrypt");

const password = "121314";

bcrypt.hash(password, 10).then((hash) => {
    console.log(hash);
});