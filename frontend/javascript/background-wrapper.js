try {
  console.log("Încărcare scripts...");
  importScripts("utils.js"); 
  importScripts("error-handler.js");
  importScripts("behavior-tracker.js");  
  importScripts("background.js");        
 importScripts("dlp-engine.js"); 
  console.log("Scripts încărcate cu succes!");
} catch (e) {
  console.error("Eroare la încărcarea scripturilor:", e);
}