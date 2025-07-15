
class ErrorHandler {
  constructor() {
    this.errorCounts = new Map();
    this.errorLog = [];
    this.maxLogEntries = 100;
  }


  async handleError(error, context = {}) {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      context,
      id: this.generateErrorId()
    };

   
    this.errorLog.unshift(errorInfo);
    if (this.errorLog.length > this.maxLogEntries) {
      this.errorLog.pop();
    }

    const errorKey = this.getErrorKey(error);
    this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1);


    console.error(`❌ [${context.component || 'Unknown'}] ${error.message}`, {
      error,
      context
    });

  
    if (context.reportToBackend) {
      await this.reportErrorToBackend(errorInfo);
    }


    if (context.showToUser) {
      await this.showUserNotification(errorInfo);
    }

    return errorInfo.id;
  }


  async safeFetch(url, options = {}, context = {}) {
    const defaultOptions = {
      timeout: 10000,
      retries: 3,
      ...options
    };

    return this.withRetry(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), defaultOptions.timeout);

      try {
        const response = await fetch(url, {
          ...defaultOptions,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
          throw new Error(`Timeout după ${defaultOptions.timeout}ms`);
        }
        throw error;
      }
    }, defaultOptions.retries, context);
  }

  
  async withRetry(fn, retries, context) {
    let lastError;
    
    for (let i = 0; i <= retries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (i < retries) {
          const delay = Math.pow(2, i) * 1000; 
          console.warn(`⚠️ Retry ${i + 1}/${retries} în ${delay}ms pentru ${context.operation || 'operation'}`);
          await this.delay(delay);
        }
      }
    }

    throw lastError;
  }


  async safeChromeAPI(apiCall, context = {}) {
    try {
      return await apiCall();
    } catch (error) {
      if (chrome.runtime.lastError) {
        const chromeError = new Error(chrome.runtime.lastError.message);
        await this.handleError(chromeError, { ...context, type: 'chrome-api' });
        throw chromeError;
      }
      await this.handleError(error, context);
      throw error;
    }
  }

  
  handleUnhandledRejection() {
   
    self.addEventListener('unhandledrejection', async (event) => {
      await this.handleError(event.reason, {
        type: 'unhandled-rejection',
        component: 'global',
        reportToBackend: true
      });
      event.preventDefault();
    });
  }


  generateErrorId() {
    return Math.random().toString(36).substr(2, 9);
  }

  getErrorKey(error) {
    const message = error.message.substring(0, 50);
    const stack = error.stack ? error.stack.split('\n')[1] : '';
    return `${message}|${stack}`;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async reportErrorToBackend(errorInfo) {
    try {
      
      const authResult = await new Promise((resolve) => {
        chrome.storage.local.get(['user', 'token'], (result) => {
          resolve(result);
        });
      });

      if (!authResult.user || !authResult.token) return;

      await fetch('http://localhost:8080/api/error-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authResult.token}`
        },
        body: JSON.stringify({
          ...errorInfo,
          userId: authResult.user,
          browserInfo: {
            userAgent: self.navigator.userAgent, 
            version: chrome.runtime.getManifest().version
          }
        })
      });
    } catch (error) {
      console.warn('Nu s-a putut raporta eroarea la backend:', error);
    }
  }

  async showUserNotification(errorInfo) {
    try {
      await chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/warning.png', 
        title: 'GuardianBit - Eroare',
        message: 'S-a întâmpinat o problemă. Vă rugăm să încercați din nou.',
        priority: 1
      });
    } catch (notificationError) {
      console.warn('Nu s-a putut afișa notificarea:', notificationError);
    }
  }


  cleanupOldLogs() {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 ore
    this.errorLog = this.errorLog.filter(log => log.timestamp > cutoff);
  }

  getErrorReport() {
    return {
      recentErrors: this.errorLog.slice(0, 10),
      errorCounts: Object.fromEntries(this.errorCounts),
      timestamp: Date.now()
    };
  }
}


const errorHandler = new ErrorHandler();


errorHandler.handleUnhandledRejection();


setInterval(() => errorHandler.cleanupOldLogs(), 60 * 60 * 1000);


self.errorHandler = errorHandler;