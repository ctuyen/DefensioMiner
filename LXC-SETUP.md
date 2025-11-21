# Defensio Miner - LXC Container Setup Guide

This guide is specifically for running Defensio Miner in an LXC container on Proxmox with 13 vCPU allocation.

## Mining Automation Variables Explained

### Key Variables for LXC Configuration

#### `--batch` / `AUTOMATE_SOLVER_BATCH_SIZE` (Default: 1)
**What it means:** Number of wallets processed per solver batch run.

**How it works:** The poller spawns the Rust solver once per batch. If you have 100 wallets and `--batch 8`, it will run ~13 batches sequentially (8+8+8+...+4).

**For your LXC (13 vCPU):** Set to **8**
- Keeps all 13 vCPUs busy with parallel hashing
- Balances memory usage (~1GB ROM per wallet = ~8GB total)
- Provides good throughput without overwhelming the container

#### `--wallet-concurrency` / `AUTOMATE_WALLET_CONCURRENCY` (Default: 5)
**What it means:** How many wallets submit solutions to the API simultaneously during the submission phase.

**How it works:** After generating solutions, this controls HTTP request parallelism. Higher = faster submission but more API load.

**For your LXC:** Set to **8**
- Matches your batch size for optimal flow
- Provides good HTTP throughput without hitting rate limits
- Adjust down to 5 if you hit API 429 (rate limit) errors

#### `ASHMAIZE_THREADS` (Default: Physical CPU cores)
**What it means:** Number of threads the Rust solver uses for parallel hashing.

**For your LXC:** Set to **13**
- Uses all available vCPUs
- Maximizes hash rate
- Each thread independently searches for solutions

### Recommended Settings Summary

| Variable | Value | Reason |
|----------|-------|--------|
| `ASHMAIZE_THREADS` | 13 | Use all vCPUs |
| `AUTOMATE_SOLVER_BATCH_SIZE` | 8 | Balance memory/throughput |
| `AUTOMATE_WALLET_CONCURRENCY` | 8 | Match batch size |
| `ASHMAIZE_BATCH_SIZE` | 16 | Optimal salt checking batch |
| `FAST_SUBMIT_CONCURRENCY` | 16 | Fast backlog submission |

## Installation Steps

### 1. Install Prerequisites in LXC

```bash
# Update system
apt-get update
apt-get upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source $HOME/.cargo/env

# Install build dependencies
apt-get install -y build-essential pkg-config libssl-dev git
```

### 2. Clone and Build

```bash
# Clone the repository (adjust path as needed)
cd /root
git clone <your-repo-url> DefensioMiner
cd DefensioMiner

# Install Node dependencies
npm install

# Build the Rust solver (auto-optimized for your CPU)
npm run build:solver
```

### 3. Configure Environment

```bash
# The .env.lxc file is already optimized for your 13 vCPU setup
# Review and adjust if needed
nano .env.lxc

# Generate wallets (adjust count as needed)
node src/cli.js generate --count 100

# Register wallets
node src/cli.js register --from 1 --to 100
```

### 4. Install Systemd Service

```bash
# Copy the service file to systemd directory
cp defensio-miner-lxc.service /etc/systemd/system/defensio-miner.service

# Reload systemd
systemctl daemon-reload

# Enable service to start on boot
systemctl enable defensio-miner

# Start the service
systemctl start defensio-miner

# Check status
systemctl status defensio-miner

# View logs
journalctl -u defensio-miner -f
```

## Monitoring

### Check Service Status
```bash
systemctl status defensio-miner
```

### View Real-time Logs
```bash
journalctl -u defensio-miner -f
```

### View Recent Logs
```bash
journalctl -u defensio-miner -n 100
```

### Check Resource Usage
```bash
# CPU and memory usage
htop

# Systemd resource accounting
systemctl show defensio-miner | grep -E '(CPU|Memory)'
```

## Performance Tuning

### If Memory Issues Occur
Reduce batch size in `.env.lxc`:
```bash
AUTOMATE_SOLVER_BATCH_SIZE=5
AUTOMATE_WALLET_CONCURRENCY=5
```

### If API Rate Limiting Occurs
Reduce concurrency in `.env.lxc`:
```bash
AUTOMATE_WALLET_CONCURRENCY=5
FAST_SUBMIT_CONCURRENCY=8
```

### If CPU is Underutilized
Increase batch size in `.env.lxc`:
```bash
AUTOMATE_SOLVER_BATCH_SIZE=10
```

## Troubleshooting

### Service Won't Start
```bash
# Check for errors
journalctl -u defensio-miner -n 50

# Verify environment file
cat .env.lxc

# Test manually
cd /root/DefensioMiner
npm start
```

### High Memory Usage
- Reduce `AUTOMATE_SOLVER_BATCH_SIZE`
- Each wallet uses ~1GB for ROM generation
- Monitor with `htop` or `free -h`

### Low Hash Rate
- Verify `ASHMAIZE_THREADS=13` is set
- Check CPU usage with `htop`
- Ensure no CPU throttling in Proxmox

### API Errors (429 Rate Limit)
- Reduce `AUTOMATE_WALLET_CONCURRENCY`
- Increase `CHALLENGE_POLL_INTERVAL_MS`
- Add delays between submissions

## Stopping the Service

```bash
# Stop the service
systemctl stop defensio-miner

# Disable auto-start
systemctl disable defensio-miner

# Remove service (if needed)
systemctl stop defensio-miner
systemctl disable defensio-miner
rm /etc/systemd/system/defensio-miner.service
systemctl daemon-reload
```

## Updating the Miner

```bash
# Stop the service
systemctl stop defensio-miner

# Update code
cd /root/DefensioMiner
git pull

# Rebuild if needed
npm install
npm run build:solver

# Restart service
systemctl start defensio-miner
```

