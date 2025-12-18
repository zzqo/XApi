declare var chrome: any;

chrome.devtools.panels.create(
  "HTTP CaptureExt Client",
  "", // Icon path
  "panel.html",
  (panel: any) => {
    console.log("Panel created");
  }
);