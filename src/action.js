const core = require("@actions/core");
const github = require("@actions/github");
const { context } = require("@actions/github");

const run = async () => {
  const githubToken = core.getInput("GITHUB_TOKEN");
  const octokit = github.getOctokit(githubToken);

  const { owner, repo } = context.repo;
  const { pull_request } = context.payload;
  console.log("Pull Request: ", pull_request?.issue_number);
  console.log(" Owner: ", owner, " Repo: ", repo);

  try {
    await octokit.rest.issues?.createComment({
      ...context.repo,
      issue_number: pull_request.number,
      body: "Hello World!",
    });
  } catch (error) {
    console.log("Error: ", error);
    console.log("number: ", pull_request.number);
    console.log("issue_number: ", pull_request.issue_number);
  }

  console.log("Hello World2!");
};
run();
