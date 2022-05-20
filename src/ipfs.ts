import { create, IPFS } from 'ipfs-core';

// Method to get (and create on first run) a functional IPFS node:
let globalNode: Promise<IPFS> | undefined;
export async function IPFSNode() {
  if(!globalNode) {
    globalNode = create();
  }
  return await globalNode;
}