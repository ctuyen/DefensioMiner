# Running Defensio Miner

This guide explains how to set up, configure, and run the Defensio Miner tool.

## Prerequisites

- **Node.js**: Version 18 or higher.
- **Rust**: Required for building the solver.
- **OS**: Linux (Ubuntu/Debian recommended) or macOS.

## Installation

### Installing Prerequisites

#### macOS

1.  **Install Homebrew** (if not already installed):
    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    ```

2.  **Install Node.js**:
    ```bash
    brew install node
    ```

3.  **Install Rust**:
    ```bash
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
    source $HOME/.cargo/env
    ```

#### Linux (Ubuntu/Debian)

1.  **Install Node.js**:
    ```bash
    # Using NodeSource repository for latest version
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```

2.  **Install Rust**:
    ```bash
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
    source $HOME/.cargo/env
    ```

3.  **Install build essentials** (if not already installed):
    ```bash
    sudo apt-get update
    sudo apt-get install -y build-essential pkg-config libssl-dev
    ```

### Installing Defensio Miner

1.  **Clone or download the repository** (if not already done):
    ```bash
    cd /path/to/your/projects
    # If you have the source, navigate to it
    cd DefensioMiner
    ```

2.  **Install Node.js Dependencies**:
    ```bash
    npm install
    ```

3.  **Build the Rust Solver**:
    This compiles the Rust-based solver binary.
    ```bash
    npm run build:solver
    ```
    
    Alternatively, you can build manually using Cargo:
    ```bash
    cd solver
    cargo build --release
    cd ..
    ```

## Configuration

Configuration is primarily done via environment variables. You can set these in your shell or a `.env` file (if you add a loader, otherwise export them).

| Variable | Description | Default |
| :--- | :--- | :--- |
| `DEFENSIO_WALLET_ROOT` | Path to store wallet data. | `./wallets` |
| `DEFENSIO_API_BASE` | API base URL. | `https://mine.defensio.io/api` |
| `AUTOMATE_WALLET_CONCURRENCY` | Number of wallets to process concurrently. | `5` |
| `AUTOMATE_SOLVER_BATCH_SIZE` | Number of wallets per solver batch. | `16` |

## Usage

The tool is a unified CLI. You can run it via `npm start` (which maps to `node src/cli.js start`) or directly via `node src/cli.js <command>`.

### 1. Generate Wallets

Generate a set of wallets. These will be stored in `wallets/generated`.

```bash
# Generate 10 wallets
node src/cli.js generate --count 10

# Customize mnemonic length (default 24)
node src/cli.js generate --count 10 --mnemonic-length 15
```

### 2. Register Wallets

Register the generated wallets with the mining pool. This moves them to `wallets/registered` (and copies to `wallets/mining`).

```bash
node src/cli.js register
```

### 3. Start Mining

Start the mining process. This will poll for challenges, run the solver, and submit solutions.

```bash
# Start mining
node src/cli.js start

# Or using the npm script
npm start
```

---

## Running as a Systemd Service (Ubuntu)

To ensure the miner runs continuously and restarts on failure, set it up as a systemd service.

1.  **Create the Service File**:
    Create a file named `/etc/systemd/system/defensio-miner.service` with the following content. Replace `/path/to/DefensioMiner` with your actual project path and `youruser` with your username.

    ```ini
    [Unit]
    Description=Defensio Miner Service
    After=network.target

    [Service]
    Type=simple
    User=youruser
    WorkingDirectory=/path/to/DefensioMiner
    # Set environment variables here if needed
    # Environment=DEFENSIO_WALLET_ROOT=/path/to/DefensioMiner/wallets
    # Environment=AUTOMATE_WALLET_CONCURRENCY=10
    
    # Command to run (ensure node is in path or use absolute path like /usr/bin/node)
    ExecStart=/usr/bin/npm start
    
    # Restart policy
    Restart=always
    RestartSec=10

    # Logging
    StandardOutput=syslog
    StandardError=syslog
    SyslogIdentifier=defensio-miner

    [Install]
    WantedBy=multi-user.target
    ```

2.  **Reload Systemd**:
    ```bash
    sudo systemctl daemon-reload
    ```

3.  **Enable and Start the Service**:
    ```bash
    # Enable start on boot
    sudo systemctl enable defensio-miner

    # Start immediately
    sudo systemctl start defensio-miner
    ```

4.  **View Logs**:
    ```bash
    sudo journalctl -u defensio-miner -f
    ```

