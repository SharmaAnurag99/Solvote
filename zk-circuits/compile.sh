#!/bin/bash

# ==============================================================================
# ZERO KNOWLEDGE (zk-SNARK) COMPILATION & SETUP SCRIPT
# This script prepares the cryptographic assets required to prove and verify 
# offline anonymous votes in a Delay-Tolerant, zero-knowledge voting system.
# ==============================================================================


echo "--- 1. Compile the Circuit ---"
# WHY: We must turn our human-readable logic (.circom) into constraints (R1CS)
#      and build a WebAssembly (.wasm) binary so our React app can generate 
#      zkProofs natively on offline Polling Booth machines.
# HOW: 'circom' generates 'circuit.r1cs', and inside 'circuit_js/' the generic logic.
./circom circuit.circom --r1cs --wasm --sym

echo "--- 2. Trusted Setup (Powers of Tau) - Phase 1 ---"
# WHY: zk-SNARKs require a "Trusted Setup" (a secure multi-party computation ceremony). 
#      Phase 1 is a generic setup for ANY circuit of a given size. 
#      '16' means 2^16 = 65,536 constraints (enough for a 20-level Merkle Tree).
# HOW: Generates a base 'pot16_0000.ptau' file.
npx snarkjs powersoftau new bn128 16 pot16_0000.ptau -v

# Simulate a "contribution" to the randomness (in reality, many people do this in a ring).
npx snarkjs powersoftau contribute pot16_0000.ptau pot16_0001.ptau --name="Voting Booth Ceremony" -v -e="some random text entropy here for blockvote"

echo "--- 3. Trusted Setup - Phase 2 (Circuit Specific) ---"
# WHY: Now we bind the generic randomness to OUR specific voting circuit (circuit.r1cs).
npx snarkjs powersoftau prepare phase2 pot16_0001.ptau pot16_final.ptau -v

# Generate the initial ZKey (Proving Key) which integrates the circuit with the setup.
npx snarkjs groth16 setup circuit.r1cs pot16_final.ptau circuit_0000.zkey

# Contribute to the Phase 2 ZKey (creating the final secure ZKey) 
# Note: The .zkey is HUGE (~10s of MBs). The React frontend requires this file 
# to generate the ZK Proof locally while offline.
npx snarkjs zkey contribute circuit_0000.zkey circuit_final.zkey --name="BlockVote Phase 2" -v -e="more blockvote entropy"

echo "--- 4. Extracting the Verification Key ---"
# WHY: A Verification Key (.json) is extracted from the massive .zkey file. 
#      This JSON file is tiny and will be used by our Solana Smart Contract 
#      (or a backend server) to mathematicaly verify that the frontend's ZK Proof 
#      is 100% valid WITHOUT ever seeing the user's Aadhar/PIN.
npx snarkjs zkey export verificationkey circuit_final.zkey verification_key.json

echo "✅ ZK Proof generation artifacts are ready!"
echo "Put 'circuit_js/circuit.wasm' and 'circuit_final.zkey' into the React frontend."
echo "Put 'verification_key.json' into the Solana Smart Contract validation logic."
