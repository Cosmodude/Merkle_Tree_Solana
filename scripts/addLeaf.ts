import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { MerkleTree } from "../target/types/merkle_tree"; 
import { PublicKey } from "@solana/web3.js";
import * as dotenv from "dotenv";
dotenv.config();

async function addLeaf() {
    console.log("start deploy")
  const provider = anchor.AnchorProvider.env(); 
  anchor.setProvider(provider);

  //console.log("Provider URL:", provider.connection);
  console.log("Wallet public key:", provider.wallet.publicKey.toBase58());

  const program = anchor.workspace.MerkleTree as Program<MerkleTree>;

  const [merkleTreePda, bump] = await PublicKey.findProgramAddressSync(
    [Buffer.from("merkle-tree")],
    program.programId
  );
  
  console.log("Derived PDA for Merkle Tree:", merkleTreePda.toBase58());

  // Example leaf to insert
  const leaf = Buffer.from(
    Array.from({ length: 32 }, (_, i) => (i + 1) % 256)
  );

  try {
    console.log("Inserting leaf...");

    // Sending the transaction to insert the leaf
    const tx = await program.methods
      .insertLeaf([...leaf]) 
      .accounts({
        merkleTree: merkleTreePda,
        signer: provider.wallet.publicKey, 
      })
      .rpc();

    console.log("Leaf inserted successfully. Transaction:", tx);
  } catch (error) {
    console.error("Error inserting leaf:", error);
  }
}

addLeaf().then(() => {
  console.log("Leaf insertion complete.");
}).catch((err) => {
  console.error("Error:", err);
});
