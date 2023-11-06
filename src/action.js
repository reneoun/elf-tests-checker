const core = require("@actions/core");
const github = require("@actions/github");
const { context } = require("@actions/github");
const parser = require("node-html-parser");
const fs = require("fs/promises");

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

const getRelevantValues = (doc) => {
  let output = {};

  let coverageInfo = doc.querySelectorAll("div.fl.pad1y.space-right2");
  for (const infoItem of coverageInfo) {
    const infoName = infoItem.querySelector("span.quiet").innerText;
    const infoValuePct =
      Number(infoItem.querySelector("span.strong").innerText.replace("%", "")) /
      100;
    const infoFraction = infoItem.querySelector("span.fraction").innerText;
    const infoCovered = infoFraction.split("/")[0];
    const infoTotal = infoFraction.split("/")[1];
    output[infoName] = {
      valuePct: infoValuePct,
      covered: infoCovered,
      total: infoTotal,
    };
  }

  return output;
};

const createTable = (covMap) => {
  let table = [];
  let tableHeader = [];
  let tableBody = [];

  const containsHeader = (header) => {
    return tableHeader.map((h) => h.data).includes(header);
  };

  for (const [key, value] of covMap.entries()) {
    for (const [key2, value2] of Object.entries(value)) {
      let newRow = [];
      const coverageContext = `${key} - ${key2}`;
      if (!containsHeader("Coverage Context")) {
        tableHeader.push({ data: "Coverage Context", header: true });
      }
      newRow.push(coverageContext);
      for (const [key3, value3] of Object.entries(value2)) {
        if (!containsHeader(key3)) {
          tableHeader.push({ data: key3, header: true });
        }
        newRow.push(String(value3));
      }
      tableBody.push(newRow);
    }
  }

  table.push(Array.from(new Set(tableHeader)));
  table.push(tableBody);

  return table;
};

const run = async () => {
  const coverageMap = new Map();
  // const githubToken = core.getInput("GITHUB_TOKEN");
  // const octokit = github.getOctokit(githubToken);

  let inputCoverageMain = core.getInput("coverage-main") ?? null;
  let inputCoverageBranch = core.getInput("coverage-branch") ?? null;

  //FOR TESTING
  // let inputCoverageMain;
  // inputCoverageMain = await fs.readFile("src/main-test-coverage.html", {
  //   encoding: "utf8",
  // });

  // let inputCoverageBranch;
  // inputCoverageBranch = await fs.readFile("src/pr-test-coverage.html", {
  //   encoding: "utf8",
  // });

  console.log("Main", inputCoverageMain);
  console.log("Branch", inputCoverageBranch);

  if (inputCoverageMain === null || inputCoverageBranch === null) {
    core.notice(`No coverage files found. Exiting. ${getEmoji("neutral")}`);
    // console.log(`No coverage files found. Exiting. ${getEmoji("neutral")}`);
    return 0;
  }

  let covMainDoc = parser.parse(inputCoverageMain);
  let covBranchDoc = parser.parse(inputCoverageBranch);

  try {
    coverageMap.set("main", getRelevantValues(covMainDoc));
    coverageMap.set("branch", getRelevantValues(covBranchDoc));

    console.log("MAIN", coverageMap.get("main"));
    console.log("BRANCH", coverageMap.get("branch"));

    let sumTable = createTable(coverageMap);
    console.log("SUMTABLE", sumTable);

    await core.summary
      .addHeading("Coverage Report :test_tube:")
      .addTable(sumTable)
      .write();
  } catch (error) {
    console.log(`Error[${getEmoji("sad")}]: ${error}`);
  }
};

run();
