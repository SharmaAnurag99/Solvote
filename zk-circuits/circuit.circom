pragma circom 2.0.0;

include "node_modules/circomlib/circuits/poseidon.circom";
include "node_modules/circomlib/circuits/mux1.circom";

// Computes the node root from leaf to root
template MerkleTreeMembership_n(levels) {
    signal input leaf;
    signal input pathElements[levels];
    signal input pathIndices[levels];

    signal output root;

    component hashers[levels];
    component mux[levels][2];

    signal levelHashes[levels + 1];
    levelHashes[0] <== leaf;

    for (var i = 0; i < levels; i++) {
        // We use Poseidon hash for 2 inputs
        hashers[i] = Poseidon(2);
        
        // Mux to arrange the left/right order based on the pathIndex for the level
        mux[i][0] = Mux1();
        mux[i][0].c[0] <== levelHashes[i];
        mux[i][0].c[1] <== pathElements[i];
        mux[i][0].s <== pathIndices[i];

        mux[i][1] = Mux1();
        mux[i][1].c[0] <== pathElements[i];
        mux[i][1].c[1] <== levelHashes[i];
        mux[i][1].s <== pathIndices[i];

        hashers[i].inputs[0] <== mux[i][0].out;
        hashers[i].inputs[1] <== mux[i][1].out;

        levelHashes[i + 1] <== hashers[i].out;
    }

    root <== levelHashes[levels];
}

/*
  Election Proof Circuit
  Ensures:
  1. The user's Identity is derived from (Aadhar_UID, secretPin)
  2. The Identity is part of the Election's Merkle Tree (Authorized voter)
  3. A unique Nullifier is produced (so they only vote once per electionId)
*/
template VotingAuth(levels) {
    // --- Public Inputs ---
    signal input merkleRoot;      // The current root of the Eligible Voters Merkle Tree
    signal input electionId;      // The specific election they are voting in (to bind nullifier to election)

    // --- Private Inputs ---
    signal input voterId;         // The Mock Aadhar / Voter ID
    signal input secretPin;       // The biometric/secret Pin
    signal input pathElements[levels]; // Merkle Tree sibling elements
    signal input pathIndices[levels];  // Left(0)/Right(1) indices for the sibling path

    // --- Outputs ---
    signal output nullifierHash;  // Distinct public identifier for this user+election
    
    // 1. Generate the Identity Hash: Poseidon(voterId, secretPin)
    component identityHasher = Poseidon(2);
    identityHasher.inputs[0] <== voterId;
    identityHasher.inputs[1] <== secretPin;
    signal identityHash <== identityHasher.out;

    // 2. Generate the Nullifier Hash: Poseidon(identityHash, electionId)
    // The nullifier will be completely different per election.
    component nullifierHasher = Poseidon(2);
    nullifierHasher.inputs[0] <== identityHash;
    nullifierHasher.inputs[1] <== electionId;
    
    nullifierHash <== nullifierHasher.out;

    // 3. Verify Merkle Tree Membership
    component tree = MerkleTreeMembership_n(levels);
    tree.leaf <== identityHash;
    for (var i = 0; i < levels; i++) {
        tree.pathElements[i] <== pathElements[i];
        tree.pathIndices[i] <== pathIndices[i];
    }
    
    // Check if the generated root matches the provided public Merkle Root
    merkleRoot === tree.root;
}

// Instantiate the component with a tree of say, 20 levels (Capacity: 2^20 ~ 1 Million voters per tree)
component main {public [merkleRoot, electionId]} = VotingAuth(20);
