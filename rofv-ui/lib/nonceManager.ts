// Basic offline durable nonce implementation for frontend testing
export async function getNextDurableNonce() {
  // In a real scenario, the kiosk pulls N durable nonces from the blockchain 
  // before disconnecting. It then caches them securely along with their authorities.
  return {
    pubkey: '11111111111111111111111111111111', 
    authority: '11111111111111111111111111111111' 
  };
}
