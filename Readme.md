# Solana Merkle Tree Program

## Overview
This project implements a Merkle Tree program on the Solana blockchain using the Anchor framework. The program provides functionality to:

- **Initialize a Merkle Tree:** Create a new tree with an empty root and no leaves.
- **Insert Leaves:** Add leaf nodes to the tree, automatically updating the Merkle root.
- **Calculate Merkle Roots:** Recalculate the root whenever a new leaf is added.
- **Log Events:** Emit the updated root hash for off-chain listeners after each insertion.

**Limitations**
- current programm saves tree leaves in vector, thus is limited to maximum account size of 10,240 bytes (318 leaves). 
(couldn't test due to Solana compute limits)

---

## Features

1. **Dynamic Leaf Management:**
   - Leaves are stored in a `Vec<[u8; 32]>`, allowing dynamic insertion up to a fixed maximum size.

2. **SHA-256 Hashing:**
   - Each level of the Merkle tree is calculated by hashing pairs of nodes using SHA-256.

3. **Event Emission:**
   - After each leaf insertion, the updated root hash is emitted as a log message using Solana’s `msg!` mechanism.

4. **Anchor Framework:**
   - Simplifies account management and serialization/deserialization with Borsh.

---

## Project Structure

```
├── programs
│   └── merkle-tree
│       ├── src
│       │   ├── lib.rs        # Main program logic
│       │   └── Cargo.toml    # Program dependencies
├── migrations
│   └── deploy.ts             # Deployment script
├── tests
│   └── merkle-tree.js        # Integration tests
└── Anchor.toml               # Anchor configuration
```

---

## Instructions

### 1. **Initialize the Merkle Tree**
This instruction initializes a new Merkle tree account with an empty root and no leaves.

#### Input:
- No additional parameters.


check after here 
#### Example:
```bash
anchor run initialize
```

---

### 2. **Insert a Leaf**
Adds a new leaf to the Merkle tree and updates the root hash.

#### Input:
- `leaf`: A 32-byte array representing the new leaf hash.

#### Example:
```bash
anchor run insert-leaf --leaf 0x1234abcd...
```

---

## Installation and Usage

### Prerequisites
- **Rust**: Install via [rustup](https://rustup.rs/).
- **Solana CLI**: Install using the [official guide](https://docs.solana.com/cli/install-solana-cli-tools).
- **Anchor CLI**: Install using the [Anchor documentation](https://book.anchor-lang.com/getting_started/installation.html).

### Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/solana-merkle-tree.git
   cd solana-merkle-tree
   ```

2. Install dependencies:
   ```bash
   anchor build
   ```

3. Deploy the program:
   ```bash
   anchor deploy
   ```

4. Run tests:
   ```bash
   anchor test
   ```

---

## Account Structures

### MerkleTree
Stores the Merkle tree state.

```rust
#[account]
pub struct MerkleTree {
    pub root: [u8; 32],         // Current Merkle root hash
    pub leaves: Vec<[u8; 32]>, // List of leaf hashes
}
```

- **Size Calculation:**
  ```
  8 (discriminator) + 32 (root) + 4 (Vec length prefix) + (MAX_LEAVES * 32)
  ```

### Example Sizes:
- For `MAX_LEAVES = 30`, the account size is `8 + 32 + 4 + (30 * 32) = 1024 bytes`.

---

## Event Logs
After inserting a leaf, the updated Merkle root is emitted using:

```rust
msg!("Updated Merkle Root: {:?}", new_root);
```

This allows off-chain listeners to track changes to the Merkle tree.

---

## Testing

Tests are written using the Solana `solana-program-test` framework and Anchor’s testing utilities.

### Key Test Cases
1. **Initialize the Merkle Tree:**
   - Verify that the root is `[0u8; 32]` and the leaf list is empty after initialization.

2. **Insert Leaves:**
   - Test inserting leaves and validate the updated root.

3. **Edge Cases:**
   - Handle odd numbers of leaves.
   - Ensure the maximum size limit is enforced.

Run tests:
```bash
anchor test
```

---

## Possible Improvements
- Support for dynamic scaling using PDA accounts for leaves.
- Optimization of Merkle root calculation by storing intermediate hashes.(?)

---

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---


