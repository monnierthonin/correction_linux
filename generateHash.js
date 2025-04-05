const bcrypt = require('bcryptjs');

async function generateHash() {
    const hash = await bcrypt.hash('test', 10);
    console.log('Hash pour le mot de passe "test":', hash);
}

generateHash();
