const core = require('@actions/core')
const github = require('@actions/github')

async function run() {
    try {
        const token = core.getInput("repo-token");
        const configPath = core.getInput("configuration-path");
        const sectionHeader = core.getInput("section-symbol");
        const baseBranch = core.getInput("base-branch");
        const umbrellaLabel = core.getInput("label-for-umbrella");
        const releaseLabel = core.getInput("label-for-release");
        const draftLabel = core.getInput("label-for-draft");
        const prNumber = github.context.issue.number;
        const ref = github.context.ref;
        const path = configPath.replace(/^(?:\.\.\/)+/, "").replace(/^(?:\.\/)+/, "");

        const octokit = github.getOctokit(token);

        const prInfo = await fetchPrBranch(octokit, prNumber);
        const prBaseBranch = JSON.stringify(prInfo.base.ref).replace(/^"(.*)"$/, '$1');
        const prBranch = JSON.stringify(prInfo.head.ref).replace(/^"(.*)"$/, '$1');
        const isPrDraft = JSON.stringify(prInfo.draft).replace(/^"(.*)"$/, '$1');

        if ((isPrDraft == 'true') || (github.context.payload.action == 'converted_to_draft')) {
            await addLabels(octokit, prNumber, [draftLabel]);
            return;
        } else if (github.context.payload.action == 'ready_for_review') {
            await removeLabels(octokit, prNumber, draftLabel)
        } else if ((prBranch.toLowerCase().includes('umbrella')) && (prBaseBranch == baseBranch)) {
            await addLabels(octokit, prNumber, [umbrellaLabel]);
            return;
        } else if ((releaseLabel.trim() != '') && (prBaseBranch.toLowerCase().includes('release'))) {
            console.log(releaseLabel)
            await addLabels(octokit, prNumber, [releaseLabel]);
            return;
        }

        const diff = await fetchPrDiff(octokit, prNumber);
        const diffString = JSON.stringify(diff);
        const addedString = getAddedLine(diffString, path);

        if (!addedString) {
            console.warn("Could not get added string from diff, exiting.");
            return;
        }

        const file = await fetchFileContent(octokit, path, ref);
        const fileContent = Buffer.from(file.content, 'base64').toString();
        const contentString = JSON.stringify(fileContent);

        const labels = getLabels(contentString, addedString, sectionHeader);
        const currentPrLabels = await getCurrentPrLabels(octokit, prNumber);
        const prHasLabel = prHasNeededLabel(currentPrLabels, labels);

        if (!prHasLabel) {
            await addLabels(octokit, prNumber, labels);
        }
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();

// - Diff

function getAddedLine(diffString, configPath) {
    var diff = diffString;
    var addedLines = [];

    if (diff.includes(configPath)) {
        while (diff.includes(configPath)) {
            diff = diff.split(configPath).pop(); // takes the end after split
        }

        if (diff.includes('diff --git')) {
            diff = diff.split('diff --git')[0]; // takes the front after split
        }

        while (diff.includes('@@')) {
            diff = diff.split('@@').pop(); // takes the end after split
        }

        var addedDiff = diff;

        while (addedDiff.includes('+')) {
            var newLine = addedDiff.split('+').pop().split('\\n')[0];
            addedDiff = addedDiff.replace("+" + newLine, "");
            addedLines.push(newLine);
        }

        return addedLines;
    }
}

// - Labels

function getLabels(contentString, addedString, sectionHeader) {
    var section = "";
    var labels = [];

    addedString.forEach(function(element) {
        if (contentString.includes(element)) {
            section = contentString.split(element)[0]; // takes the front after split

            while (section.includes(sectionHeader)) {
                section = section.split(sectionHeader).pop(); // takes the end after split
            }

            section = section.split('\\n')[0]; // takes the front after split
            section = section.trim();

            if (section == 'New Features') {
                section = 'Feature'
            } else if (section == 'New Features') {
                section = 'Feature removal'
            }

            labels.push(section)
        }
    });

    labels = labels.filter((item, index) => section.indexOf(item) === index);

    return labels;
}

function prHasNeededLabel(currentPrLabels, labels) {
    const currentLabels = currentPrLabels.map(label => label.name);
    const neededLabels = labels.filter((item, index) => labels.indexOf(item) === index);
    const checker = (arr, target) => target.every(v => arr.includes(v));

    return checker(currentLabels, neededLabels);
}

// - API

async function fetchPrDiff(octokit, prNumber) {
    const { data: diff } = await octokit.rest.pulls.get({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        pull_number: prNumber,
        mediaType: {
            format: "diff",
        },
    });

    return diff
}

async function fetchPrBranch(octokit, prNumber) {
    const { data: info } = await octokit.rest.pulls.get({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        pull_number: prNumber,
    });

    return info
}

async function fetchFileContent(octokit, configPath, ref) {
    const { data: file } = await octokit.rest.repos.getContent({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        path: configPath,
        ref: ref
    });

    return file
}

async function getCurrentPrLabels(octokit, prNumber) {
    const { data: currentLabels } = await octokit.rest.issues.listLabelsOnIssue({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        issue_number: prNumber,
    });

    return currentLabels
}

async function addLabels(octokit, prNumber, labels) {
    octokit.rest.issues.addLabels({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        issue_number: prNumber,
        labels: labels,
    });
}

async function removeLabels(octokit, prNumber, label) {
    octokit.rest.issues.removeLabel({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        issue_number: prNumber,
        name: label,
    });
}
