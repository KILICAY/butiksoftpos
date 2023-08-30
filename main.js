const { app, BrowserWindow, ipcMain, Tray, Menu,dialog,autoUpdater } = require("electron");
const fetch = require("isomorphic-fetch");
const { generatePrintContent } = require("./print-utils");
const Store = require("electron-store");
const store = new Store();
const path = require("path");
const axios = require("axios");
const appVersion = app.getVersion();

let mainWindow;
let printerId;
let tray = null;

const owner = "KILICAY";
const repo = "butiksoftpos";
const apiUrl = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
// autoUpdater.setFeedURL(apiUrl)

const updateURL = 'https://github.com/KILICAY/butiksoftpos/releases';
autoUpdater.setFeedURL({
  url: updateURL,
});
axios.get(apiUrl)
  .then(response => {
    const latestVersion = response.data.tag_name;
    if (latestVersion !== appVersion) {
      const dialogOptions = {
        type: "question",
        buttons: ["Şimdi Güncelle", "Daha Sonra"],
        defaultId: 0,
        title: "Yeni Güncelleme",
        message: `Mevcut versiyon: ${appVersion}\nYeni versiyon: ${latestVersion}\nUygulamayı güncellemek ister misiniz?`,
      };

      dialog.showMessageBox(null, dialogOptions).then((result) => {
        if (result.response === 0) {
          // Kullanıcı "Şimdi Güncelle" seçeneğini tıkladı
          console.log("Kullanici guncelleme yapmayi secti.");
          autoUpdater.checkForUpdates() 
          autoUpdater.quitAndInstall()
          // Burada güncelleme işlemlerini gerçekleştirin
        } else {
          // Kullanıcı "Daha Sonra" seçeneğini tıkladı
          console.log("Kullanici guncelleme yapmayi secmedi.");
        }
      });
    } else {
      console.log("Uygulama güncel.");
    }
  })
  .catch(error => {
    console.error("Güncelleme kontrolünde hata:", error.message);
  });


function createWindow() {
  mainWindow = new BrowserWindow({
    width: 300,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    show: false, // Hide the window initially
  });
  mainWindow.loadFile("index.html");

  // Handle window close event
  mainWindow.on("close", (event) => {
    // Hide the window instead of quitting the app
    event.preventDefault();
    mainWindow.hide();
  });
}

app.requestSingleInstanceLock(); // Check if this is the first instance
app.on("second-instance", () => {
  // If a second instance is launched, focus the existing window
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(() => {
  // Create the tray icon
  tray = new Tray(path.join(__dirname, "tray-icon.png"));
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Aç",
      click: () => mainWindow.show(),
    },
    {
      label: "Kapat",
      click: quitApp, // quitApp fonksiyonunu çağırarak uygulamayı kapatıyoruz
    },
  ]);
  tray.setToolTip("Print Server");
  tray.setContextMenu(contextMenu);
  Menu.setApplicationMenu(null);
  createWindow();
});

printerId = store.get("printerId");
ipcMain.on("getDataAndPrint", async (event, arg) => {
  try {
    console.log("Main: Print Tetiklendi");
    const windows = BrowserWindow.getAllWindows();
    if (windows.length === 0) return;
    let api = "https://pos.butiksoft.com/coreapi/printApi";
    // let api ='http://localhost:5002/printApi'
    const response = await fetch(api, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        printerId: printerId,
      }),
    });

    const data = await response.json();
    console.log("PrinterID STORAGE:", store.get("printerId"));

    for (const item of data) {
      let selectedPrinterName = "-";
      if (item.printerName == null || item.printerName == "null") {
        selectedPrinterName = "Default";
      } else {
        selectedPrinterName = item.printerName;
      }
      const printContent = generatePrintContent(item, selectedPrinterName);
      windows.forEach((win) => {
        win.webContents.send("setContent", printContent);
        win.webContents.print({
          deviceName: selectedPrinterName,
          silent: true,
        });
      });
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  } catch (error) {
    console.error(error);
  }
});

// When the main window is ready, send the initial getDataAndPrint event
app.on("browser-window-created", (event, window) => {
  window.webContents.on("did-finish-load", () => {
    ipcMain.emit("getDataAndPrint");
    setInterval(() => {
      ipcMain.emit("getDataAndPrint");
    }, 5000);
  });
});

// Kapat seçeneğine tıklanınca uygulamayı kapat
function quitApp() {
  app.exit();
}
