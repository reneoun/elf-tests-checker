const core = require("@actions/core");
const github = require("@actions/github");
const { context } = require("@actions/github");

const sad_emoticons = ["😭", "😢", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣"];
const run = async () => {
  const githubToken = core.getInput("GITHUB_TOKEN");
  const octokit = github.getOctokit(githubToken);

  let inputCoverageMain = core.getInput("coverage-main") ?? null;
  let inputCoverageBranch = core.getInput("coverage-branch") ?? null;

  const { owner, repo } = context.repo;
  const { pull_request } = context.payload;

  try {
    console.log("inputCoverageMain", inputCoverageMain);
    console.log("inputCoverageBranch", inputCoverageBranch);

    const listArtifactsResponse =
      await octokit.rest.actions.listWorkflowRunArtifacts({
        owner,
        repo,
        run_id: pull_request.head.sha,
      });
    console.log("listArtifactsResponse", listArtifactsResponse);
  } catch (error) {
    const sad_emoticon =
      sad_emoticons[Math.floor(Math.random() * sad_emoticons.length)];
    console.log(`Error[${sad_emoticon}]: ${error}`);
  }
};

run();
