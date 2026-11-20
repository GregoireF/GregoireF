# Security

This repository builds my GitHub profile. It doesn't ship software, but it does run code when someone opens an issue (see [how it works](docs/how-it-works.md#the-run-it-here-part)), so I take reports seriously.

How the workflows are set up:

- Every action is pinned to a full commit SHA and kept current by Dependabot.
- Workflows start with no permissions and each job asks only for what it needs.
- Visitor input never reaches a shell. Commands come from an allowlist, and the job that runs them has a read-only token and no secrets.
- actionlint, zizmor and OpenSSF Scorecard run on every change.

If you find a problem, please don't open a public issue. Use [private vulnerability reporting](https://github.com/GregoireF/GregoireF/security/advisories/new) or email [gregoire.favreau@ik.me](mailto:gregoire.favreau@ik.me). I'll answer within a few days.
