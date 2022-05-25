const fs = require('fs');

// Get chains from directories in 'src/projects':
const chains = fs.readdirSync("src/projects").filter(dir => fs.statSync(`src/projects/${dir}`).isDirectory());

// Get projects from each chain:
const projects = chains.map(chain => 
  fs.readdirSync(`src/projects/${chain}`)
    .filter(file => file.endsWith(".ts"))
    .map(file => file.slice(0, file.length - 3))
);

// Writes to 'src/project-lib.ts':
function writeProjectLib() {

  // Add warning message:
  let contents = `/* [HEED MY WARNING FELLOW DEV!] This file was auto-generated during build by '/pre-build/projects.js'. Any changes to this file directly will not persist after building. [FARE THEE WELL] */\n`;

  // Add Chain import:
  contents += `// Type Imports:\nimport type { Chain } from './types';\n`;

  // Add imports and concat to recordContents:
  let recordContents = "";
  for(let i = 0; i < chains.length; i++) {
    const chain = chains[i];

    // Add comment to show which chain we are importing:
    contents += `\n// [${chain}] project imports:\n`;

    // Add chain entry to record:
    recordContents += `\t${chain}: {\n`;

    // Loop through projects:
    for(const project of projects[i]) {

      // Add import for project file:
      contents += `import * as ${chain}_${project} from "./projects/${chain}/${project}";\n`;

      // Add project to chain records:
      recordContents += `\t\t${project}: ${chain}_${project},\n`;
    }

    // Add closing bracket to chain entries:
    recordContents += `\t},\n`;
  }

  // Add record of chains and projects;
  contents += `\nconst projects: Record<Chain, Record<string, any>> = {\n${recordContents}};\nexport default projects;\n`;

  // Write contents to target file:
  fs.writeFileSync("src/project-lib.ts", contents, { encoding: 'utf-8' });
}

// Writes to 'src/projects.ts':
function writeProjects() {
  // Add warning message:
  let contents = `/* [HEED MY WARNING FELLOW DEV!] This file was auto-generated during build by '/pre-build/projects.js'. Any changes to this file directly will not persist after building. [FARE THEE WELL] */\n\n`;

  // Add Chain import:
  contents += `// Type Imports:\nimport type { Chain } from './types';\n`;

  // Add record of chains and projects;
  contents += `\nexport const projects: Record<Chain, string[]> = {\n`
  for(let i = 0; i < chains.length; i++) {
    const chain = chains[i];

    // Add chain entry to record:
    contents += `\t${chain}: [\n`;

    // Loop through projects:
    for(const project of projects[i]) {

      // Add project to chain records:
      contents += `\t\t'${project}',\n`;
    }

    // Add closing bracket to chain entries:
    contents += `\t],\n`;
  }

  // Add closing bracket to record:
  contents += `};\n`;

  // Write contents to target file:
  fs.writeFileSync("src/projects.ts", contents, { encoding: 'utf-8' });
}

writeProjectLib();
writeProjects();