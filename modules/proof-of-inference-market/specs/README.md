# Proof-of-Inference AVS Runtime Specifications

This directory contains runtime specifications for the Proof-of-Inference AVS system.

## Directory Structure

- `runtime/` - Runtime configurations for different environments
  - `devnet.yaml` - Development network runtime configuration
  - `testnet.yaml` - Testnet runtime configuration  
  - `mainnet.yaml` - Production mainnet runtime configuration

## Runtime Configuration

Runtime specifications define:

- **Performance parameters** - Timeouts, concurrency limits, resource allocation
- **ML model configurations** - Supported models, verification thresholds, accuracy requirements
- **Network settings** - RPC endpoints, contract addresses, gas settings
- **Agent configurations** - ML verification agents, validator settings, staking parameters
- **Integration settings** - ERC-8004 receipt parameters, 4Mica payment settings
- **Security policies** - Rate limiting, authentication, slashing conditions

## Usage

Runtime configurations are loaded by the AVS performer based on the environment:

```bash
# Development
export RUNTIME_CONFIG=specs/runtime/devnet.yaml

# Testnet
export RUNTIME_CONFIG=specs/runtime/testnet.yaml

# Production
export RUNTIME_CONFIG=specs/runtime/mainnet.yaml
```

## Configuration Validation

All runtime configurations are validated against the schema defined in the EigenLayer hourglass monorepo standards.