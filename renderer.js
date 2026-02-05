const net = require('net');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const AdmZip = require('adm-zip');
const { ipcRenderer, shell } = require('electron');
const os = require('os');
const dgram = require('dgram');

// --- CONFIGURATION ---
const TRANSFER_PORT = 4000;
const DISCOVERY_PORT = 4001;
const BROADCAST_ADDR = '255.255.255.255';
let selectedPath = null; // Stocke le chemin (Fichier ou Dossier)

// --- PARAMÈTRES (DOSSIER DE RÉCEPTION) ---
const defaultDownloadDir = path.join(os.homedir(), 'Downloads', 'TSpeed_Recu');

function getDownloadPath() {
    return localStorage.getItem('tspeed_dl_path') || defaultDownloadDir;
}

function initSettings() {
    document.getElementById('current-dl-path').innerText = getDownloadPath();
}

window.changeDownloadPath = async () => {
    const paths = await ipcRenderer.invoke('select-folder');
    if (paths && paths.length > 0) {
        localStorage.setItem('tspeed_dl_path', paths[0]);
        initSettings();
    }
};

window.openDownloadFolder = () => {
    const dir = getDownloadPath();
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    shell.openPath(dir);
};

initSettings(); // Lancement au démarrage

// --- UTILITAIRES ---
function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (let k in interfaces) {
        for (let k2 in interfaces[k]) {
            let address = interfaces[k][k2];
            if (address.family === 'IPv4' && !address.internal) return address.address;
        }
    }
    return '127.0.0.1';
}

function updateStatus(id, message, color = '#666') {
    const el = document.getElementById(id);
    if (el) { el.innerText = message; el.style.color = color; }
}

document.getElementById('my-ip').innerText = `${os.hostname()} (${getLocalIp()})`;

window.showView = (viewId) => {
    document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
    document.getElementById('view-' + viewId).style.display = 'block';
};

// --- DRAG & DROP & SÉLECTION ---
const dropZone = document.getElementById('drop-area');

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    document.body.addEventListener(eventName, e => { e.preventDefault(); e.stopPropagation(); }, false);
});

['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.add('highlight'), false);
});
['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.remove('highlight'), false);
});

dropZone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFileSelection(files[0].path);
});

window.selectFileOrFolder = async () => {
    const paths = await ipcRenderer.invoke('select-any');
    if (paths && paths.length > 0) handleFileSelection(paths[0]);
};

function handleFileSelection(filePath) {
    selectedPath = filePath;
    const name = path.basename(filePath);
    
    // Vérifier si c'est un dossier ou un fichier pour l'icône
    const stats = fs.statSync(filePath);
    const icon = stats.isDirectory() ? 'Tb' : '📄';
    
    document.getElementById('selected-file-name').innerHTML = `${icon} Prêt à envoyer : <strong>${name}</strong>`;
    document.getElementById('selected-file-name').style.color = "#2563eb";
}

// --- RECEIVER ---
let tcpServer = null;
let udpSocket = null;

window.startReceiver = () => {
    const pass = document.getElementById('pass-receiver').value;
    if (!pass) return alert("Code de session requis.");
    if (tcpServer) tcpServer.close();
    
    tcpServer = net.createServer((socket) => {
        socket.on('error', (err) => console.log('Err Socket:', err));
        
        socket.once('data', (data) => {
            const msg = data.toString().trim();
            if (msg.startsWith('AUTH:') && msg.split(':')[1] === pass) {
                socket.write("OK");
                updateStatus('status-receiver', "Réception...", "#2980b9");

                const tempFile = path.join(os.tmpdir(), `tspeed_${Date.now()}.zip`);
                const writeStream = fs.createWriteStream(tempFile);
                socket.pipe(writeStream);

                writeStream.on('finish', () => {
                    updateStatus('status-receiver', "Décompression...", "#e67e22");
                    try {
                        const zip = new AdmZip(tempFile);
                        const outputDir = getDownloadPath();
                        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

                        zip.extractAllTo(outputDir, true);
                        fs.unlinkSync(tempFile);
                        
                        updateStatus('status-receiver', "Terminé !", "#27ae60");
                        new Notification("TSpeed", { body: "Fichier reçu !" });
                        window.openDownloadFolder();
                    } catch (err) {
                        updateStatus('status-receiver', "Erreur dézip : " + err.message, "#c0392b");
                    }
                });
            } else {
                socket.write("FAIL"); socket.destroy();
            }
        });
    });

    tcpServer.listen(TRANSFER_PORT, '0.0.0.0', () => {
        updateStatus('status-receiver', "En attente...", "#27ae60");
        document.getElementById('btn-receive-start').disabled = true;
        document.getElementById('btn-receive-start').innerText = "Réception Active";
        startDiscoveryListener();
    });
};

function startDiscoveryListener() {
    if (udpSocket) udpSocket.close();
    udpSocket = dgram.createSocket('udp4');
    udpSocket.on('message', (msg, rinfo) => {
        if (msg.toString() === 'TSPEED_WHO_IS_HERE') {
            udpSocket.send(`TSPEED_I_AM_HERE:${os.hostname()}`, rinfo.port, rinfo.address);
        }
    });
    udpSocket.bind(DISCOVERY_PORT);
}

// --- SENDER ---
let foundDevices = new Map();

window.scanNetwork = () => {
    const listElement = document.getElementById('device-list');
    listElement.innerHTML = '<div style="padding:10px; color:#666;">Scan...</div>';
    foundDevices.clear();

    const scanner = dgram.createSocket('udp4');
    scanner.bind(() => {
        scanner.setBroadcast(true);
        scanner.send('TSPEED_WHO_IS_HERE', DISCOVERY_PORT, BROADCAST_ADDR);
    });

    scanner.on('message', (msg, rinfo) => {
        if (msg.toString().startsWith('TSPEED_I_AM_HERE:')) {
            const hostname = msg.toString().split(':')[1];
            const ip = rinfo.address;
            if (!foundDevices.has(ip)) {
                foundDevices.set(ip, hostname);
                renderDeviceList();
            }
        }
    });

    setTimeout(() => {
        scanner.close();
        if (foundDevices.size === 0) listElement.innerHTML = '<div style="padding:10px; color:#c0392b;">Aucun appareil.</div>';
    }, 2500);
};

function renderDeviceList() {
    const listElement = document.getElementById('device-list');
    listElement.innerHTML = '';
    const selectAll = document.createElement('div');
    selectAll.innerHTML = `<label style="font-weight:bold; cursor:pointer;"><input type="checkbox" onchange="toggleAll(this)" checked> Tout (${foundDevices.size})</label>`;
    listElement.appendChild(selectAll);

    foundDevices.forEach((hostname, ip) => {
        const div = document.createElement('div');
        div.className = 'device-item';
        div.innerHTML = `<label style="cursor:pointer; display:flex; align-items:center;"><input type="checkbox" class="device-checkbox" value="${ip}" checked><div style="margin-left:10px;"><strong>${hostname}</strong><br><small>${ip}</small></div></label>`;
        listElement.appendChild(div);
    });
}

window.toggleAll = (source) => document.querySelectorAll('.device-checkbox').forEach(cb => cb.checked = source.checked);

// --- C'EST ICI QUE CA SE PASSE POUR FICHIER VS DOSSIER ---
window.startSender = async () => {
    const pass = document.getElementById('pass-sender').value;
    const checkboxes = document.querySelectorAll('.device-checkbox:checked');
    const destIps = Array.from(checkboxes).map(cb => cb.value);

    if (destIps.length === 0) return alert("Sélectionnez un destinataire.");
    if (!pass) return alert("Code requis.");
    if (!selectedPath) return alert("Aucun fichier/dossier sélectionné.");

    updateStatus('status-sender', "Préparation...", "#e67e22");
    document.getElementById('progress-container-sender').style.display = 'block';

    const tempZipPath = path.join(os.tmpdir(), `tspeed_send_${Date.now()}.zip`);
    const output = fs.createWriteStream(tempZipPath);
    const archive = archiver('zip', { zlib: { level: 0 } });

    // Calcul Vitesse
    let lastDate = Date.now();
    let lastBytes = 0;
    archive.on('progress', (progress) => {
        const now = Date.now();
        if (now - lastDate >= 500) {
            const bytesDiff = progress.fs.processedBytes - lastBytes;
            const timeDiff = (now - lastDate) / 1000;
            const speedMB = ((bytesDiff / timeDiff) / 1024 / 1024).toFixed(1);
            updateStatus('status-sender', `Vitesse : ${speedMB} Mo/s`, "#2980b9");
            lastDate = now; lastBytes = progress.fs.processedBytes;
        }
    });

    output.on('close', async () => {
        updateStatus('status-sender', `Envoi aux machines...`, "#2980b9");
        await sendToAll(destIps, tempZipPath, pass);
    });

    archive.on('error', (err) => alert("Erreur Zip: " + err));
    archive.pipe(output);

    // --- LOGIQUE INTELLIGENTE : FICHIER OU DOSSIER ? ---
    const stats = fs.statSync(selectedPath);
    
    if (stats.isDirectory()) {
        // C'est un dossier : on met tout son contenu dans le zip
        archive.directory(selectedPath, false);
    } else {
        // C'est un fichier : on l'ajoute avec son nom d'origine
        const fileName = path.basename(selectedPath);
        archive.file(selectedPath, { name: fileName });
    }
    
    archive.finalize();
};

async function sendToAll(ips, filePath, password) {
    const sendOne = (ip) => {
        return new Promise((resolve) => {
            const socket = new net.Socket();
            socket.setTimeout(5000);
            socket.connect(TRANSFER_PORT, ip, () => { socket.write(`AUTH:${password}`); });

            socket.on('data', (data) => {
                if (data.toString().includes("OK")) {
                    const stream = fs.createReadStream(filePath);
                    stream.pipe(socket);
                    stream.on('end', () => socket.end());
                    socket.on('close', () => resolve(true));
                } else { socket.destroy(); resolve(false); }
            });
            socket.on('error', () => resolve(false));
            socket.on('timeout', () => { socket.destroy(); resolve(false); });
        });
    };

    const results = await Promise.all(ips.map(ip => sendOne(ip)));
    const success = results.filter(r => r).length;
    
    try { fs.unlinkSync(filePath); } catch(e){}
    document.getElementById('progress-bar').style.width = '100%';
    updateStatus('status-sender', `Terminé ! Reçu par ${success}/${ips.length}.`, success > 0 ? "#27ae60" : "#c0392b");
}