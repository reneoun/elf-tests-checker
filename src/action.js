const core = require("@actions/core");
const github = require("@actions/github");
const { context } = require("@actions/github");
const fs = require("fs");

const run = async () => {
  const githubToken = core.getInput("GITHUB_TOKEN");
  const octokit = github.getOctokit(githubToken);

  const { owner, repo } = context.repo;
  const { pull_request } = context.payload;

  console.log("Pull Request: ", pull_request);
  console.log(" Owner: ", owner, " Repo: ", repo);
  console.log(" Git Diff", core.getInput("CODE_DIFF"));

  try {
    await octokit.request(
      `POST /repos/${owner}/${repo}/issues/${pull_request.number}/comments`,
      {
        owner: owner,
        repo: repo,
        issue_number: pull_request.number,
        body: "loremo ipsum dolor sit amet 2",
        headers: {
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );

    await octokit.rest.issues.create({
      owner: owner,
      repo: repo,
      title: "Hello, world!",
      body: "I created this issue using Octokit!",
    });
  } catch (error) {
    console.log("Error: ", error);
    console.log("number: ", pull_request.number);
    console.log("issue_number: ", pull_request.issue_number);
  }

  console.log("Hello World23!");
};
run();
