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

  // console.log("Pull Request: ", pull_request);
  console.log(" Owner: ", owner, " Repo: ", repo, " Branch: ", branchName);
  console.log(
    " Git Diff",
    core.getInput("CODE_DIFF").replace(/'/g, "").split(" ")
  );

  exec("git diff --name-only master", (err, stdout, stderr) => {
    if (err) {
      console.log("Error: ", err);
      return;
    }
    console.log("stdout: ", stdout);
    console.log("stderr: ", stderr);
  });

  try {
    const newPRComment = await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: pull_request.number,
      body: "Hello World!",
    });
  } catch (error) {
    console.log("Error: ", error);
  }

  console.log("Hello World23!");
};

run();
