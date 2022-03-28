
// Required Packages:
const fs = require('fs');

// Imports:
import type { Chain } from './types';

// Initializations:
const projectsFile = 'projects.json';

/* ========================================================================================================================================================================= */

// Function to update 'projects.json' file:
const updateProjects = () => {

  // Initializing Project List:
  let projectList: Record<Chain, string[]> = { 'eth': [], 'bsc': [], 'poly': [], 'ftm': [], 'avax': [], 'one': [], 'terra': [] };

  // Update Alert:
  console.info(`Updating projects file...`);

  // Fetching Data:
  let chains: string[] = fs.readdirSync('./dist/projects');
  chains.forEach(stringChain => {
    let chain = stringChain as Chain;
    let projects = fs.readdirSync(`./dist/projects/${chain}`).filter((project: string) => !project.endsWith('.d.ts')).map((project: string) => project.slice(0, -3));
    projectList[chain].push(...projects);
  });

  // Writing File:
  fs.writeFile(`./static/${projectsFile}`, JSON.stringify(projectList, null, ' '), 'utf8', (err: any) => {
    if(err) {
      console.error(err);
    } else {
      console.info(`Successfully updated ${projectsFile}.`);
    }
  });
}

/* ========================================================================================================================================================================= */

// Updating Projects List:
updateProjects();