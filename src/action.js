const core = require("@actions/core");
const github = require("@actions/github");

const run = async () => {
  const githubToken = core.getInput("GITHUB_TOKEN");
  console.log("Github Token: ", githubToken);

  const octokit = github.getOctokit(githubToken);

  const { context } = github;
  console.log("Context: ", context);

  const { pull_request: pullRequest } = context.payload;
  console.log("Pull Request: ", pullRequest);
  console.log(" Octokit: ", octokit);

  await octokit.issues?.createComment({
    ...context.repo,
    issue_number: pullRequest.number,
    body: "Hello World!",
  });

  console.log("Hello World2!");
};
run();
