import fs from "node:fs";
import chromium from "@sparticuz/chromium-min";
import puppeteer from "puppeteer-core";

let executablePathCache: string | null = null;

function chromeLocalWindows() {
  const caminhos = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
  ];

  return caminhos.find((caminho) => caminho && fs.existsSync(caminho)) || null;
}

async function resolverExecutablePath() {
  if (executablePathCache) return executablePathCache;

  if (process.env.CHROMIUM_EXECUTABLE_PATH) {
    executablePathCache = process.env.CHROMIUM_EXECUTABLE_PATH;
    return executablePathCache;
  }

  if (process.env.NODE_ENV !== "production") {
    const chromeWindows = chromeLocalWindows();

    if (chromeWindows) {
      executablePathCache = chromeWindows;
      return executablePathCache;
    }
  }

  if (process.env.CHROMIUM_PACK_URL) {
    executablePathCache = await chromium.executablePath(
      process.env.CHROMIUM_PACK_URL
    );

    return executablePathCache;
  }

  executablePathCache = await chromium.executablePath();

  return executablePathCache;
}

export async function abrirBrowserPuppeteer() {
  const executablePath = await resolverExecutablePath();

  return puppeteer.launch({
    args: [
      ...chromium.args,
      "--hide-scrollbars",
      "--disable-web-security",
      "--no-sandbox",
      "--disable-setuid-sandbox",
    ],
    defaultViewport: {
      width: 1123,
      height: 794,
      deviceScaleFactor: 1,
    },
    executablePath,
    headless: true,
  });
}