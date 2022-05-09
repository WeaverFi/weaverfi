
// Type Imports:
import { Chain } from './types';

// Class to handle WeaverFi Errors:
export class WeaverError extends Error {
  public isWeaverError = true;
  constructor(public chain: Chain, public project: string | null, public description: string, public sourceError?: Error | unknown) {
    let message = '';
    if(project) {
      message = `Could not fetch ${project} balances on ${chain.toUpperCase()}`;
      if(description.endsWith('()')) {
        description += ' promise rejected';
      }
    } else if(description.startsWith('Querying') || description.includes('multicall')) {
      message = `Could not execute query on ${chain.toUpperCase()}`;
    } else if(description.includes('project:')) {
      message = `Invalid project queried on ${chain.toUpperCase()}`;
    }
    super(message);
  }
}