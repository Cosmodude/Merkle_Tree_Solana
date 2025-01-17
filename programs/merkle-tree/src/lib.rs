use anchor_lang::prelude::*;
use anchor_lang::solana_program::hash::hash as sha256_hash;
use borsh::{BorshDeserialize};

declare_id!("FuGmDsT3CEkML6gpLUv9mdsdQG3T4J2y4xY8GH2Le6Sn");

#[program]
pub mod merkle_tree {
    use super::*;

    /// Initialize the Merkle tree root account.
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let merkle_tree = &mut ctx.accounts.merkle_tree;
        merkle_tree.root = [0u8; 32]; // Initial empty root
        merkle_tree.leaves = vec![]; // Start with no leaves
        Ok(())
    }

    /// Insert a new leaf, update the root, and log the new root hash.
    pub fn insert_leaf(ctx: Context<InsertLeaf>, leaf: [u8; 32]) -> Result<()> {
        let merkle_tree = &mut ctx.accounts.merkle_tree;

        // Check if the number of leaves exceeds the maximum limit
        if merkle_tree.leaves.len() >= MerkleTree::MAX_LEAVES {
            return Err(error!(ErrorCode::MaxLeavesExceeded));
        }

        // Add the new leaf to the list of leaves
        merkle_tree.leaves.push(leaf);

        // Recalculate the Merkle root
        let new_root = calculate_merkle_root(&merkle_tree.leaves)?;
        merkle_tree.root = new_root;

        // Log the updated root
        msg!("Updated Merkle Root: {:?}", new_root);

        Ok(())
    }
}

/// Account storing the Merkle tree state.
#[account]
pub struct MerkleTree {
    pub root: [u8; 32],         // Current Merkle root hash
    pub leaves: Vec<[u8; 32]>, // List of leaf hashes
}

impl MerkleTree {
    pub const MAX_LEAVES: usize = 30; // Maximum number of leaves
    pub const LEN: usize = 8 + 32 + (4 + MerkleTree::MAX_LEAVES * 32); // Account size
}

/// Context for initializing the Merkle tree root account.
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = signer,
        space = MerkleTree::LEN
    )]
    pub merkle_tree: Account<'info, MerkleTree>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

/// Context for inserting a new leaf into the Merkle tree.
#[derive(Accounts)]
pub struct InsertLeaf<'info> {
    #[account(mut)]
    pub merkle_tree: Account<'info, MerkleTree>,

    #[account(mut)]
    pub signer: Signer<'info>,
}

/// Calculate the Merkle root from a list of leaves.
fn calculate_merkle_root(leaves: &Vec<[u8; 32]>) -> Result<[u8; 32]> {
    let mut current_level = leaves.clone();

    while current_level.len() > 1 {
        let mut next_level = vec![];

        for i in (0..current_level.len()).step_by(2) {
            let left = current_level[i];
            let right = if i + 1 < current_level.len() {
                current_level[i + 1]
            } else {
                current_level[i] // Duplicate the last node if odd number of leaves
            };

            let mut combined = vec![];
            combined.extend_from_slice(&left);
            combined.extend_from_slice(&right);

            let hash = sha256_hash(&combined);
            next_level.push(hash.to_bytes());
        }

        current_level = next_level;
    }

    Ok(current_level[0]) // Final hash is the root
}

#[error_code]
pub enum ErrorCode {
    #[msg("The maximum number of leaves has been exceeded.")]
    MaxLeavesExceeded,
}
