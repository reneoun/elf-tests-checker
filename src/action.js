const core = require("@actions/core");
const github = require("@actions/github");
const { context } = require("@actions/github");
const parser = require("node-html-parser");

const sad_emoticons = ["😭", "😢", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣"];
const neutral_emoticons = ["😐", "😑", "😶", "🙄", "😒", "🤐", "😬"];
const happy_emoticons = ["😀", "😃", "😄", "😁", "😆", "😊", "😇", "🙂", "🙃"];

const getEmoji = (kindEmo) => {
  let emoji = "";
  switch (kindEmo) {
    case "sad":
      emoji = sad_emoticons[Math.floor(Math.random() * sad_emoticons.length)];
      break;
    case "neutral":
      emoji =
        neutral_emoticons[Math.floor(Math.random() * neutral_emoticons.length)];
      break;
    default:
      emoji =
        happy_emoticons[Math.floor(Math.random() * happy_emoticons.length)];
      break;
  }
  return emoji;
};

const run = async () => {
  const githubToken = core.getInput("GITHUB_TOKEN");
  const octokit = github.getOctokit(githubToken);

  let inputCoverageMain = core.getInput("coverage-main") ?? null;
  let inputCoverageBranch = core.getInput("coverage-branch") ?? null;

  if (inputCoverageMain === null || inputCoverageBranch === null) {
    core.notice(`No coverage files found. Exiting. ${getEmoji("neutral")}`);
    return 0;
  }

  let covMainDoc = parser.parse(inputCoverageMain);
  let covBranchDoc = parser.parse(inputCoverageBranch);

  console.log("Main", covMainDoc);
  console.log("Branch", covBranchDoc);

  const { owner, repo } = context.repo;
  const { pull_request } = context.payload;

  core.summary.addHeading("Coverage Report ☑️📃").write();

  try {
    console.log("Main as Doc", covMainDoc);
    console.log("Branch as Doc", covBranchDoc);
  } catch (error) {
    console.log(`Error[${getEmoji("sad")}]: ${error}`);
  }
};

run();
