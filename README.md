_____________⚡⚡⚡TSpeed⚡⚡⚡________________

Description Courte :
TSpeed est une application de bureau ultra-rapide conçue pour transférer des fichiers et des dossiers volumineux via le réseau local (LAN), sans nécessiter de connexion Internet.

Fonctionnalités Clés :
📂 Support Complet : Envoi de fichiers uniques ou de dossiers entiers, avec gestion intuitive du Glisser-Déposer (Drag & Drop).
📡 Découverte Automatique : Scanne le réseau pour détecter instantanément les autres appareils TSpeed sans saisir d'adresses IP.
⚡ Multi-Destination : Permet d'envoyer des données à plusieurs ordinateurs simultanément en un seul clic.
🔒 Sécurisé : Les transferts sont protégés par un code de session partagé entre l'expéditeur et les destinataires.


🚫 NON, vous n'avez absolument PAS besoin d'Internet pour utiliser l'app. 🌐

✅ Mais OUI, il faut être connecté au même routeur (Box ou système WiFi). 📡

======Voici les détails pour que tout soit clair====== :

1. Comment ça marche (Techniquement)
L'application utilise des adresses IP locales (du type 192.168.x.x).
Le transfert se fait d'ordinateur à ordinateur directement.
Le routeur (la Box) sert juste de "pont" (switch) pour faire passer les câbles invisibles entre les PC.
Les données ne sortent jamais de chez toi. Elles ne vont pas sur le Cloud, ni chez Google, ni sur un serveur externe.


2. Les différents cas de figure
✅ Cas 1 : Box Internet (Maison/Bureau) - Avec ou Sans Internet
Vous êtes connecté à votre Box (Orange, Free, SFR...).
Même si votre Box a une panne d'Internet (le voyant rouge clignote), l'application TSpeed fonctionnera ! Tant que le WiFi ou les câbles fonctionnent, le réseau local (LAN) est actif.

✅ Cas 2 : Partage de connexion (Hotspot Mobile)
Vous êtes dans un parc ou dans un train sans WiFi.
Vous prenez votre téléphone, vous activé le "Point d'accès mobile" (Hotspot).
Vos deux ordinateurs se connectent au WiFi de votre téléphone.
TSpeed marche parfaitement !
Note importante : Cela ne consommera pas votre forfait 4G/5G (Data), car les données passent du PC A au PC B via le téléphone, sans aller chercher internet dehors.

✅ Cas 3 : Câble Ethernet (RJ45)
Si vous branché les deux PC par câble à la même Box (ou switch), c'est encore mieux !
La vitesse sera maximale (souvent 10x plus vite que le WiFi).

❌ Cas 4 : WiFi différents
Si PC A est sur le WiFi "Maison_Salon" et PC B est sur le WiFi "Voisin_Box", ça ne marchera pas. Ils doivent être sur le même réseau.

Résumé des avantages
Puisque vous n'utilisez pas Internet :
C'est ultra rapide 🚀 : Vous n'êtes pas limité par votre vitesse d'abonnement Internet, mais seulement par la puissance de votre carte WiFi (souvent entre 20 et 100 Mo/s, ce qui est énorme).

C'est sécurisé 🔒 : Vos fichiers ne transitent pas par des serveurs inconnus.

Donc, vous pouvez utiliser votre app en plein désert, tant que vous avez un petit routeur ou un téléphone pour faire le lien entre les PC !

🚫NB: Code Source sans les dossiers dist/ (contenant le fichier .exe) et node_modules/ (dossier où npm ou yarn, ou pnpm installe toutes les dépendances du projet).
Vous pouvez les reconstruire en faisant "npm install" d'abord et ensuite "npm run build".
