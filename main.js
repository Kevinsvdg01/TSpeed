const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

let mainWindow;
let splash;

function createWindow() {
    // 1. Splash Screen
    splash = new BrowserWindow({
        width: 400, height: 300,
        transparent: true, frame: false, alwaysOnTop: true,
        icon: path.join(__dirname, './img/logo_tspeed1.jpeg')
    });
    splash.loadFile('splash.html');

    // 2. Main Window
    mainWindow = new BrowserWindow({
        width: 950, height: 750,
        show: false,
        icon: path.join(__dirname, './img/logo_tspeed1.jpeg'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        autoHideLxMenuBar: true
    });
    mainWindow.loadFile('index.html');

    mainWindow.once('ready-to-show', () => {
        setTimeout(() => {
            splash.close();
            mainWindow.show();
        }, 1500);
    });
}

// --- MODIFICATION ICI : GESTION FICHIER OU DOSSIER ---
ipcMain.handle('select-any', async () => {
    // 1. Sur Windows, on ne peut pas ouvrir un sélecteur "Mixte".
    // On demande donc à l'utilisateur ce qu'il veut faire.
    const choice = await dialog.showMessageBox(mainWindow, {
        type: 'question',
        buttons: ['Un Fichier 📄', 'Un Dossier 📁', 'Annuler'],
        title: 'Que voulez-vous envoyer ?',
        message: 'Sélectionnez le type de contenu à transférer :',
        defaultId: 0,
        cancelId: 2
    });

    // Si l'utilisateur clique sur "Annuler" (index 2)
    if (choice.response === 2) return [];

    // 2. On configure la fenêtre selon le choix
    // Choix 0 = Fichier ('openFile')
    // Choix 1 = Dossier ('openDirectory')
    const properties = choice.response === 0 
        ? ['openFile'] 
        : ['openDirectory'];

    const result = await dialog.showOpenDialog(mainWindow, {
        title: choice.response === 0 ? 'Choisir un fichier' : 'Choisir un dossier',
        properties: properties
    });
    
    return result.filePaths;
});

// IPC pour choisir le dossier de sauvegarde (Paramètres)
ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
    });
    return result.filePaths;
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});