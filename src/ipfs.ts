import { create, IPFS } from 'ipfs-core';

// Variable to store our IPFS node:
let globalNode: Promise<IPFS> | undefined;

/**
 * Method to get (and create on first run) a functional IPFS node.
 * We are "lazy" loading the IPFS node so it only starts if the application needs it 
 * and only starts once if needed multiple times.
 * @returns Promise of IPFS node
 */
export async function IPFSNode() {
  if(!globalNode) {
    /**
     * @warning Assign the promise, NOT THE NODE! (this ensures we don't start the node multiple times on accident):
     */
    globalNode = create();
  }
  return await globalNode;
}

/**
 * Method to kill the IPFS node.
 */
export async function killIPFSNode() {
  if(globalNode) {
    await (await globalNode).stop();
    globalNode = undefined;
  }
}