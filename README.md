# Pull Request Labeler

Automatically labels new pull requests based on the Unreleased file entry.

## Usage

### Create Workflow

Create a workflow (eg: `.github/workflows/changelog-labeler.yml`) with content:

```yml
name: "Pull Request Labeler"
on: pull_request
jobs:
  triage:
    runs-on: ubuntu-latest
    steps:
      - uses: vinted/changelog-labeler-action@v1.0.0
```

#### Inputs

Inputs are defined in `action.yml` to let you configure the labeler:

| Name                 | Description                                                    | Default                    |
| -------------------- | -------------------------------------------------------------- | -------------------------- |
| `repo-token`         | The GITHUB_TOKEN secret                                        | N/A                        |
| `configuration-path` | The Changelog path for the label configuration                 | `Changelogs/Unreleased.md` |
| `section-symbol`     | The symbols (header) which indicate a new section in Changelog | `###`                      |

#### Setting up project locally

`npm install @actions/core --save`
`npm install @actions/github --save`
`npm i -g @vercel/ncc`

After you edit the `labeler.js` file, you need to package it:
`npx ncc build src/labeler.js -o dist`
