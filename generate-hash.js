// Run this ONCE to generate your password hash:
// node generate-hash.js
const bcrypt = require("bcryptjs");

const password = "mansoor123"; // Change this to your desired password
const hash = bcrypt.hashSync(password, 10);
console.log("Add this to your .env as ADMIN_PASSWORD_HASH:");
console.log(hash);
