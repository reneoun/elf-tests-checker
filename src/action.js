const core = require("@actions/core");
const github = require("@actions/github");

const run = async () => {
  const githubToken = core.getInput("GITHUB_TOKEN");
  console.log("Github Token: ", githubToken);

  const octokit = github.getOctokit(githubToken);

  const { context } = github;

  const { pull_request: pullRequest } = context.payload;
  console.log("Pull Request: ", pull_request.body);

  await octokit.rest.issues?.createComment({
    ...context.repo,
    issue_number: pullRequest.number,
    body: "Hello World!",
  });

  console.log("Hello World2!");
};
run();
