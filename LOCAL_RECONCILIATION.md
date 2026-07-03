# Local Reconciliation

This workspace now treats the classic app plus the 2D campus as the active
runtime.

## Current Source Of Truth

- App root: `app/`
- Online runtime: `app/src/features/campus-2d/`
- Public assets: `app/assets/campus-2d/`
- Public artifact script: `tools/deployment/prepare-github-pages.mjs`

The previous separate campus runtime has been removed. Do not restore old local
build outputs, generated artifacts, or archived experiments unless a future task
names one file explicitly.

## Import Rule

Local-only material may be imported only when it is referenced by an active
runtime, validator, deployment script, package script, or a specific feature
plan. Generated outputs and cache folders are not source of truth.
