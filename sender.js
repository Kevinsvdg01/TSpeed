const net = require('net');
const fs = require('fs');
const archiver = require('archiver');

const DEST_IP = '127.0.0.1'; // '127.0.0.1' pour tester sur ton PC, ou l'IP du pote
const PORT = 4000;

const socket = new net.Socket();

socket.connect(PORT, DEST_IP, () => {
    console.log('Connecté au récepteur ! Compression et envoi en cours...');

    const archive = archiver('zip', { zlib: { level: 9 } });

    // --- AJOUT DE LA BARRE DE PROGRESSION ---
    let totalEnvoye = 0;
    archive.on('data', (chunk) => {
        totalEnvoye += chunk.length;
        // On affiche la progression en Mo (approximatif car compressé)
        process.stdout.write(`\rDonnées compressées et envoyées : ${(totalEnvoye / 1024 / 1024).toFixed(2)} Mo`);
    });

    // Au lieu d'écrire dans un fichier, on "pipe" directement dans le socket réseau !
    archive.pipe(socket);

    archive.directory('data/', false);
    archive.finalize();

    archive.on('end', () => {
        console.log('Transfert terminé.');
        socket.end();
    });
});