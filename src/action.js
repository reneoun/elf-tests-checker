const core = require("@actions/core");
const github = require("@actions/github");
const { context } = require("@actions/github");

const run = async () => {
  const githubToken = core.getInput("GITHUB_TOKEN");
  console.log("Github Token: ", githubToken);

  const octokit = github.getOctokit(githubToken);

  const { pull_request } = context.payload;
  console.log("Pull Request: ", pull_request, pull_request?.body);

  await octokit.rest.issues?.createComment({
    ...context.repo,
    issue_number: pull_request.number,
    body: "Hello World!",
  });

  console.log("Hello World2!");
};
run();
