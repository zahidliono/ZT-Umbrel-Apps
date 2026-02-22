# Fractal Bitcoin Solo Node — Umbrel Community App

Run a full **Fractal Bitcoin (FB)** node on your Umbrel with a built-in web dashboard and RPC endpoint for solo mining.

---

## 📦 Repository Structure

```
fractal-bitcoin-umbrel/
├── umbrel-app-store.yml          ← App store metadata
└── fractal-solo-node/
    ├── umbrel-app.yml            ← App listing (shown in Umbrel UI)
    ├── docker-compose.yml        ← Two services: node + dashboard
    ├── data/
    │   └── bitcoin.conf          ← Fractal node config (RPC, pruning, peers)
    └── dashboard/
        ├── Dockerfile            ← Node.js image for the web UI
        ├── server.js             ← Static file server + RPC proxy
        ├── index.html            ← Dashboard UI
        └── package.json
```

---

## 🚀 Installation on Umbrel

### Method 1 — Community App Store (Recommended)

This is the cleanest way. You host the app store on GitHub and add it to Umbrel.

**Step 1 — Fork / host this repository on GitHub**

1. Create a new GitHub repository (e.g. `my-umbrel-apps`).
2. Copy the contents of this folder into it:
   ```
   umbrel-app-store.yml
   fractal-solo-node/
   ```
3. Push to GitHub and make the repository **public**.
4. Note your repo URL, e.g.: `https://github.com/YOUR_USERNAME/my-umbrel-apps`

**Step 2 — Add your community app store to Umbrel**

1. Open your Umbrel dashboard → **App Store**
2. Scroll to the bottom and click **"Add Community App Store"**
3. Paste your GitHub repo URL and click **Add**
4. The "Fractal Bitcoin Node" app will appear in your store

**Step 3 — Install the app**

1. Click **Fractal Bitcoin Node** → **Install**
2. Umbrel will pull the Docker images and start the containers
3. Open the app — you'll see the node dashboard at `http://umbrel.local:8380`

---

### Method 2 — Dockge (No GitHub required)

If you don't want to host a GitHub repo:

1. Install **Dockge** from the Umbrel App Store
2. Open Dockge at `http://umbrel.local:5001`
3. Click **"+ Compose"**
4. Paste the contents of `docker-compose.yml`
5. Set the stack name to `fractal-solo-node`
6. Click **Deploy**

> Note: With Dockge you won't get the Umbrel home screen icon, but the node will run identically.

---

### Method 3 — SSH / Manual Docker Compose

SSH into your Umbrel and run:

```bash
# 1. Create app directory
mkdir -p ~/fractal-node/data

# 2. Copy bitcoin.conf
cat > ~/fractal-node/data/bitcoin.conf << 'EOF'
server=1
rpcuser=fractal
rpcpassword=fractal_umbrel_node
rpcallowip=0.0.0.0/0
rpcbind=0.0.0.0
rpcport=10332
maxtipage=504576000
maxconnections=25
prune=10000
EOF

# 3. Start the Fractal Bitcoin node
cd ~/fractal-node
docker run -d \
  --name fractal_node \
  --restart unless-stopped \
  -v $(pwd)/data:/data \
  -p 8333:8333 \
  -p 127.0.0.1:10332:10332 \
  fractalbitcoin/fractal:v0.2.1 \
  bitcoind -datadir=/data -conf=/data/bitcoin.conf -maxtipage=504576000

# 4. Check sync status
docker exec fractal_node bitcoin-cli -datadir=/data getblockchaininfo
```

---

## ⛏️ Connecting Your Miner

Once the node is synced (this takes several hours to a day), point your SHA-256 miner at it.

### cpuminer (CPU / testing only)
```bash
./minerd \
  -o http://umbrel.local:10332 \
  -u fractal \
  -p fractal_umbrel_node \
  --coinbase-addr=YOUR_FB_ADDRESS \
  -a sha256d \
  --no-longpoll
```

### CGMiner / BFGMiner
```bash
cgminer \
  -o http://umbrel.local:10332 \
  -u fractal \
  -p fractal_umbrel_node \
  --coinbase-addr=YOUR_FB_ADDRESS
```

### ASIC Miner (via Pool Software)
For ASIC miners you typically need stratum pool middleware like **CKPool** or **ViaBTC pool software** sitting between your ASIC and the node's GBT (getblocktemplate) RPC. Configure the pool software with:

| Field | Value |
|-------|-------|
| Host | `umbrel.local` or your Umbrel's LAN IP |
| Port | `10332` |
| RPC User | `fractal` |
| RPC Password | `fractal_umbrel_node` |

### Merged Mining (AuxPoW)
If you want to merged-mine FB alongside BTC using pool software:
```json
{
  "aux_coin": [{
    "name": "FB",
    "host": "umbrel.local",
    "port": 10332,
    "user": "fractal",
    "pass": "fractal_umbrel_node",
    "address": "YOUR_FB_ADDRESS"
  }],
  "ChainID": "0x2024"
}
```

---

## 🔧 Configuration

Edit `data/bitcoin.conf` to customize. Key options:

| Option | Default | Notes |
|--------|---------|-------|
| `rpcpassword` | `fractal_umbrel_node` | **Change this for production!** |
| `prune` | `10000` (~10 GB) | Set to `0` to keep full chain history |
| `maxconnections` | `25` | Increase for better peer connectivity |
| `txindex` | `0` | Set to `1` for full transaction lookup (requires more disk) |

After editing, restart the container:
```bash
docker restart fractal_node
```

---

## 📊 Monitoring

- **Web Dashboard**: `http://umbrel.local:8380`
- **Direct RPC** (from Umbrel SSH):
  ```bash
  docker exec fractal_node bitcoin-cli -datadir=/data getblockchaininfo
  docker exec fractal_node bitcoin-cli -datadir=/data getmininginfo
  docker exec fractal_node bitcoin-cli -datadir=/data getpeerinfo
  ```

---

## ⚠️ Important Notes

1. **Disk space**: The node uses ~10 GB in pruned mode (default). Full archival mode needs 100+ GB.
2. **Sync time**: Initial sync takes several hours. Mining is not possible until fully synced.
3. **Solo mining difficulty**: Permissionless solo mining difficulty is ~5 GH. Without powerful ASICs, blocks will be extremely rare. For consistent income, use an established pool and just run this node for network participation.
4. **No FB incentive for just running a node**: Unlike some chains, simply running a Fractal Bitcoin node does not earn rewards — you need to actively mine.
5. **Wallet**: Use [UniSat Wallet](https://unisat.io) or [OKX Wallet](https://www.okx.com/web3) for your FB coinbase address.

---

## 🛠️ Updating

To update to a newer version of fractald:

1. Edit `docker-compose.yml` and change `image: fractalbitcoin/fractal:v0.2.1` to the new version tag
2. Check [GitHub releases](https://github.com/fractal-bitcoin/fractald-release/releases) for latest version
3. Restart: `docker compose up -d --pull always`

---

## 🔗 Resources

- [Fractal Bitcoin Official Docs](https://docs.fractalbitcoin.io)
- [Official Mining Guide](https://docs.fractalbitcoin.io/node-operation/mining/how-to-mine)
- [fractald GitHub Releases](https://github.com/fractal-bitcoin/fractald-release/releases)
- [Fractal Block Explorer](https://explorer.fractalbitcoin.io)
- [UniSat Wallet](https://unisat.io)
- [Umbrel Community App Store Docs](https://github.com/getumbrel/umbrel-community-app-store)
