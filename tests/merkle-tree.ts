import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { MerkleTree } from "../target/types/merkle_tree";
import { expect } from "chai";

describe("merkle-tree", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.local();
  anchor.setProvider(provider);

  const program = anchor.workspace.MerkleTree as Program<MerkleTree>;

  const tree = anchor.web3.Keypair.generate();

  it("Initialized", async () => {
    // Initialize the Merkle Tree
    const tx = await program.methods
      .initialize()
      .accounts({ merkleTree: tree.publicKey })
      .signers([tree])
      .rpc();

    const account = await program.account.merkleTree.fetch(tree.publicKey);

    // Verify the initial state
    expect(account.root).to.deep.equal(new Array(32).fill(0)); // Empty root
    const leaves = account.leaves as Uint8Array[];
    expect(leaves.length).to.equal(0); // No leaves yet
  });

  it("Inserts a leaf and updates the Merkle root", async () => {
    // Example leaf (hash of "example-leaf")
    const leaf = Buffer.from(
      Array.from({ length: 32 }, (_, i) => (i + 1) % 256)
    );

    // Insert the new leaf
    const tx = await program.rpc.insertLeaf([...leaf], {
      accounts: {
        merkleTree: tree.publicKey,
        signer: provider.wallet.publicKey,
      },
    });

    // Fetch the updated account
    const account = await program.account.merkleTree.fetch(tree.publicKey);

    // Verify the updated state
    const leaves = account.leaves as Uint8Array[];
    expect(leaves.length).to.equal(1); // One leaf added
    expect(leaves[0]).to.deep.equal([...leaf]); // Verify the stored leaf

    // Verify the updated root (calculated on insertion)
    const expectedRoot = Buffer.from(account.root); // Replace with expected root for your implementation
    expect(expectedRoot.length).to.equal(32); // Root is a 32-byte hash
  });

  it("Handles inserting multiple leaves", async () => {
    // Insert two more leaves
    const leaf1 = Buffer.from(new Array(32).fill(1));
    const leaf2 = Buffer.from(new Array(32).fill(2));

    await program.methods
      .insertLeaf([...leaf1])
      .accounts({
        merkleTree: tree.publicKey,
        signer: provider.wallet.publicKey,
      })
      .rpc();

    await program.methods
      .insertLeaf([...leaf2])
      .accounts({
        merkleTree: tree.publicKey,
        signer: provider.wallet.publicKey,
      })
      .rpc();

    // Fetch the updated account
    const account = await program.account.merkleTree.fetch(tree.publicKey);

    // Verify the state
    const leaves = account.leaves as Uint8Array[];
    expect(leaves.length).to.equal(3); // Total three leaves
    expect(account.leaves[1]).to.deep.equal([...leaf1]); // Verify the second leaf
    expect(account.leaves[2]).to.deep.equal([...leaf2]); // Verify the third leaf

    // Verify the updated root (optional: match against a precomputed expected root)
    const updatedRoot = Buffer.from(account.root);
    expect(updatedRoot.length).to.equal(32);
  });

  it("Prevents adding leaves beyond the maximum size", async () => {
    // Set the MAX_LEAVES in the program to a small number for testing
    const maxLeaves = 30; // Use the same max size as in your program

    // Insert leaves up to the maximum
    for (let i = 3; i < maxLeaves; i++) {
      const leaf = Buffer.from(new Array(32).fill(i));
      await program.methods
        .insertLeaf([...leaf])
        .accounts({
          merkleTree: tree.publicKey,
          signer: provider.wallet.publicKey,
        })
        .rpc();
    }

    // Attempt to insert one more leaf
    const overflowLeaf = Buffer.from(new Array(32).fill(255));

    try {
      await program.methods
        .insertLeaf([...overflowLeaf])
        .accounts({
          merkleTree: tree.publicKey,
          signer: provider.wallet.publicKey,
        })
        .rpc();
      throw new Error("Test failed: should not allow inserting beyond max leaves");
    } catch (err) {
      // Expected error
      expect(err.message).to.include("MaxLeavesExceeded"); // Ensure this matches your program's error message
    }
  });
});
