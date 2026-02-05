const net = require('net');
const fs = require('fs');
const unzipper = require('unzipper'); // Installe-le via: npm install unzipper

const PASSWORD = "VOTRE_MOT_DE_PASSE_ICI";

const server = net.createServer((socket) => {
    socket.once('data', (data) => {
        const msg = data.toString();
        if (msg === `AUTH:${PASSWORD}`) {
            console.log("Mot de passe correct ! Réception du fichier...");
            socket.write("OK"); // On dit à l'émetteur qu'on est prêt
            const writeStream = fs.createWriteStream('recu.zip');
            socket.pipe(writeStream);
        } else {
            console.log("Tentative de connexion refusée : mauvais mot de passe.");
            socket.destroy();
        }
    });
});