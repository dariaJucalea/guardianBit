

export function isJwtExpired(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const now = Math.floor(Date.now() / 1000);
        return payload.exp < now;
    } catch (e) {
        console.error("❌ Eroare la verificarea tokenului:", e);
        return true;
    }
}

export function initAuth() {
    const showLogin = document.getElementById("show-login");
    const showRegister = document.getElementById("show-register");
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");
    const loginEmail = document.getElementById("login-email");
    const loginPassword = document.getElementById("login-password");
    const registerEmail = document.getElementById("register-email");
    const registerPassword = document.getElementById("register-password");
    const registerConfirm = document.getElementById("register-confirm-password");
    const loginBtn = document.getElementById("loginButton");
    const registerBtn = document.getElementById("registerButton");
    const authStatus = document.getElementById("authStatus");
    const logoutBtn = document.getElementById("logoutButton");
    const userInfo = document.getElementById("user-info");
    const loggedUser = document.getElementById("loggedUser");



    chrome.storage.local.get("user", (data) => {
        if (data.user) {
          document.getElementById("login-form")?.classList.add("hidden");
          document.getElementById("register-form")?.classList.add("hidden");
          document.getElementById("user-info")?.classList.remove("hidden");
        }
      });
      

    showRegister?.addEventListener("click", () => {
        registerForm.classList.remove("hidden");
        loginForm.classList.add("hidden");
        authStatus.textContent = "";
    });

    const backToLogin = document.getElementById("back-to-login");

    backToLogin?.addEventListener("click", () => {
        registerForm.classList.add("hidden");
        loginForm.classList.remove("hidden");
        authStatus.textContent = "";
    });


    loginBtn?.addEventListener("click", () => {
        const email = loginEmail.value.trim();
        const password = loginPassword.value.trim();

        fetch("http://localhost:8080/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        })
        .then(res => {
            if (!res.ok) throw new Error("Login failed");
            return res.json();
        })
        .then(data => {
            if (data.token && data.email) {
                chrome.storage.local.set({ user: data.email, token: data.token }, () => {
                    loginForm.classList.add("hidden");
                    registerForm.classList.add("hidden");
                    userInfo.classList.remove("hidden");
                    loggedUser.textContent = data.email;
                    authStatus.textContent = "✅ Autentificat!";
                });
            } else {
                throw new Error("Token lipsă în răspuns.");
            }
        })
        .catch(() => {
            authStatus.textContent = "❌ Email sau parolă greșită!";
        });
    });

    registerBtn?.addEventListener("click", () => {
        const email = registerEmail.value.trim();
        const password = registerPassword.value.trim();
        const confirm = registerConfirm.value.trim();

        if (password !== confirm) {
            authStatus.textContent = "❌ Parolele nu coincid!";
            return;
        }

        fetch("http://localhost:8080/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        })
        .then(res => {
            if (!res.ok) throw new Error();
            authStatus.textContent = "✅ Înregistrare reușită! Te poți autentifica acum.";
        })
        .catch(() => {
            authStatus.textContent = "❌ Acest email este deja înregistrat.";
        });
    });

    logoutBtn?.addEventListener("click", () => {
        chrome.storage.local.remove(["user", "token"], () => {
            userInfo.classList.add("hidden");
            loginForm.classList.remove("hidden");
            authStatus.textContent = "⛔ Te-ai delogat.";
        });
    });

    chrome.storage.local.get("user", function (data) {
        if (data.user) {
            userInfo.classList.remove("hidden");
            loggedUser.textContent = data.user;
        }
    });

    chrome.storage.local.get("token", ({ token }) => {
        if (token && isJwtExpired(token)) {
            chrome.storage.local.remove(["user", "token"]);
            authStatus.textContent = "⛔ Sesiune expirată. Te rugăm să te loghezi.";
            userInfo.classList.add("hidden");
            loginForm.classList.remove("hidden");
        }
    });
}
