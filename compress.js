const fs = require('fs');
const archiver = require('archiver');
const path = require('path');

// Configuration
const dossierAScompresser = 'data'; // Ton dossier source
const fichierSortie = 'transfert.zip'; // Le résultat

// Créer un flux d'écriture vers le fichier final
const output = fs.createWriteStream(path.join(__dirname, fichierSortie));
const archive = archiver('zip', { zlib: { level: 9 } });

// Événement : quand le fichier est totalement écrit
output.on('close', () => {
    console.log(`--- Succès ! ---`);
    console.log(`Le fichier ${fichierSortie} est prêt.`);
    console.log(`Taille finale : ${(archive.pointer() / 1024 / 1024).toFixed(2)} Mo`);
});

// Événement : en cas d'erreur
archive.on('error', (err) => { throw err; });

// Lier l'archive au fichier de sortie
archive.pipe(output);

// Ajouter le contenu du dossier "data" dans l'archive
// Le deuxième paramètre 'false' évite de recréer le dossier 'data' à l'intérieur du zip
archive.directory(dossierAScompresser + '/', false);

// Finaliser le processus
console.log('Compression en cours...');
archive.finalize();