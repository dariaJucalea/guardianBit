
function checkUserAuthentication(callback) {
  chrome.storage.local.get(["user", "token"], (data) => {
    if (data.user && data.token) {
      try {
        const payload = JSON.parse(atob(data.token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        
        if (payload.exp && payload.exp > currentTime) {
          callback(true, data.user, data.token);
        } else {
          callback(false);
        }
      } catch (e) {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

self.checkUserAuthentication = checkUserAuthentication;
self.debounce = debounce;