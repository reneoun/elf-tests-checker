const core = require("@actions/core");
const github = require("@actions/github");
const { context } = require("@actions/github");
const { exec } = require("child_process");

function extractFunctions(tsCode) {
  const functionRegex =
    /(public|private|protected)?\s+(static)?\s*(\w+)\s*\([^]*?\)\s*:?[^]*?{/g;
  const functions = [];
  let match;

  while ((match = functionRegex.exec(tsCode)) !== null) {
    functions.push(match[0]);
  }

  return functions;
}

const newLines = async (fileName) => {
  const gitCMD = exec(` git diff origin/main -- ${fileName}`);
  return new Promise((resolve, reject) => {
    gitCMD.stdout.on("data", (data) => {
      if (data.trim() === "") resolve([]);
      resolve(
        data
          .split("\n")
          .filter(
            (newCode) =>
              newCode.trim().startsWith("+") &&
              !newCode.trim().startsWith("+++")
          )
          .map((line) => line.replace("+", ""))
      );
    });
  });
};

const run = async () => {
  const githubToken = core.getInput("GITHUB_TOKEN");
  const octokit = github.getOctokit(githubToken);

  const { owner, repo } = context.repo;
  const { pull_request } = context.payload;

  let resultInComment = "";

  const changedFiles = core.getInput("CODE_DIFF").replace(/'/g, "").split(" ");
  const relevantChangedFiles = changedFiles.filter(
    (file) => file.endsWith(".js") || file.endsWith(".ts")
  );
  console.log(" Git Diff", changedFiles);

  for (const changedFile of relevantChangedFiles) {
    resultInComment += `- *File:* ${changedFile} \n`;

    try {
      let lines = await newLines(changedFile);
      let tsCode = lines.join("\n");
      const functions = extractFunctions(tsCode);
      resultInComment += `- ${functions.length} New Function(s)⚒️\n`;
      functions.forEach((func) => {
        resultInComment += `    - ${func.replace("\n", "")}\n`;
      });
      console.log(`Functions in ${changedFile}: `, functions);
    } catch (error) {
      console.log("Error in " + changedFile + ": ", error);
    }
  }

  try {
    //TODO: Add a check to see if the comment already exists
    const newPRComment = await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: pull_request.number,
      body: resultInComment,
    });
  } catch (error) {
    console.log("Error: ", error);
  }
};

run();
