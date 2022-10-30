# Pull Request Labeler

Automatically labels new pull requests based on the Unreleased file entry.

## Usage

### Create Workflow

Create a workflow (eg: `.github/workflows/changelog-labeler.yml`) with content:

```yml
name: "Pull Request Labeler"
on:
  pull_request:
    types: ["opened", "reopened", "converted_to_draft", "ready_for_review"]
jobs:
  triage:
    runs-on: ubuntu-latest
    steps:
      - uses: vinted/changelog-labeler-action@v2.0.0
```

#### Inputs

Inputs are defined in `action.yml` to let you configure the labeler:

| Name                 | Description                                                                                                    | Default                      |
| -------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| `repo-token`         | The GITHUB_TOKEN secret                                                                                        | N/A                          |
| `base-branch`        | The base branch for your repo                                                                                  | `'master'`                   |
| `configuration-path` | The Changelog path for the label configuration                                                                 | `'Changelogs/Unreleased.md'` |
| `section-symbol`     | The symbols (header) which indicate a new section in Changelog                                                 | `'###'`                      |
| `label-for-umbrella` | The label for umbrella branches                                                                                | `'Umbrella'`                 |
| `label-for-release`  | The label for merging into release branch. If you don't want to add labels for this, pass an empty string `''` | `'Bug'`                      |
| `label-for-draft`    | The label for draft PR                                                                                         | `'Work in progress'`         |

#### Setting up project locally

`npm install @actions/core --save`

`npm install @actions/github --save`

`npm i -g @vercel/ncc`

After you edit the `labeler.js` file, you need to package it:
`npx ncc build src/labeler.js -o dist`

#### Testing changes

There is a testing workflow `.github/workflows/test-action.yml` in this repository, which allows to test the changes by creating a PR.
