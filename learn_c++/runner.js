const { exec } = require("node:child_process");
const { readFileSync } = require("node:fs");

// Get the filename from command line arguments
const filename = process.argv[2];

if (!filename) {
  console.error("Please provide a C++ filename as an argument");
  process.exit(1);
}

// Remove .cpp extension if present to get the output filename
const outputName = filename.replace(/\.cpp$/, '');

// Compile the C++ file
exec(`g++ ${filename} -o ${outputName}`, (compileError, compileStdout, compileStderr) => {
  if (compileError) {
    console.error(`Compilation error: ${compileError.message}`);
    return;
  }
  if (compileStderr) {
    console.error(`Compilation warnings: ${compileStderr}`);
  }
  
  // Run the compiled program
  exec(`./${outputName}`, (runError, runStdout, runStderr) => {
    if (runError) {
      console.error(`Runtime error: ${runError.message}`);
      return;
    }
    if (runStderr) {
      console.error(`Runtime error: ${runStderr}`);
    }
    console.log(runStdout);
  });
  exec(`rm ./${outputName}`, (runError, runStdout, runStderr) => {
    if (runError) {
      console.error(`Runtime error: ${runError.message}`);
      return;
    }
    if (runStderr) {
      console.error(`Runtime error: ${runStderr}`);
    }
    console.log(runStdout);
  });
});