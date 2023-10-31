const core = require("@actions/core");
const github = require("@actions/github");
const { context } = require("@actions/github");

const run = async () => {
  const githubToken = core.getInput("GITHUB_TOKEN");
  const octokit = github.getOctokit(githubToken);

  const { owner, repo } = context;
  const { pull_request } = context.payload;
  // console.log("Pull Request: ", pull_request, pull_request?.body);
  console.log("Pull Request: ", pull_request?.issue_number);
  console.log(" Owner: ", owner, " Repo: ", repo);

  await octokit.request(
    `POST /repos/${owner}/${repo}/issues/${pull_request.issue_number}/comments`,
    {
      owner: owner,
      repo: repo,
      issue_number: pull_request.issue_number,
      body: "Me too",
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  await octokit.rest.issues?.createComment({
    ...context.repo,
    issue_number: pull_request.number,
    body: "Hello World!",
  });

  console.log("Hello World2!");
};
run();
