
// Required Packages:
const fs = require('fs');

// Initializations:
const warningMessage = `/* [HEED MY WARNING FELLOW DEV!] This file was auto-generated during build by '/pre-build/projects.js'. Any changes to this file directly will not persist after building. [FARE THEE WELL] */\n\n`;

/* ========================================================================================================================================================================= */

// Fetching chains from folders in 'src/projects':
const chains = fs.readdirSync('src/projects').filter(dir => fs.statSync(`src/projects/${dir}`).isDirectory());

// Fetching projects from each chain's folder:
const projects = chains.map(chain => fs.readdirSync(`src/projects/${chain}`).filter(file => file.endsWith('.ts')).map(file => file.slice(0, file.length - 3)));

/* ========================================================================================================================================================================= */

// Auto-Generating 'src/project-lib.ts':
const writeProjectLib = () => {

  // Initializations:
  let contents = '';
  let recordContents = '';

  // Warning Message:
  contents += warningMessage;

  // Chain Type Import:
  contents += `// Type Imports:\nimport type { Chain } from './types';\n`;

  // Project Imports & Record Setup:
  for(let i = 0; i < chains.length; i++) {
    const chain = chains[i];
    contents += `\n// ${chain.toUpperCase()} Project Imports:\n`;
    recordContents += `\t${chain}: {\n`;

    // Project Setups:
    for(const project of projects[i]) {
      contents += `import * as ${chain}_${project} from './projects/${chain}/${project}';\n`;
      recordContents += `\t\t${project}: ${chain}_${project},\n`;
    }
    recordContents += `\t},\n`;
  }

  // Appending Projects Record:
  contents += `\n// Projects Record:\nconst projects: Record<Chain, Record<string, any>> = {\n${recordContents}}\n\nexport default projects;\n`;

  // Writing File:
  fs.writeFileSync('src/project-lib.ts', contents, { encoding: 'utf-8' });
}

/* ========================================================================================================================================================================= */

// Auto-Generating 'src/projects.ts':
const writeProjects = () => {

  // Initializations:
  let contents = '';

  // Warning Message:
  contents += warningMessage;

  // Chain Type Import:
  contents += `// Type Imports:\nimport type { Chain } from './types';\n`;

  // Project Record:
  contents += `\n// Projects List:\nexport const projects: Record<Chain, string[]> = {\n`
  for(let i = 0; i < chains.length; i++) {
    const chain = chains[i];
    contents += `\t${chain}: [\n`;

    // Adding Projects:
    for(const project of projects[i]) {
      contents += `\t\t'${project}',\n`;
    }
    contents += `\t],\n`;
  }
  contents += `}\n`;

  // Writing File:
  fs.writeFileSync('src/projects.ts', contents, { encoding: 'utf-8' });
}

/* ========================================================================================================================================================================= */

// Auto-Generating Project Files:
writeProjectLib();
writeProjects();