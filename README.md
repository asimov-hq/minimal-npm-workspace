# minimal-npm-workspace
## highlights
* minimal, clean setup for server, web, cli and shared packages
* vite for the frontend (it is best by test)
* almost no external dependencies apart from vite 
* blazing fast startup time in dev mode
* blazing fast build time 

## possible applications
* **scaffold for your coding agents**
* scaffold for you 100% hand typed artisan organic ts project ;)
* learn about npm workspaces (that was my motivation in creating this)

## example usage
```shellsession
me@alpaca minimal-npm-workspace % ./scripts/copy-minimal-sample.sh ../my-awesome-new-project
Copied files:
  - .gitignore
  - tsconfig.base.json
  - package.json
  - packages/web/index.html
  - packages/web/dist-types/src/main.d.ts.map
  - packages/web/dist-types/src/main.d.ts
  - packages/web/tsconfig.dev.json
  - packages/web/tsconfig.eslint.json
  - packages/web/package.json
  - packages/web/tsconfig.build.json
  - packages/web/tsconfig.json
  - packages/web/vite.config.ts
  - packages/web/.tsbuildinfo
  - packages/web/src/main.ts
  - packages/server/tsconfig.dev.json
  - packages/server/tsconfig.eslint.json
  - packages/server/package.json
  - packages/server/tsconfig.build.json
  - packages/server/tsconfig.json
  - packages/server/src/main.ts
  - packages/shared/tsconfig.dev.json
  - packages/shared/tsconfig.eslint.json
  - packages/shared/package.json
  - packages/shared/tsconfig.json
  - packages/shared/src/index.ts
  - packages/cli/bin/my-app.js
  - packages/cli/tsconfig.dev.json
  - packages/cli/tsconfig.eslint.json
  - packages/cli/package.json
  - packages/cli/tsconfig.build.json
  - packages/cli/tsconfig.json
  - packages/cli/src/main.ts
me@alpaca minimal-npm-workspace % cd ../my-awesome-new-project
me@alpaca my-awesome-new-project % pi
me@alpaca my-awesome-new-project % codex
me@alpaca my-awesome-new-project % claude
me@alpaca my-awesome-new-project % gemini
```




