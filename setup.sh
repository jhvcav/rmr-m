#!/bin/bash
# Installer Solana
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
export PATH="/home/codespace/.local/share/solana/install/active_release/bin:$PATH"

# Installer Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source $HOME/.cargo/env

# Installer Anchor
cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked