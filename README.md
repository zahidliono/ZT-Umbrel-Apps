# Fractal Bitcoin Solo Node — Umbrel Community App Store

Run a full **Fractal Bitcoin (FB)** node on Umbrel with a built-in dashboard and RPC endpoint for solo SHA-256 mining.

---

## ✅ Correct File Structure

This is what your GitHub repo must look like **exactly**:

```
your-repo/
├── umbrel-app-store.yml               ← store metadata (id + name)
└── fractal-store-solo-node/           ← folder name MUST match app id
    ├── umbrel-app.yml                 ← app listing details
    ├── docker-compose.yml             ← services definition
    ├── icon.svg                       ← 256x256 SVG icon (NO rounded corners)
    ├── 1.jpg                          ← gallery screenshots (1440x900)
    ├── 2.jpg
    ├── 3.jpg
    └── data/                          ← persisted volume data
        ├── bitcoin.conf               ← node config (copied on first run)
        └── dashboard/                 ← dashboard app files
            ├── server.js
            └── public/
                └── index.html
```

---

## 🚀 How to Install on Umbrel

### Step 1 — Put files on GitHub

1. Create a **new public GitHub repository** (e.g. `my-umbrel-apps`)
2. Upload **all files** from this zip exactly as structured above
3. Your repo URL will be: `https://github.com/YOUR_USERNAME/my-umbrel-apps`

> ⚠️ **Critical naming rules Umbrel enforces:**
> - `umbrel-app-store.yml` must have an `id:` field (e.g. `id: fractal-store`)
> - The app folder name **must exactly match** the `id:` in its `umbrel-app.yml`
> - The app `id:` must be **prefixed** with the store `id:` — e.g. `fractal-store-solo-node`
> - `icon.svg` must be a **local file** in the app folder — remote URLs don't work
> - Gallery images must be **local `.jpg` files** in the app folder — not URLs

### Step 2 — Add to Umbrel

1. Open Umbrel → **App Store**
2. Scroll to the bottom → click **"Add Community App Store"**
3. Paste your GitHub repo URL → click **Add**
4. The **"Fractal Bitcoin Node"** app will now appear with its icon

### Step 3 — Install & configure

1. Click the app → **Install**
2. Wait for initial blockchain sync (several hours)
3. Open the dashboard at `http://umbrel.local:8380`

---

## ⛏️ Connecting a Miner

Once synced, point your SHA-256 miner at:

```
Host:     umbrel.local  (or your Umbrel's LAN IP)
Port:     10332
User:     fractal
Password: fractal_umbrel_node
```

**cpuminer:**
```bash
./minerd -o http://umbrel.local:10332 -u fractal -p fractal_umbrel_node \
  --coinbase-addr=YOUR_FB_ADDRESS -a sha256d
```

**CGMiner:**
```bash
cgminer -o http://umbrel.local:10332 -u fractal -p fractal_umbrel_node \
  --coinbase-addr=YOUR_FB_ADDRESS
```

---

## 🔧 Customizing the Node

Edit `data/bitcoin.conf` and restart the app:
- Change `rpcpassword` to something personal (update docker-compose.yml env vars too)
- Set `prune=0` to keep full chain history (~100+ GB)
- Increase `maxconnections=50` for better peering

---

## 🔗 Resources

- [Fractal Bitcoin Docs](https://docs.fractalbitcoin.io)
- [fractald GitHub Releases](https://github.com/fractal-bitcoin/fractald-release/releases)
- [Fractal Block Explorer](https://explorer.fractalbitcoin.io)
- [UniSat Wallet](https://unisat.io) — for your FB coinbase address
- [Umbrel Community App Store Template](https://github.com/getumbrel/umbrel-community-app-store)
