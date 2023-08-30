const { app, BrowserWindow, ipcMain, Tray, Menu, autoUpdater } = require("electron");
const fetch = require("isomorphic-fetch");
const { generatePrintContent } = require("./print-utils");
const Store = require("electron-store");
const store = new Store();
const path = require("path");

let mainWindow;
let printerId;
let tray = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 300,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    show: false,
  });
  mainWindow.loadFile("index.html");

  mainWindow.on("close", (event) => {
    event.preventDefault();
    mainWindow.hide();
  });
}

app.requestSingleInstanceLock();
app.on("second-instance", () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(() => {
  tray = new Tray(path.join(__dirname, "tray-icon.png"));
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Aç",
      click: () => mainWindow.show(),
    },
    {
      label: "Kapat",
      click: quitApp,
    },
  ]);
  tray.setToolTip("Print Server");
  tray.setContextMenu(contextMenu);
  Menu.setApplicationMenu(null);
  createWindow();
  initAutoUpdater();
});

function initAutoUpdater() {
  autoUpdater.setFeedURL({
    provider: "github",
    owner: "KILICAY",
    repo: "ButiksoftPOS-PrintServer",
  });

  autoUpdater.checkForUpdatesAndNotify();

  autoUpdater.on("download-progress", (progressObj) => {
    mainWindow.webContents.send("update-download-progress", progressObj.percent);
  });

  autoUpdater.on("update-downloaded", (info) => {
    mainWindow.webContents.send("update-downloaded", info);
  });
}

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

function quitApp() {
  app.exit();
}