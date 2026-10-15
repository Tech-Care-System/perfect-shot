# Mobile Testing Guide (iOS & Android)

## Why HTTPS is Required

Modern browsers (especially on mobile) block access to the camera (`getUserMedia`) unless the site is served over **HTTPS** or `localhost`.

- `http://localhost:3000` -> Works (Local machine only)
- `http://192.168.1.x:3000` -> **Fails** (Camera blocked)
- `https://192.168.1.x:3000` -> Works (If certificate accepted)

## Option 1: Use `local-ssl-proxy` (Recommended for Local Dev)

This creates a local HTTPS proxy for your dev server.

1.  **Install the proxy:**

    ```bash
    npm install -g local-ssl-proxy
    ```

2.  **Run the proxy:**
    Start your Next.js app in one terminal:

    ```bash
    pnpm run dev
    ```

    In a **second terminal**, run the proxy:

    ```bash
    local-ssl-proxy --source 3001 --target 3000
    ```

3.  **Access on Mobile:**
    - Find your computer's local IP (e.g., `192.168.1.50`).
    - Open Safari/Chrome on your phone.
    - Go to: `https://192.168.1.50:3001`
    - **Accept the "Not Secure" warning** (since it's a self-signed cert).
    - Camera access should now work!

## Option 2: Use `ngrok` (Easier, but slower)

Exposes your localhost to a public URL.

1.  **Run ngrok:**
    ```bash
    npx ngrok http 3000
    ```
2.  **Access on Mobile:**
    - Use the generated `https://xxxx.ngrok.io` link.

## Option 3: Android USB Debugging (Android Only)

You can forward ports via Chrome DevTools.

1.  Connect Android via USB.
2.  Open `chrome://inspect/#devices` on desktop.
3.  Enable "Port Forwarding".
4.  Map `3000` -> `localhost:3000`.
5.  Open `http://localhost:3000` on your phone.

## Debugging Checklist

- [ ] Is the phone on the same Wi-Fi?
- [ ] Did you accept the camera permission?
- [ ] Is the site loaded via **HTTPS**?
