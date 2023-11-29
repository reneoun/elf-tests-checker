const core = require("@actions/core");
const github = require("@actions/github");
const parser = require("node-html-parser");
const fs = require("fs");

const sad_emoticons = ["😭", "😢", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣"];
const neutral_emoticons = ["😐", "😑", "😶", "🙄", "😒", "🤐", "😬"];
const happy_emoticons = ["😀", "😃", "😄", "😁", "😆", "😊", "😇", "🙂", "🙃"];
const categoryDetails = new Map([
  [
    "Statements",
    [
      0,
      "This metric simply tells you the ratio of statements in an application that are currently under testing (Depending on the programming language, a statement can span multiple lines and a single line could contain multiple statements).",
    ],
  ],
  [
    "Branches",
    [
      0,
      "Branch coverage, as we’ve seen, is about whether all branches—or paths of execution—in an application are under test (Conditional statements, such as if and switch statements, create branches).",
    ],
  ],
  [
    "Functions",
    [50, "This metric tells you the ratio of functions that are under test."],
  ],
  [
    "Lines",
    [
      0,
      "This metric tells you the ratio of lines of code that are under test.",
    ],
  ],
]);

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
    case "success":
      emoji = "✅";
      break;
    case "fail":
      emoji = "❌";
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

const calculateDiff = (covMap) => {
  let totalDiff = {};
  const mainValues = covMap.get("main");
  const branchValues = covMap.get("branch");
  for (const [key, value] of Object.entries(mainValues)) {
    let tmpDiff = {};
    for (const [key2, value2] of Object.entries(value)) {
      tmpDiff[key2] =
        key2 == "valuePct"
          ? branchValues[key][key2] - value2
          : (branchValues[key][key2] - value2).toFixed(0);
    }
    totalDiff[key] = tmpDiff;
  }
  covMap.set("difference", totalDiff);
};

const createDiffTables = (covMap) => {
  let tables = [];

  calculateDiff(covMap);

  //TODO: Add Total
  const covMapKeys = Array.from(covMap.keys()); //main, branch, difference
  const objCovKeys = Object.keys(covMap.get(covMapKeys[0])); //statements, branches, functions, lines
  const objCovKeys2 = Object.keys(covMap.get(covMapKeys[0])[objCovKeys[0]]); //valuePct, covered, total

  for (const covName of objCovKeys) {
    let tmpHeader = [{ data: covName, header: true }];
    tmpHeader.push(...objCovKeys2.map((k) => ({ data: k, header: true })));
    let tmpBody = [];
    for (const branchName of covMapKeys) {
      let tmpBodyRow = [];
      tmpBodyRow.push(branchName);
      for (const covValue of objCovKeys2) {
        let value = covMap.get(branchName)[covName][covValue];
        value =
          typeof value === "number" ? String(value.toFixed(2)) ?? "0" : value;
        tmpBodyRow.push(value);
      }
      tmpBody.push(tmpBodyRow);
    }
    tables.push([tmpHeader, ...tmpBody]);
  }

  return tables;
};

const run = async () => {
  const coverageMap = new Map();
  const githubToken = core.getInput("GITHUB_TOKEN");
  const octokit = github.getOctokit(githubToken);

  let branchCoveragePath = core.getInput("coverage-path");
  let mainCoveragePath = core.getInput("main-coverage-path");

  const branchCoverageFile = fs.readFileSync(branchCoveragePath, "utf8");
  const mainCoverageFile = fs.readFileSync(mainCoveragePath, "utf8");

  // console.log("1📃", branchCoverageFile);
  // console.log("2📃", mainCoverageFile);

  // Get the owner, repo, and commit SHA from the context
  const { owner, repo } = github.context.repo;
  const commitSha = github.context.sha;

  // Fetch commit data
  const { data: commitData } = await octokit.rest.repos.getCommit({
    owner,
    repo,
    ref: commitSha,
  });

  // Extract changed filenames
  const changedFiles = commitData.files.map((file) => file.filename);
  const tsFiles = changedFiles.filter(
    (file) => file.endsWith(".ts") && !file.endsWith(".spec.ts")
  );
  const tsTestFiles = changedFiles.filter((file) => file.endsWith(".spec.ts"));

  console.log("Changed TS Files📂:", tsFiles);
  console.log("Changed TS Spec Files📂:", tsTestFiles);

  if (mainCoveragePath === null || branchCoverageFile === null) {
    core.notice(`No coverage files found. Exiting. ${getEmoji("neutral")}`);
    return 0;
  }

  let covMainDoc = parser.parse(mainCoverageFile);
  let covBranchDoc = parser.parse(branchCoverageFile);

  console.log("covMainDoc📃:", covMainDoc);
  console.log("covBranchDoc📃:", covBranchDoc);

  try {
    coverageMap.set("main", getRelevantValues(covMainDoc));
    coverageMap.set("branch", getRelevantValues(covBranchDoc));

    console.log("coverageMap📃:", coverageMap);

    let sumTable = createDiffTables(coverageMap);

    let summary = core.summary.addHeading("Coverage Report :test_tube:");
    let coverageResults = [];
    for (const table of sumTable) {
      let category = table[0][0].data;

      let lastRow = table[table.length - 1];
      let lastColRow = lastRow[lastRow.length - 1]; // Total
      let secondLastColRow = lastRow[lastRow.length - 2]; // Covered
      let coveredPct = isNaN(
        (Number(secondLastColRow) / Number(lastColRow)) * 100
      )
        ? 0
        : (Number(secondLastColRow) / Number(lastColRow)) * 100;
      let coveredPctStr = String(coveredPct.toFixed(2)) + "%";
      const categoryPctTarget = categoryDetails.get(category)[0];
      let hasFailed =
        coveredPct < categoryPctTarget &&
        ["Functions"].includes(category) &&
        lastColRow > 1;

      coverageResults.push(!hasFailed);

      let prCoverageResultEmoji = hasFailed
        ? getEmoji("fail")
        : getEmoji("success");

      let textDetails = `PR Coverage ${category}: ${coveredPctStr} ${prCoverageResultEmoji} (Target: ${categoryPctTarget}%${
        category === "Functions" ? " *For 2 or more new Functions" : ""
      })`;
      summary.addDetails(textDetails, `${categoryDetails.get(category)[1]}`);
      if (hasFailed && category === "Functions" && lastColRow > 1) {
        let failText = `<blockquote>⚠️ Your Coverage Check failed because you have <b>${lastColRow}</b> new functions and you should have atleast <b>${(
          lastColRow / 2
        ).toFixed(
          0
        )}</b> new Tests and you got <b>${secondLastColRow}</b>!</blockquote>`;
        summary.addRaw(failText);
      }
      summary.addTable(table);
    }
    summary.write();

    const testCoverageAnalysisSuccess = coverageResults.every(
      (result) => result === true
    );
    return testCoverageAnalysisSuccess ? 0 : 1;
  } catch (error) {
    console.log(`Error[${getEmoji("sad")}]: ${error}`);
  }
};

run().then((exitCode) => {
  core.setOutput("exit-code", exitCode);
});
