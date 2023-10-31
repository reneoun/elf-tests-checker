const core = require("@actions/core");
const github = require("@actions/github");
const { context } = require("@actions/github");
const { exec } = require("child_process");
const fs = require("fs");

const run = async () => {
  const githubToken = core.getInput("GITHUB_TOKEN");
  const octokit = github.getOctokit(githubToken);

  const { owner, repo } = context.repo;
  const { pull_request } = context.payload;
  const branchName = pull_request.head.ref;

  let resultInComment = "";

  // console.log("Pull Request: ", pull_request);
  // console.log(" Owner: ", owner, " Repo: ", repo, " Branch: ", branchName);
  const changedFiles = core.getInput("CODE_DIFF").replace(/'/g, "").split(" ");
  console.log(" Git Diff", changedFiles);

  for (const changedFile of changedFiles) {
    resultInComment += `## ${changedFile} \n`;

    try {
      const gitCMDModifiedLines = exec(
        `git diff origin/${github.base_ref}..${github.sha}`
      );
      let modifiedLines = [];
      gitCMDModifiedLines.stdout.on("data", (data) => {
        modifiedLines = data.split("\n");
      });
      console.log("Modified Lines: ", modifiedLines);
    } catch (error) {
      console.log("Error in " + changedFile + ": ", error);
    }
  }

  try {
    const newPRComment = await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: pull_request.number,
      body: resultInComment,
    });
  } catch (error) {
    console.log("Error: ", error);
  }

  console.log("Hello World23!");
};

run();
