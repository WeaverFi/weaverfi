
// Imports:
import { create, IPFS } from 'ipfs-core';

// Initializations:
let globalNode: Promise<IPFS> | undefined;

/* ========================================================================================================================================================================= */

/**
 * Function to get (or create on first run) a functional IPFS node.
 * @returns Promise of an IPFS node.
 */
export const getIPFSNode = async () => {
  if(!globalNode) {
    globalNode = create();
  }
  return await globalNode;
}

/* ========================================================================================================================================================================= */

/**
 * Method to kill the currently running IPFS node, if any.
 */
export const killIPFSNode = async () => {
  if(globalNode) {
    await (await globalNode).stop();
    globalNode = undefined;
  }
}