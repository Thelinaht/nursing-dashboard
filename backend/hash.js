const bcrypt = require("bcrypt");

const password = "992233";

bcrypt.hash(password, 10).then((hash) => {
    console.log(hash);
});