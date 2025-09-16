const { app, BrowserWindow, Menu, MenuItem, ipcMain } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

let mainWin = null;
let cardWin = null;
let ovwin = null;
let backendProcess;

function createMainWindow() {
  mainWin = new BrowserWindow({
    icon: path.join(__dirname, "Main/logo.ico"),
    width: 150,
    height: 150,
    frame: false,
    resizable: false,
    transparent: true,
    alwaysOnTop: true,
    movable: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  const menu = new Menu();
  menu.append(new MenuItem({
    label: 'Close Window',
    accelerator: 'CommandOrControl+W',
    click: () => {
      if (cardWin) cardWin.close();
    }
  }));

  mainWin.loadFile('button.html');
  Menu.setApplicationMenu(menu);
}

function overlaywindow() {
  if (ovwin) return; // biar tidak bikin double

  ovwin = new BrowserWindow({
    fullscreen: true,
    frame: false,
    transparent: true,
    resizable: false,
    show: true,
    alwaysOnTop: false, // biar di belakang main/card
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  ovwin.loadFile('overlay.html');

  // Biar tidak block input ke aplikasi lain
  ovwin.setIgnoreMouseEvents(true, { forward: true });

  ovwin.on('closed', () => {
    ovwin = null;
  });
}

function createCardWindow() {
  if (cardWin) {
    cardWin.focus();
    return;
  }

  cardWin = new BrowserWindow({
    icon: path.join(__dirname, "Main/logo.ico"),
    width: 810,
    height: 570,
    frame: false,
    transparent: true,
    resizable: false,
    movable: true,
    alwaysOnTop: true, // pastikan di atas overlay
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  cardWin.loadFile('card.html');

  cardWin.on('closed', () => {
    cardWin = null; // reset supaya bisa buka lagi
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.whenReady().then(() => {
  
  backendProcess = spawn('python', [path.join(__dirname, 'cpai.py')], {
    cwd: __dirname,
    shell: true,
    windowsHide:true
  });
  createMainWindow();
  
  let cnt = 0;
  ipcMain.on('min-card', () => {
    if (cardWin) cardWin.minimize();
    cnt++;
  })
  ipcMain.on('open-card', () => {
    cnt++;
    console.log(cnt)
    
    if(cardWin){
      if(cnt === 1){
        if(cardWin.isMinimized()){
          cardWin.restore();
        
        }
      }
      
    }
    if(cardWin) {
      if(cnt >= 2){
        cardWin.minimize();
        cnt = 2;
      }
      
       
    } else if(!cardWin){
      createCardWindow();
    }
    if(cnt==2){
      cnt = 0;
    }
    
  });
  ipcMain.on('exit-card', () => {
    if(cardWin) cardWin.close();
  });
});
