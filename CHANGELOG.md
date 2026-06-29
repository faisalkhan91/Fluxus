# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.2.1](https://github.com/faisalkhan91/Fluxus/compare/v4.2.0...v4.2.1) (2026-06-29)


### Bug Fixes

* **a11y:** deepen solarized-light accent to clear WCAG AA on the primary CTA ([7d3d2df](https://github.com/faisalkhan91/Fluxus/commit/7d3d2df7ffd5503ceec10b0a5a6e27e76df0e76c))
* **ci:** give each Lighthouse pass a distinct artifact name ([e846cf8](https://github.com/faisalkhan91/Fluxus/commit/e846cf831b963ad49900820d9cbc9a3e9b28d0b6))
* **docker:** pin builder to node:24.17-alpine (&gt;= Angular CLI's 24.15.0 floor) ([ef108c2](https://github.com/faisalkhan91/Fluxus/commit/ef108c2b331eaaa051b01fce92174225e258a085))


### Performance

* **lighthouse:** test canonical trailing-slash URLs to drop a lab redirect ([d0d4cdb](https://github.com/faisalkhan91/Fluxus/commit/d0d4cdbf76bd3dee9e8bc921ce71908b6e6b516a))

## [4.2.0](https://github.com/faisalkhan91/Fluxus/compare/v4.1.0...v4.2.0) (2026-06-28)


### Features

* add terminal mode and keyboard-shortcuts overlay ([9fc8933](https://github.com/faisalkhan91/Fluxus/commit/9fc8933559cbf29e978dd7a0a120a96d177ffb4c))
* **blog:** add four new posts ([88ed244](https://github.com/faisalkhan91/Fluxus/commit/88ed244174af58ab622706d418611c569c1ba800))
* **contact:** disclose cookieless analytics + no-storage handling ([0c22e70](https://github.com/faisalkhan91/Fluxus/commit/0c22e70803b0064c9e0f54292043ddd2b9af1acd))
* **projects:** add BulletinView ([28ea0cd](https://github.com/faisalkhan91/Fluxus/commit/28ea0cda78432acf4b74966ec524416b9fbb623a))
* **resume:** add UNH + intern roles; fix header divider spacing ([1426baa](https://github.com/faisalkhan91/Fluxus/commit/1426baae0326147dbd79de093839c8ea053036a0))
* **themes:** push the muted↔body fade to a dramatic ~1.5x across all themes ([c89d6f3](https://github.com/faisalkhan91/Fluxus/commit/c89d6f39278ff72c5f23f76312fff4925416cfc3))
* **themes:** recover WCAG AA via surface darkening, preserving the faded text hierarchy ([9fc3110](https://github.com/faisalkhan91/Fluxus/commit/9fc31101a3d3e8bdad7470e8cc6fde0cdc7859b0))


### Bug Fixes

* **a11y:** announce toasts via a persistent host live region ([f97b416](https://github.com/faisalkhan91/Fluxus/commit/f97b4169cdaa03f04af79f12c1b6a46f90af4df9))
* **a11y:** clear WCAG AA contrast across all themes; enforce axe per-theme ([066e106](https://github.com/faisalkhan91/Fluxus/commit/066e1069a29317e285a4c003cf0178f48df64cd0))
* **a11y:** enforce WCAG AA color-contrast; fix accent-text + light syntax colors ([c7eccbf](https://github.com/faisalkhan91/Fluxus/commit/c7eccbf1637b878db6e323dec5faeb8da7fdc40e))
* **a11y:** format project-detail related dates + hide post TOC when printing ([26ebf11](https://github.com/faisalkhan91/Fluxus/commit/26ebf119e8bf717fe2ead1cfb21acc424d21f03c))
* **a11y:** give ui-source-link a 24px tap target (WCAG 2.2 SC 2.5.8) ([ec85060](https://github.com/faisalkhan91/Fluxus/commit/ec85060e0e2ba4835e947bfc4fb73fc1c3d5844a))
* **a11y:** meet WCAG AA contrast on the shortcuts overlay group titles ([e172a90](https://github.com/faisalkhan91/Fluxus/commit/e172a90df7265148796c68e256c1586c80e82ddb))
* **blog:** align current-page item in post breadcrumb ([247d298](https://github.com/faisalkhan91/Fluxus/commit/247d2986050b91c4974fbfd6ed3af8304d72130e))
* **blog:** register python/sql/http highlighting + surface silent failures in dev ([05a0ac1](https://github.com/faisalkhan91/Fluxus/commit/05a0ac1fc88a86379d7f4f80b79882e04a6e5440))
* **blog:** validate slug shape before building the post-fetch URL ([8906933](https://github.com/faisalkhan91/Fluxus/commit/8906933cb3e712fc86499f09de90f7d730bd0334))
* **certifications:** align card content for a uniform grid ([75d8e9a](https://github.com/faisalkhan91/Fluxus/commit/75d8e9a30bb112a6412edfc42d0515a9811d36f6))
* **ci:** harden GHCR retention, roll GitOps PRs, document release-trigger coupling ([1d92431](https://github.com/faisalkhan91/Fluxus/commit/1d92431071a2fd1d57b87f8ea37f0fc18d24b1d3))
* **core:** make app initializers non-fatal during bootstrap ([2ece722](https://github.com/faisalkhan91/Fluxus/commit/2ece7220bd65f829650235fe08f1e6968dc0ac1d))
* **csp:** fail the build when the generated CSP exceeds NGINX's header limit ([d7efec7](https://github.com/faisalkhan91/Fluxus/commit/d7efec7f0acd697b7f10337a94f4d16c016a1c33))
* **data:** guard posts.json + project entries against malformed data ([83e3450](https://github.com/faisalkhan91/Fluxus/commit/83e3450902bb4719c05f7f56c26123eed54fc478))
* **hero:** point "Explore My Work" CTA to /experience (was /about) ([477bbd3](https://github.com/faisalkhan91/Fluxus/commit/477bbd32b24bf18db7577a52a6adbad039214936))
* **markdown:** close entity-encoded href XSS bypass + de-dup heading ids ([ab71b3b](https://github.com/faisalkhan91/Fluxus/commit/ab71b3b3690f046ba8111c952e419f0fc9278559))
* **markdown:** escape raw HTML tokens + scheme-check image hrefs ([4375497](https://github.com/faisalkhan91/Fluxus/commit/43754974eea1b721656a73b0ea4919739fcb9e41))
* **mermaid:** re-render stale-palette figures left by a mid-render theme toggle ([938d1f0](https://github.com/faisalkhan91/Fluxus/commit/938d1f0281813ba91cdc3ce9df352cc08e72526f))
* **projects:** correct nginx topic typo + tighten sparse tag-archive grid ([6c2d18d](https://github.com/faisalkhan91/Fluxus/commit/6c2d18d731975cf0a3e655237392541cd39d703c))
* resolve a11y, SEO, and image-perf findings from runtime audit ([c7486e3](https://github.com/faisalkhan91/Fluxus/commit/c7486e394637a56dd1ab9804aba114e2c3cce983))
* **resume:** correct URL/cert, harden two-column layout, tidy generator ([d82588d](https://github.com/faisalkhan91/Fluxus/commit/d82588d8d290ae04f87a669aa91f80377865f6f3))
* **resume:** emit an accessible (tagged) PDF ([0525dff](https://github.com/faisalkhan91/Fluxus/commit/0525dff4bdac2784e84b865568d0d1304b9a1260))
* **scripts:** GitHub fetch recovers partial data + validates allowlist refs ([03aa306](https://github.com/faisalkhan91/Fluxus/commit/03aa306ccaa72c971515c299ba2c32a765fd8f16))
* **seo:** make inject-meta fail loudly instead of silently dropping metadata ([f226692](https://github.com/faisalkhan91/Fluxus/commit/f226692c0a3aa9dd535a8ace54484cdcd975cd38))
* **skills:** consistent spacing between category sections ([1f33853](https://github.com/faisalkhan91/Fluxus/commit/1f33853fd648014e42a1be6e6a5b773d144820ee))
* **skills:** stop caption pills spilling out of mobile tiles ([94fb1fc](https://github.com/faisalkhan91/Fluxus/commit/94fb1fc53d488701de5f3ab0c6aacbc0369a36c1))
* **tag-archive:** left-align cards instead of centering ([8980ad2](https://github.com/faisalkhan91/Fluxus/commit/8980ad2799b9749f3af1f11a0040fd0fc1355136))
* **theme:** make text-selection highlight visible on dark themes ([ab7078d](https://github.com/faisalkhan91/Fluxus/commit/ab7078df0e64509d6f8129f3ffac4f5b66be79a3))
* **themes:** strengthen the muted↔body fade gap on solarized-light, tokyo-night, github-light ([89c0263](https://github.com/faisalkhan91/Fluxus/commit/89c02632c91bfafb5b65fa0c8cfa7e9171fc4fe6))
* **themes:** use each theme's own accent hue for accent text and the primary button border ([426df69](https://github.com/faisalkhan91/Fluxus/commit/426df69d7ec947f6aaf46e0972063bc385de68fc))


### Miscellaneous

* **assets:** regenerate resume.pdf ([98d2e26](https://github.com/faisalkhan91/Fluxus/commit/98d2e2610a883c59058ef7d39f6ee8329490db6b))
* **blog:** resync readingTime/wordCount in posts.json ([24a9c53](https://github.com/faisalkhan91/Fluxus/commit/24a9c532bbab8f44929174862c0c48adaa8c7657))
* **deps:** refresh lockfile to latest in-range versions ([e3b8335](https://github.com/faisalkhan91/Fluxus/commit/e3b8335f54057111b386d63594b47cdf08e93480))
* **deps:** refresh package-lock to in-range patch updates ([32b542f](https://github.com/faisalkhan91/Fluxus/commit/32b542f31084303f649a43e6cb67695f28ebf613))
* **deps:** update Angular 22.0.4, sharp 0.35, pdfkit 0.19; hold @types/node on LTS ([6dcb12c](https://github.com/faisalkhan91/Fluxus/commit/6dcb12ceeeefb6a12111b7ee6081b940a26feb36))
* **format:** ignore test/build artifacts in prettier + reflow post-card img ([cb8ad96](https://github.com/faisalkhan91/Fluxus/commit/cb8ad963088ce5c15c0457abb9110f9e5fda347e))
* **prettier:** Ran prettier for linting fix ([4f7f0ae](https://github.com/faisalkhan91/Fluxus/commit/4f7f0ae5268da6e290fb493a6ebcc28082823dda))
* **projects:** retire ngnix topic fixup now that the repo topic is fixed ([5d8a4b4](https://github.com/faisalkhan91/Fluxus/commit/5d8a4b45c4e9e5b4c9ea93163fa25cbf5aa4309b))
* refresh build stamp to point at efbae7ab ([568387e](https://github.com/faisalkhan91/Fluxus/commit/568387e9d7338d7446bc5f8d9317fd0a528b2816))
* remove dead dependencies, orphan assets, and stale config ([3db5c00](https://github.com/faisalkhan91/Fluxus/commit/3db5c00d59140746ab9f0c0a723b29f8e20363ae))
* **security:** tighten CSP directives, Permissions-Policy, CI permissions ([80d0f94](https://github.com/faisalkhan91/Fluxus/commit/80d0f940d9c6a7c1c5ac90560165617958f819e8))


### Refactoring

* **blog:** batch 5 — extract blog-post DOM services ([80e1912](https://github.com/faisalkhan91/Fluxus/commit/80e1912f6c2970f88a48408e4ad597318ea79e2e))
* **blog:** extract app-post-card shared by index + tag archive ([1e9af8e](https://github.com/faisalkhan91/Fluxus/commit/1e9af8e1a53bae22178fa756dd29e57734677abc))
* **config:** batch 7 — single-source site identity & route metadata ([49f2f22](https://github.com/faisalkhan91/Fluxus/commit/49f2f22fc8aa50bff0850e8a04e5584393f368a3))
* **core:** type per-route data (tab/seo) instead of any bracket access ([93bb104](https://github.com/faisalkhan91/Fluxus/commit/93bb1041a0d51a22bd67b3c8d72748f5899ff494))
* **css:** batch 2 — remove redundant focus rings, hoist .loading-cursor ([f779fbb](https://github.com/faisalkhan91/Fluxus/commit/f779fbb5b0521ef7af4fbe248a1d0f920bbbfec7))
* **css:** exact-value font-size tokens (restore original sizes) ([26fdfbd](https://github.com/faisalkhan91/Fluxus/commit/26fdfbd954c6dbc4290ff016b0d3f03220f9b5a5))
* **css:** extract shared tag-archive chrome stylesheet ([992b178](https://github.com/faisalkhan91/Fluxus/commit/992b1783b749ddff354c6420f7f92015262c6700))
* **css:** tokenize font-sizes into a shared scale ([40dd756](https://github.com/faisalkhan91/Fluxus/commit/40dd7560a63e19a223404f3fbd6994a0d7f083e9))
* **css:** use --focus-ring token for component focus outlines ([fef4a4f](https://github.com/faisalkhan91/Fluxus/commit/fef4a4f80cef9a065eedf5752f9a92080dd8366d))
* extract applyViewTransition() shared helper ([026c728](https://github.com/faisalkhan91/Fluxus/commit/026c728be6be1b467c0bf9b0c4a4fe5dfc0722ee))
* **idioms:** batch 1 — type-only & trivial idiom fixes ([6d451fe](https://github.com/faisalkhan91/Fluxus/commit/6d451fee606532e36c87ee289de7756a8f127ed2))
* **instructions:** update best practices and remove change detection directive ([f6bef00](https://github.com/faisalkhan91/Fluxus/commit/f6bef00b58570aecf1cce3478b800fea1fd81f3c))
* **lint:** Phase 1 — lock in best-practices.md conformance + static hygiene ([fad940f](https://github.com/faisalkhan91/Fluxus/commit/fad940f33f24b23c2d4716d94e270543b0764d5c))
* minor code-quality polish ([1905acb](https://github.com/faisalkhan91/Fluxus/commit/1905acba87912e3951a75532532fa7b063ba51f8))
* **nav:** source sidebar + mobile-nav identity from ProfileDataService ([30befb1](https://github.com/faisalkhan91/Fluxus/commit/30befb12c247dba909392a6547e1f3c94197bb41))
* **projects:** batch 5 — project-detail delegates to SkillUsageService ([65d07f4](https://github.com/faisalkhan91/Fluxus/commit/65d07f4534a587c2bcbb51c8c56b931e49e0ea37))
* **projects:** extract ui-source-link from the 4 card "Source" links ([652c734](https://github.com/faisalkhan91/Fluxus/commit/652c734cbe3b1a58ce778dc05d9fc9c46812c372))
* **scripts:** batch 3 — extract scripts/lib shared layer ([9cb197b](https://github.com/faisalkhan91/Fluxus/commit/9cb197b625d4d530652565e400458929eea70681))
* **security:** single-source the non-CSP headers; guard dev/prod drift ([fe0fd95](https://github.com/faisalkhan91/Fluxus/commit/fe0fd95b31e85a58474208c3fc9a4feb45cacac3))
* **shared:** batch 4 (part 1) — extract pure shared utils ([f3500fa](https://github.com/faisalkhan91/Fluxus/commit/f3500fa7381f0041c28037a1e620cc5d86f3cf54))
* **shared:** batch 4 (part 2) — tag/expand/roving/query-param helpers ([daec04b](https://github.com/faisalkhan91/Fluxus/commit/daec04becfe3b4cc02a7203b727abcf836684c23))
* **sidebar:** move route-change subscription to constructor ([0e6daeb](https://github.com/faisalkhan91/Fluxus/commit/0e6daeb962297c41715f1b8a7830aeb923a3fda6))
* **ssr:** reuse shared slugify in prerender params ([7555cdb](https://github.com/faisalkhan91/Fluxus/commit/7555cdbbcbf60f32dffd9f3a78702ab0511c97a2))
* **templates:** adopt [@let](https://github.com/let) for repeated control/property lookups ([1612c6f](https://github.com/faisalkhan91/Fluxus/commit/1612c6feaf1c0d7e5d1a99e6024305fb963cbf49))
* **ui:** extract ui-tag pill component + --glass-lift token ([5ab616d](https://github.com/faisalkhan91/Fluxus/commit/5ab616d7fb6327a23a4d8209bb018bdc17cc6faa))
* **ui:** share readActiveOffset() across the 3 sliding indicators ([79f127e](https://github.com/faisalkhan91/Fluxus/commit/79f127e317680b8d3640caa932089a862a0f7e34))
* **v22:** phase 2 — reconcile breaking changes ([126a3a0](https://github.com/faisalkhan91/Fluxus/commit/126a3a0e895a7bf6d95fe7ac4b04c00c4cfdd520))
* **v22:** phase 3 — drop redundant OnPush (now the default) ([bf6539d](https://github.com/faisalkhan91/Fluxus/commit/bf6539d88812784561a46a3c3515188e5f3396ce))
* **v22:** phase 4 — adopt the @Service() decorator ([88719dc](https://github.com/faisalkhan91/Fluxus/commit/88719dc3687d86ecbc6d9e71d5edd5a1e211ddfc))


### Performance

* **blog:** prerender related-posts + prev/next nav via [@defer](https://github.com/defer) hydrate trigger ([6f6dca1](https://github.com/faisalkhan91/Fluxus/commit/6f6dca1e15fece566340829af99e72ef85d68fc4))
* **blog:** reuse prerendered markdown parse via TransferState (skip re-parse) ([ab2b097](https://github.com/faisalkhan91/Fluxus/commit/ab2b097760462f806403139b0ce438fac8bbaa1a))
* **fonts:** drop unused Poppins 400/500 weights; relax component-style budget ([041865e](https://github.com/faisalkhan91/Fluxus/commit/041865ecf79a3583f59558221b8cf3fa5890d3ae))
* **images:** convert portfolio + certification rasters to WebP ([2cb5454](https://github.com/faisalkhan91/Fluxus/commit/2cb54540de8170a71bbc6adc9150bd2873f532fa))
* **images:** responsive srcset via IMAGE_LOADER + build-time WebP variants ([2c9da06](https://github.com/faisalkhan91/Fluxus/commit/2c9da06a8a932df4a1879f76cd7d2b31b0e2f245))
* **seo:** preload LCP fonts + emit og:image:alt on every social card ([d4302b9](https://github.com/faisalkhan91/Fluxus/commit/d4302b9976a6f66ce593cb9c8760dd450b6bc96f))


### Documentation

* **blog:** readability + accessibility pass on technical posts ([2c5dd61](https://github.com/faisalkhan91/Fluxus/commit/2c5dd61bef1385f06bbe7bc4b5d2f31ebc6566f8))
* **blog:** refresh reliability posts and covers ([d4a90fb](https://github.com/faisalkhan91/Fluxus/commit/d4a90fb0af873ea5e8e8ac9d90f991ea3e8db0eb))
* correct Angular 21 -&gt; 22 version references ([fcc9f21](https://github.com/faisalkhan91/Fluxus/commit/fcc9f212163fb56a6cb08bc963ec6ba83c71af4f))
* correct README/CONTRIBUTING drift against current code + CI ([b07c010](https://github.com/faisalkhan91/Fluxus/commit/b07c010dc067ce9b1bb9e42545e53c371d80f498))
* **patch-guide:** document repeatable branch-patch workflow ([6f2630f](https://github.com/faisalkhan91/Fluxus/commit/6f2630fcc0cd8fe25d7d9ef56a2707274e5c625c))
* **security:** add CONTRIBUTING + SECURITY policy and RFC 9116 security.txt ([1762446](https://github.com/faisalkhan91/Fluxus/commit/17624468d611fc0c3f2941b2c69498c96480f7ee))

## [4.1.0](https://github.com/faisalkhan91/Fluxus/compare/v4.0.0...v4.1.0) (2026-05-19)


### Features

* CSP header fix ([fc822bb](https://github.com/faisalkhan91/Fluxus/commit/fc822bb399c566723a8d90d574f70c14c57ca661))

## [4.0.0](https://github.com/faisalkhan91/Fluxus/compare/v3.1.0...v4.0.0) (2026-05-19)


### ⚠ BREAKING CHANGES

* comprehensive accessibility, security, and infrastructure overhaul

### Features

* Add adjacent post navigation and reading progress indicator to blog post component ([01ae611](https://github.com/faisalkhan91/Fluxus/commit/01ae611a554eb24861c3b12c3ea2e85300e084d4))
* Add adjacent post navigation and reading progress indicator to blog post component ([4e8c342](https://github.com/faisalkhan91/Fluxus/commit/4e8c342dfdad2404ad99d2930d346c5b017de3bc))
* Add blog feature with routing and styling enhancements ([55e33a6](https://github.com/faisalkhan91/Fluxus/commit/55e33a696f404f579803b495129715c0555b50c7))
* Add custom Nginx configuration for SPA routing in Dockerfile ([503094d](https://github.com/faisalkhan91/Fluxus/commit/503094d50c23fa1505374fd0895f73d7eaf46e22))
* Add new blog post on Angular Signals state management ([00c07ad](https://github.com/faisalkhan91/Fluxus/commit/00c07ad18560a42a86faf04d26411f10ea88c86d))
* add path mapping for module imports and update environment references ([dd64f45](https://github.com/faisalkhan91/Fluxus/commit/dd64f450d42f3e4bcb5b1aa839840a4e5f113abe))
* **app-update:** warn before deferred reload via sticky toast ([57fbdc8](https://github.com/faisalkhan91/Fluxus/commit/57fbdc84ab19f9ca3a7f9af66ae0cba599018ce6))
* audit ([29fd9e0](https://github.com/faisalkhan91/Fluxus/commit/29fd9e00565a8a85d3bba6c45cb801fecfbe20ef))
* Audit and new version. ([2ea240e](https://github.com/faisalkhan91/Fluxus/commit/2ea240e2b070c332c9999f64202d3a3773311c0b))
* audit patch source ([e700cf2](https://github.com/faisalkhan91/Fluxus/commit/e700cf21eef5101a239fe3f72bcd9138804fb8e0))
* **blog:** 96px thumbnails on non-featured + tag archive cards ([6ec300c](https://github.com/faisalkhan91/Fluxus/commit/6ec300c19d1db0da9b5fb9cb5bfeecb08ca3ed18))
* **blog:** add homelab storage architecture post ([da06567](https://github.com/faisalkhan91/Fluxus/commit/da0656739366796c26d872ef641f8e2a0e559127))
* **blog:** correct image mapping and add all assembly photos ([38a2296](https://github.com/faisalkhan91/Fluxus/commit/38a2296beb897086cb9b0902c533b6ab9d5469ef))
* **blog:** polish Subscribe button + add dev spot-check path for feed builder ([16644a5](https://github.com/faisalkhan91/Fluxus/commit/16644a5351d1f1a9632f97f3602cca5c26f6b9fb))
* **blog:** publish storage foundation and freshness posts ([be8d256](https://github.com/faisalkhan91/Fluxus/commit/be8d256b39ce86a11ea6cb786bb41c02e070ff9c))
* **ci:** publish blog content updates without a semver release ([e64138f](https://github.com/faisalkhan91/Fluxus/commit/e64138ff43ada79f2dab96784318c16fd5843444))
* comprehensive portfolio remediation pass ([c21738d](https://github.com/faisalkhan91/Fluxus/commit/c21738dbe7404f49bc5b59683fccc85a4e6d557a))
* **contact:** one-shot accent glow on submit-success card ([b672225](https://github.com/faisalkhan91/Fluxus/commit/b6722255630240c2b3b3efc0e7c0228e6d70a58d))
* Enhance Angular configuration and improve server-side rendering support ([ca045b8](https://github.com/faisalkhan91/Fluxus/commit/ca045b8d2f1473c8ab8075bdeace788c7fcb21e3))
* Enhance navigation and tab functionality with new home link and close tab logic ([f369a69](https://github.com/faisalkhan91/Fluxus/commit/f369a699907e467b2786535326854093144b48f6))
* Enhance SEO and accessibility features across the application ([561b70c](https://github.com/faisalkhan91/Fluxus/commit/561b70c7a5a84cdee38fb38ce565e5a197c81f23))
* Enhance SEO and styling across the application ([d9e9c96](https://github.com/faisalkhan91/Fluxus/commit/d9e9c96660838c15d4667cc1912d685d2943af8c))
* Enhance SEO and styling across the application ([02cc35b](https://github.com/faisalkhan91/Fluxus/commit/02cc35bab5374b0dfffa5247efae82739e5a1d48))
* Enhance styling and functionality across various components ([a3b965d](https://github.com/faisalkhan91/Fluxus/commit/a3b965dfe6b5eb635664bb68c87bdc3f2767d1cc))
* Experience and Navigation Upgrades ([931f69b](https://github.com/faisalkhan91/Fluxus/commit/931f69baecee749792ca5f3a480d244cc4530ec7))
* force release pipeline to trigger ([7d5b4c0](https://github.com/faisalkhan91/Fluxus/commit/7d5b4c0256f9481e3380466dca7cbe2b056cc1f4))
* **github-meta:** enhance language bar handling in component ([4d1a6bf](https://github.com/faisalkhan91/Fluxus/commit/4d1a6bf4dd693ff32f224826fa70f663d411b773))
* **hero:** layered boot sequence + pointer parallax + token shimmer ([6af886b](https://github.com/faisalkhan91/Fluxus/commit/6af886b97963dd255f054896d824e02425644b34))
* Improve icon component to handle server-side rendering ([489c8e0](https://github.com/faisalkhan91/Fluxus/commit/489c8e0a836924c74d0f55c33781715819f39318))
* Improve user profile and SEO details for enhanced visibility ([7e23b2a](https://github.com/faisalkhan91/Fluxus/commit/7e23b2a549de5c49135aefeab47dbdd80f926168))
* Major config changes ([a710005](https://github.com/faisalkhan91/Fluxus/commit/a710005c033a41926d858d406196b3f563c0fbf2))
* **mobile:** collapsible TOC on blog posts &lt; 1280 px ([685e8d6](https://github.com/faisalkhan91/Fluxus/commit/685e8d60e463706b53a5c2207b11b2f37126e247))
* **mobile:** drawer footer with palette + theme picker + resume ([0b6f454](https://github.com/faisalkhan91/Fluxus/commit/0b6f4546ac70163f97d2842bc786a1106b089ee4))
* **mobile:** identity header in drawer + 44×44 close target ([18eb473](https://github.com/faisalkhan91/Fluxus/commit/18eb4739c2e90f694a6dcbe9e5deec352e8cbf15))
* **mobile:** palette footer hints adapt to pointer modality ([1f8a00f](https://github.com/faisalkhan91/Fluxus/commit/1f8a00f88fcc5c2febe42fde2c830aa0433548cf))
* **mobile:** render .ext file-extension chips in the drawer ([5a3f29a](https://github.com/faisalkhan91/Fluxus/commit/5a3f29aa65cf957b20519d768f47b5e746de07b2))
* **motion:** land motion audit 2026-04 + tab-tightness + cleanup ([6a00746](https://github.com/faisalkhan91/Fluxus/commit/6a007460074f7a3523ef5f8fff5f89f88582a2df))
* **nav:** add "View source on GitHub" link in sidebar + drawer ([8836229](https://github.com/faisalkhan91/Fluxus/commit/883622930dae4b2452f7822f37111fc8ac25f787))
* New blog post ([aea1340](https://github.com/faisalkhan91/Fluxus/commit/aea1340ee481738f7a1b3f36b0f005cda3b32fab))
* new blog! ([3132e58](https://github.com/faisalkhan91/Fluxus/commit/3132e5828ab0ec9450a3bab078b8f2b69674e7ef))
* Optimize Angular build and enhance NGINX configuration ([165ba6a](https://github.com/faisalkhan91/Fluxus/commit/165ba6ac74f432a1c3ea7d8f3efb88847f21761b))
* **palette:** add project entries that scroll to the matching card ([d4aaa78](https://github.com/faisalkhan91/Fluxus/commit/d4aaa78bfe196264df1907a594eceacba5ec8538))
* **projects,hero:** list view is the new /projects default + fix hero gap ([2615252](https://github.com/faisalkhan91/Fluxus/commit/26152526f87c251248831cdcfd56da47c39dd1e7))
* **projects:** add /projects/:slug detail page with README + sparkline ([3494d41](https://github.com/faisalkhan91/Fluxus/commit/3494d416fe8eb214fdbf5b998063d1c01e31f763))
* **projects:** enrich cards with GitHub meta at build time ([9f2a38f](https://github.com/faisalkhan91/Fluxus/commit/9f2a38fdaa373cce09aeeade0171c357306581de))
* **projects:** featured strip on home + sort controls on /projects ([65a5aa0](https://github.com/faisalkhan91/Fluxus/commit/65a5aa0668bc0d55897208fb46330059e07011d3))
* **projects:** list-view toggle + decouple GitHub fetch from CI ([dd6972b](https://github.com/faisalkhan91/Fluxus/commit/dd6972be07dc3a05fd19cfb8bd302a05e6847598))
* **projects:** make GitHub the source-of-truth for the projects list ([2c10ec6](https://github.com/faisalkhan91/Fluxus/commit/2c10ec6b8598c4c3dc67c7d1ecd5960a92f95036))
* **projects:** onboard Text Analyzer + Image Generator via topic tag ([56b6ae0](https://github.com/faisalkhan91/Fluxus/commit/56b6ae0b4e21aedd67ae58e327462e5c55617369))
* **projects:** polish list+grid consistency — shared card, capped tags, anchored Source ([b1fdd2d](https://github.com/faisalkhan91/Fluxus/commit/b1fdd2d0308e83287b3c6ddb462f7a8ff1e6772b))
* **projects:** route tag chips to the /projects/tag/:slug archive ([f0f329e](https://github.com/faisalkhan91/Fluxus/commit/f0f329e2d2eb1dcafa43e1a6eaac22d55c902d42))
* **projects:** sliding active indicator on sort row ([f9cddd6](https://github.com/faisalkhan91/Fluxus/commit/f9cddd6576e10354aa0d811921e4ed3e92e24d6a))
* **projects:** thumbnail on list-view rows + reshuffle featured set ([e991920](https://github.com/faisalkhan91/Fluxus/commit/e99192049a54f544ab5bf583c5b156176e3197b3))
* **prose:** copy-button confirms with a one-shot border pulse ([aee09c7](https://github.com/faisalkhan91/Fluxus/commit/aee09c793ae21e2b8f965afd1e83b420b04fe5ad))
* rendering and animations ([1074c6c](https://github.com/faisalkhan91/Fluxus/commit/1074c6c6cdc5a7bab03ff6808e54ca72e218bcad))
* **rendering:** land rendering audit 2026-04 implementation ([762ad50](https://github.com/faisalkhan91/Fluxus/commit/762ad50470bd993ba399b19e266656f765bdd9e0))
* round-3 architect upgrades + blog UX polish ([a75eb91](https://github.com/faisalkhan91/Fluxus/commit/a75eb917eea59efffcd8c7b420ad76f5115e867d))
* **section-header:** accent-line draws in on mount ([d9007e9](https://github.com/faisalkhan91/Fluxus/commit/d9007e9087c2db56d6b631b9e818606956935d02))
* **seo:** emit Article + BreadcrumbList JSON-LD on project detail pages ([a685313](https://github.com/faisalkhan91/Fluxus/commit/a685313dc858289e4f43816cb9c8fd6c91c95f33))
* **seo:** emit og:locale="en_US" on every prerendered page ([eaee53d](https://github.com/faisalkhan91/Fluxus/commit/eaee53d8a55473cf35edd5ba6ebfda1c27f5ef88))
* **seo:** emit twitter:image:alt on every social card branch ([4b2644a](https://github.com/faisalkhan91/Fluxus/commit/4b2644a57b213dc5c5ba1edff36a5f65495708ee))
* **seo:** enrich BlogPosting JSON-LD with wordCount + articleSection ([ec46d4f](https://github.com/faisalkhan91/Fluxus/commit/ec46d4f77a4a78826ae394296fa96914daadc556))
* **skills:** add per-skill anchor ids for #skill-&lt;slug&gt; deep-linking ([5f5c6e2](https://github.com/faisalkhan91/Fluxus/commit/5f5c6e28db8752b9dee15c478ef72f96e7ec0f4c))
* **skills:** cross-fade Grid↔List toggle via view-transition ([e22ccc9](https://github.com/faisalkhan91/Fluxus/commit/e22ccc9c378d62efac261cef5886420f6f24bdb3))
* **skills:** enhance skills display with tier and tagline attributes ([c2a1406](https://github.com/faisalkhan91/Fluxus/commit/c2a14061f19ef4db8e5fe469a3decf4ee6a8030b))
* **skills:** feature strip + uniform grid + list view ([4616835](https://github.com/faisalkhan91/Fluxus/commit/46168354147bb6a07034c0c0ecc5894fb17c3926))
* **skills:** smooth grid height growth on +N more expand ([a6d8ab5](https://github.com/faisalkhan91/Fluxus/commit/a6d8ab52ca3b2e9c5395fe58a5083b3ea355d9fc))
* **skills:** turn the Skills page into a connective hub ([330bba2](https://github.com/faisalkhan91/Fluxus/commit/330bba2b987cd394a205f506dea7c068c823f54f))
* **tabs:** middle-click closes tabs + title attr surfaces full label ([aa8b0d5](https://github.com/faisalkhan91/Fluxus/commit/aa8b0d54dd3259be8cbb3ac797b152213624e19a))
* Theme switcher ([4c9bc6b](https://github.com/faisalkhan91/Fluxus/commit/4c9bc6bc26060ea4e9241e160908f3d10750cf76))
* **theme:** add multi-theme registry with palette picker and last-by-scheme toggle ([9133692](https://github.com/faisalkhan91/Fluxus/commit/91336923e0ac6cf974cf453122f2eade251b10da))
* **themes:** --text-on-accent + swap gruvbox/dracula for night-owl/horizon/github-light ([682c4a6](https://github.com/faisalkhan91/Fluxus/commit/682c4a6cac068f252406be3a86139c6321bb45d5))
* **themes:** add --color-info token + 4 new themes, bump muted to AA ([d6418fb](https://github.com/faisalkhan91/Fluxus/commit/d6418fb99230f0736d46033d6323ce276994ec94))
* **themes:** cross-fade body + html on theme switch ([95a58cf](https://github.com/faisalkhan91/Fluxus/commit/95a58cfe475fe0fd66fdc00182c497a6f93e7fd0))
* **themes:** plug scrim leaks + diversify Nord/Horizon/Tokyo + fix OKLCH scope ([8161b89](https://github.com/faisalkhan91/Fluxus/commit/8161b89f27cc24a47107f5bbaabc1799068e97f2))
* **themes:** swap duplicate-feeling themes for Ayu Dark + Rose Pine ([50db34b](https://github.com/faisalkhan91/Fluxus/commit/50db34b446cb4cfce4bd9b48f09ca75ee884b42b))
* **toast:** auto-dismiss info-severity toasts after 4 s ([0d7aae9](https://github.com/faisalkhan91/Fluxus/commit/0d7aae906752847b2fe9d18160155065a614eac2))
* **toast:** stagger entries when multiple fire close together ([cf9cdac](https://github.com/faisalkhan91/Fluxus/commit/cf9cdac2da22d78a2ba07e0cb92e8a0b0d6eafa2))
* update Angular configuration and dependencies, enhance blog features ([b883a9e](https://github.com/faisalkhan91/Fluxus/commit/b883a9e52887c669cc46f79331188a5dbb1ad0dc))
* Update profile and SEO details to reflect senior role and experience ([8d38c25](https://github.com/faisalkhan91/Fluxus/commit/8d38c2596939ec4c04b5b836d9c25b020d2fcaa9))
* v2.0 -- full best-practices audit, test coverage, and CI/CD hardening ([53cf408](https://github.com/faisalkhan91/Fluxus/commit/53cf40893776c5ca34fc7089bcfa69084058148a))


### Bug Fixes

* **a11y:** bump tab-close target size + remove palette role conflict + harden history guard ([bf2a720](https://github.com/faisalkhan91/Fluxus/commit/bf2a72001213d5e1a38322e5b08ed07859c79dbe))
* **a11y:** introduce --link-color token so prose links clear AA on dark crimson ([6fefd4c](https://github.com/faisalkhan91/Fluxus/commit/6fefd4cde694818abb3e4b5b86edba2f916430fc))
* **a11y:** mark background inert while mobile menu modal is open ([7a74da3](https://github.com/faisalkhan91/Fluxus/commit/7a74da3d48a33526450a3cab7d26d501c7847558))
* **a11y:** move copy-button aria-live to inner label span ([e7769f9](https://github.com/faisalkhan91/Fluxus/commit/e7769f983ffaaca55ca37c720874edcfe5b31284))
* **a11y:** respect prefers-reduced-motion in heading-permalink scroll ([1ffbc48](https://github.com/faisalkhan91/Fluxus/commit/1ffbc48b1e4bf07087467b2815f93b9fe0bd7f08))
* **a11y:** roving tabindex on projects + skills radiogroup toggles ([a7460ad](https://github.com/faisalkhan91/Fluxus/commit/a7460ad031aec38e84029fa853ce23ad0abde5e1))
* **a11y:** WARNING / CAUTION callouts emit landmark region ([1d966c5](https://github.com/faisalkhan91/Fluxus/commit/1d966c5f5dedb8bce8b86fdb520aa8377defa265))
* **a11y:** zero animation/transition delay under reduced-motion ([ea3ed50](https://github.com/faisalkhan91/Fluxus/commit/ea3ed504418a09f9da75d9349d1c7d3f49bcc5a0))
* **audit:** escape hostname dots in prerender audit regexes ([b179058](https://github.com/faisalkhan91/Fluxus/commit/b179058fe2254d54111e5da919529901299e2ac0))
* **blog-post:** announce loading state to assistive tech ([004e59a](https://github.com/faisalkhan91/Fluxus/commit/004e59abfbf35991c99d977ee4247fed29615fc9))
* **blog-post:** cover sizes hint + 24 px floors on small links ([99f44f3](https://github.com/faisalkhan91/Fluxus/commit/99f44f3870e9e52ee769fad43faffcf42bd49f1e))
* **blog-post:** cover sizes uses viewport-relative units (NG02952) ([8785360](https://github.com/faisalkhan91/Fluxus/commit/8785360a5189f9925dbeab2681c416cbb63c92f4))
* **blog-post:** defer canWebShare flip until after hydration ([f6d4347](https://github.com/faisalkhan91/Fluxus/commit/f6d4347dce322455d4a0e5128730338bb65812c9))
* **blog:** featured cover overflow + tighten list entrance jank ([7afd529](https://github.com/faisalkhan91/Fluxus/commit/7afd529844264b082cc5839528dd1a368139db5c))
* **blog:** make BlogService.posts signal-graph-aware of "today" gate ([52a7ef3](https://github.com/faisalkhan91/Fluxus/commit/52a7ef33f64a92e2aace7a1fddf393a012e0277e))
* **blog:** mobile non-featured cards stack like featured ([e1dfe04](https://github.com/faisalkhan91/Fluxus/commit/e1dfe04ad025a2f36403407f62417560757030cf))
* **blog:** reading-progress bar excluded from route view-transition ([2bc40d9](https://github.com/faisalkhan91/Fluxus/commit/2bc40d92b5f6b432fbefd89e3a45d97ef65d5ed6))
* **blog:** update cover image for motion audit post ([8574bfc](https://github.com/faisalkhan91/Fluxus/commit/8574bfccba8d2c318767c8dd3d9e8661b4f77db3))
* **blog:** update image paths to be relative ([621b6cc](https://github.com/faisalkhan91/Fluxus/commit/621b6cc1b508315accdbba8a4ca9ba99c16fb5f2))
* **blog:** use [@starting-style](https://github.com/starting-style) for entrance to kill Firefox FOUC ([db92105](https://github.com/faisalkhan91/Fluxus/commit/db92105a5c8d5a2fefdbbe181295590f5e704207))
* **build:** resolve Windows path issues in image-dims script ([86dd060](https://github.com/faisalkhan91/Fluxus/commit/86dd0609d8304fe5ffaff9885bb57f6a276c526e))
* **cards:** clamp titles + equalise row heights on hero + /blog cards ([9fa45aa](https://github.com/faisalkhan91/Fluxus/commit/9fa45aa1630255a95b98cc2738fd519fffd88a15))
* **certifications:** explicit Home/End scroll for the cert rail ([0edff32](https://github.com/faisalkhan91/Fluxus/commit/0edff32d1a178fe809c14ed39b300e6b8e4ef6e9))
* **changelog:** correct version comparison links and update README for routing changes ([86e3d15](https://github.com/faisalkhan91/Fluxus/commit/86e3d15d217223f77d25702e0b909e606556f117))
* **changelog:** remove unnecessary whitespace and align bug fix entries ([5b1bc08](https://github.com/faisalkhan91/Fluxus/commit/5b1bc0897642bc2eee1de13e78474ffb526e1f72))
* **ci:** update lighthouse-ci-action to correct SHA for v12.1.0 ([746baaf](https://github.com/faisalkhan91/Fluxus/commit/746baafbe7845acd54a43c4bd894e434fe0fa57d))
* **ci:** use verified SHA for lighthouse-ci-action v12.1.0 ([b641002](https://github.com/faisalkhan91/Fluxus/commit/b6410026a0bcb3f574eac96828a261165052429e))
* **contact:** 16px input font-size — kills iOS auto-zoom on focus ([06ba93f](https://github.com/faisalkhan91/Fluxus/commit/06ba93f0e790d7f998e6af9ae5f1a4f820ec9d02))
* **contact:** cancel emailCopied reset timer on destroy + double-tap ([d61c59b](https://github.com/faisalkhan91/Fluxus/commit/d61c59b1f34e67f664f306eb7eb994d1a89dd247))
* **contact:** guard onSubmit against re-entry while stage transitions ([dd88165](https://github.com/faisalkhan91/Fluxus/commit/dd8816530c8e8eab7667507612212fe73a82500b))
* **core:** bootstrap application and core runtime initialization logic ([9e3e0a3](https://github.com/faisalkhan91/Fluxus/commit/9e3e0a3b37dbcb25094699323a54f462493b88b0))
* **csp:** tighten with object-src 'none', upgrade-insecure-requests, COOP/CORP ([c7e7dbd](https://github.com/faisalkhan91/Fluxus/commit/c7e7dbdc0fd5e71a7fe60c1077daae12ee584e76))
* **csp:** unbreak prerendered blog first paint and lock down with regression checks ([0973ffa](https://github.com/faisalkhan91/Fluxus/commit/0973ffaaaa08f716cbbd78385a09e3a8b397273f))
* **css:** standardise mobile breakpoint to 767px (matches MOBILE_MAX) ([4a896aa](https://github.com/faisalkhan91/Fluxus/commit/4a896aa4e9f2063551fe7e1db78300cbd46c761e))
* **error-handler:** stop chunk-load toast from firing on generic \"loading\" errors ([ca01a45](https://github.com/faisalkhan91/Fluxus/commit/ca01a45f2353e7bc2d42f7796968a8aa8468b6f2))
* **feed:** honour post.updated on &lt;updated&gt; + use type=text on summary ([f2409b9](https://github.com/faisalkhan91/Fluxus/commit/f2409b9ee4fb2bdfe5c470c78269924414ec9c37))
* force release pipeline to trigger ([814a3a8](https://github.com/faisalkhan91/Fluxus/commit/814a3a80e48dde63b7e7e9586ab64d5db1680503))
* **glow-button:** mirror disabled state onto aria-disabled ([4e63fef](https://github.com/faisalkhan91/Fluxus/commit/4e63fefb084e5f507066f40c9b7e7a1b6d8ba796))
* **hero:** cross-fade skeletons → cards on [@defer](https://github.com/defer) hydration ([847779c](https://github.com/faisalkhan91/Fluxus/commit/847779c00862b103968c2deb1e6ac5ba166dd692))
* **hero:** match social-link tap feedback to hover on touch ([5bbfb8e](https://github.com/faisalkhan91/Fluxus/commit/5bbfb8efb1bd4891d8eede31eac597e5cb0d6b7f))
* **hero:** rename dead [data-theme='light'] selectors to crimson-light ([86ad362](https://github.com/faisalkhan91/Fluxus/commit/86ad362c2364b626f31be417078d7576562b5ad9))
* **hero:** zero animation-delay under prefers-reduced-motion ([43e623e](https://github.com/faisalkhan91/Fluxus/commit/43e623ed1d5e1ff299a2fdc039a64c4f2821acd4))
* **images:** switch card + cover &lt;img&gt;s to NgOptimizedImage fill mode ([1dd4cc0](https://github.com/faisalkhan91/Fluxus/commit/1dd4cc01c9e9545a68e8916248428c5fd3ff7315))
* **image:** upgrade base packages and update trivy-action to v0.36.0 ([6bd1990](https://github.com/faisalkhan91/Fluxus/commit/6bd19906c5a279c72d453d745268b3e3b405dd41))
* **image:** upgrade base packages and update trivy-action to v0.36.0 ([f201b98](https://github.com/faisalkhan91/Fluxus/commit/f201b987abfc3ddbb3941f596c2eb3c292017443))
* **layout:** centre collapsed sidebar footer buttons and align mobile heading anchors ([a097b45](https://github.com/faisalkhan91/Fluxus/commit/a097b45a0a51004939c8ec662c9545a86dc1851b))
* **layout:** hide heading permalink anchor on mobile to keep heading text anchored to the column edge ([eee00ac](https://github.com/faisalkhan91/Fluxus/commit/eee00acd72197a470540dea3bbeedd2a5d80f52e))
* **markdown:** catch marked.parse() exceptions instead of bubbling them up ([a315bc0](https://github.com/faisalkhan91/Fluxus/commit/a315bc084f46d5d006abdcf3938310c53d9bc3fc))
* **markdown:** neutralise javascript: hrefs via marked walkTokens ([5326512](https://github.com/faisalkhan91/Fluxus/commit/5326512590e2e6fdec5d231542671c3a98594444))
* **mermaid:** coalesce concurrent renders + cancel deferred handles ([28cce2e](https://github.com/faisalkhan91/Fluxus/commit/28cce2e44154a5f23adb64cb308b50bd1efd40c9))
* **mermaid:** cross-fade placeholder → rendered SVG ([1e0bb95](https://github.com/faisalkhan91/Fluxus/commit/1e0bb95378423d019479d2283566f237229abfd0))
* **mermaid:** expose cancel() + call from blog-post destroy ([f6214c2](https://github.com/faisalkhan91/Fluxus/commit/f6214c21681277b5fb47233f2ad6d941e942b02f))
* **mobile:** bump .tag pill targets to ≥24 px (WCAG 2.2 SC 2.5.8) ([2cd2434](https://github.com/faisalkhan91/Fluxus/commit/2cd24340bc4246d77f5801429087acaaee483022))
* **mobile:** clear iPhone home indicator + opt into edge-to-edge viewport ([dd476b5](https://github.com/faisalkhan91/Fluxus/commit/dd476b5307c2cd0defb4d358c7fff0397d4ac684))
* **mobile:** clear iPhone safe areas on toast + reading-progress bar ([3fd5232](https://github.com/faisalkhan91/Fluxus/commit/3fd52326a7fb66bae3f0b863c5ca6d2397040e3e))
* **mobile:** close drawer on NavigationStart (Android back parity) ([31196e2](https://github.com/faisalkhan91/Fluxus/commit/31196e295f50ef1711abbd7a25ff1b45fdd8058f))
* **mobile:** copy button visible on touch + 24×44 hit area ([44b7406](https://github.com/faisalkhan91/Fluxus/commit/44b740656e2af50ddf11c5ae21b37aa35a676206))
* **mobile:** drawer footer flex-shrink + active-route auto-scroll ([f2bb6c6](https://github.com/faisalkhan91/Fluxus/commit/f2bb6c6fadab30c162a0f11f9015f4a820e6d10b))
* **mobile:** hide Esc chip in palette input on touch devices ([2803b05](https://github.com/faisalkhan91/Fluxus/commit/2803b052dc7e7a7835db3a26058693e5c08b5794))
* **mobile:** lift toast region above the floating nav pill ([9463bad](https://github.com/faisalkhan91/Fluxus/commit/9463badeeda488e808a512efec5ce1dd0361ec6f))
* **mobile:** use 100dvh so iOS Safari viewport tracks dynamic chrome ([2ef53e5](https://github.com/faisalkhan91/Fluxus/commit/2ef53e5a1d678d95dbaa372081872d28407f63b3))
* **mobile:** wire enterkeyhint + inputmode on contact form fields ([d8d7bfb](https://github.com/faisalkhan91/Fluxus/commit/d8d7bfb95b861cd9c97b5ff10b4d082572ff25c3))
* **not-found:** set noindex,nofollow on SPA-nav 404s ([8215fc9](https://github.com/faisalkhan91/Fluxus/commit/8215fc9cff820d22557871b98e9cc26bc850b35c))
* **palette:** restore focus to trigger on close (a11y parity) ([83b59d6](https://github.com/faisalkhan91/Fluxus/commit/83b59d6d94006068eb39ca161a604e87f21d6464))
* **palette:** scroll the active option into view after arrow-key nav ([aebf223](https://github.com/faisalkhan91/Fluxus/commit/aebf22370d7883280976ad3338e12a5e8298c381))
* **print:** explicitly disable all animation + transition ([49e1c37](https://github.com/faisalkhan91/Fluxus/commit/49e1c37a1713675cc93cca4301a5ee8d0a66f6fa))
* **project-detail:** noindex invalid-slug fallback ([932668f](https://github.com/faisalkhan91/Fluxus/commit/932668f6ef8b50bdf481a223f5ee7b36476e8505))
* **projects:** collapse semantic tag aliases into canonical labels ([b26fa39](https://github.com/faisalkhan91/Fluxus/commit/b26fa397952e15389dd2dde5ef7c9ab824e8a2db))
* **projects:** drop NG8107-warning optional chains on languagesBytes ([982b09f](https://github.com/faisalkhan91/Fluxus/commit/982b09fad6048d271f05d70da2dc130df969e2d0))
* **projects:** gate NgOptimizedImage priority via [@if](https://github.com/if) to silence NG02953 ([e825c90](https://github.com/faisalkhan91/Fluxus/commit/e825c9051d31af7bbfd2aadff77dbbd5069e8b7e))
* **projects:** hover image scale uses --transition-base, not slow ([2d3dbc6](https://github.com/faisalkhan91/Fluxus/commit/2d3dbc6be53536a922336c145c9f90e0dbc228e3))
* **projects:** NaN-safe pushedAt parse for the updated sort ([ff2b2dc](https://github.com/faisalkhan91/Fluxus/commit/ff2b2dc31ebd2f89fd59a6f25ae1fbbd11845026))
* **prose:** inline code can wrap inside the token on narrow viewports ([cccd121](https://github.com/faisalkhan91/Fluxus/commit/cccd121ff9d493f71b2566f4b1ee2e298e701b49))
* **pwa:** add maskable purpose + scope + categories to web manifest ([3e9343d](https://github.com/faisalkhan91/Fluxus/commit/3e9343d9980981c8019176003c71e83446175c11))
* **pwa:** wire Apple PWA meta tags for iOS standalone mode ([41194a3](https://github.com/faisalkhan91/Fluxus/commit/41194a3a91dd4452443a16c9be9d468e61519bce))
* remove obsolete CI error fix patch and update Karma configuration ([93bebe2](https://github.com/faisalkhan91/Fluxus/commit/93bebe2e51d855ef2cde94978531c3c009e5558a))
* Remove unnecessary peer dependencies from package-lock.json ([60ad0b6](https://github.com/faisalkhan91/Fluxus/commit/60ad0b6e9a661b0e440016099c820d820fbac699))
* Removed patch files ([8c875dc](https://github.com/faisalkhan91/Fluxus/commit/8c875dc94cd2d28a46f19e0e413566efe2a5daf6))
* resolve CI lint errors and setup-node deprecation ([bdf4418](https://github.com/faisalkhan91/Fluxus/commit/bdf441858ea36cd8055cf36e705952dba656a2f1))
* resolve SSR NotYetImplemented error in IconComponent ([44eef70](https://github.com/faisalkhan91/Fluxus/commit/44eef70e1210d746408f76e0aeb66e315320576e))
* **scripts:** emit \`readonly Project[]\` in the generated list ([d33b050](https://github.com/faisalkhan91/Fluxus/commit/d33b050ef379ac45085847aa55b449b2b1fc204b))
* **scripts:** escape URL interpolation in build-feed.mjs + spec-explicit link rels ([22afe3b](https://github.com/faisalkhan91/Fluxus/commit/22afe3b371d87c71c010612ed8b1f0a877b735c3))
* **scripts:** fail-fast dist check at top of build-sitemap.mjs ([8800ef5](https://github.com/faisalkhan91/Fluxus/commit/8800ef564750150572b89c016a722cc9703039fb))
* **scripts:** replace dead FATAL guard with pre-write merged.length check ([48c2903](https://github.com/faisalkhan91/Fluxus/commit/48c2903032a3f07a3728b6e0a8674b95de544321))
* **security:** ignore known base image vulnerabilities in Trivy scan ([26f705e](https://github.com/faisalkhan91/Fluxus/commit/26f705ee7021c7e0a16191b45d9707fb04867765))
* **seo:** clear robots tag on every navigation ([0831f65](https://github.com/faisalkhan91/Fluxus/commit/0831f659ce14983a76f3181ed5d2e49f9dea658a))
* **seo:** emit og:image:width/height/type for default OG image ([8041a1c](https://github.com/faisalkhan91/Fluxus/commit/8041a1c42fe9ad73d3793ad06877a6abf9bc19c1))
* **seo:** noindex draft + future-dated blog posts ([3e8d565](https://github.com/faisalkhan91/Fluxus/commit/3e8d565538d264860bfb68f79abc9c8a99308ff6))
* **seo:** preserve root canonical trailing slash to match prerender ([ac2dad2](https://github.com/faisalkhan91/Fluxus/commit/ac2dad2f4560f32f5675b69c83480eacca676c64))
* **seo:** write robots noindex on SPA navigation to draft posts ([4028756](https://github.com/faisalkhan91/Fluxus/commit/40287566585f9d88477fadc84a069bdc72028bf4))
* **shell:** focus #main-content on subsequent route navigations ([4d509e3](https://github.com/faisalkhan91/Fluxus/commit/4d509e3e3e44c672ba4643cb6a74e15596ec73cd))
* **sidebar:** anchor collapsed-state icons via padding so they stay in the 60 px rail ([e141a65](https://github.com/faisalkhan91/Fluxus/commit/e141a6575f7f57c19dd48af8c413db0848330143))
* **sidebar:** hide labels in tablet [@media](https://github.com/media) so collapsed icons stay visible ([6893a14](https://github.com/faisalkhan91/Fluxus/commit/6893a14bcbaf62eb89df9924a48bef6c7350c739))
* **sidebar:** shrink collapsed footer buttons to icon-button width so chrome fits the 60 px rail ([846f153](https://github.com/faisalkhan91/Fluxus/commit/846f153b98656647e28694e7149a1de75a2bd5b4))
* **skills:** correct Angular/GitHub/Actions icons + dark-theme visibility for mono brands ([e2d729c](https://github.com/faisalkhan91/Fluxus/commit/e2d729c579da817714403888f05a3cf13acef6dd))
* **skills:** equalise badge widths + heights across category grids ([bccff99](https://github.com/faisalkhan91/Fluxus/commit/bccff999e9e0d403a4e700590272825ad5bb898e))
* **ssr:** surface posts.json parse errors during prerender ([bef0371](https://github.com/faisalkhan91/Fluxus/commit/bef0371de805018b0f101daaed240a4788516e4e))
* suppress CVE-2026-28390 in .trivyignore ([b5f2555](https://github.com/faisalkhan91/Fluxus/commit/b5f2555c31bac134b63dd6a3c42322ce51ae5c8a))
* suppress CVE-2026-28390 in .trivyignore ([b0a31c1](https://github.com/faisalkhan91/Fluxus/commit/b0a31c1c44f31f2e310631199c1172c3adf3a71e))
* **sw:** activate new app versions at next safe navigation boundary ([5ca7aaf](https://github.com/faisalkhan91/Fluxus/commit/5ca7aaf85b0ec7e6ac5ee9d807cf5209033e8b3e))
* **sw:** cache prerendered routes + align index path + drop dead glob ([3247aa4](https://github.com/faisalkhan91/Fluxus/commit/3247aa4ec6af069edc65f545cd7210ce1d91761a))
* **tab-bar:** suppress indicator teleport on first hydration ([e74d13a](https://github.com/faisalkhan91/Fluxus/commit/e74d13a1d26d2d72ee18cb97394db17315c5a282))
* **test:** resolve Playwright focus-trap collision, a11y, and timing failures ([d7c7199](https://github.com/faisalkhan91/Fluxus/commit/d7c71992b450dd5cca43a73874844b4eab0c17e6))
* **theme:** guard every localStorage call against Safari private mode ([8d53ccf](https://github.com/faisalkhan91/Fluxus/commit/8d53ccf53a113a326dbc909b4942d987d8669639))
* **theme:** mirror active theme scheme to :root color-scheme ([98b0054](https://github.com/faisalkhan91/Fluxus/commit/98b00540500a3a7912958cddbc2dadc93da7ca71))
* **theme:** scrollbar-color + scrollbar-width for Firefox parity ([47d2c13](https://github.com/faisalkhan91/Fluxus/commit/47d2c13325ff76adb4f0af4c36429c0f0fe7f69a))
* **themes:** resolve crimson-light accent==error; lift hljs comments to AA ([961f99f](https://github.com/faisalkhan91/Fluxus/commit/961f99f05ac3e437c5d8eead26a6d61a63bf0e77))
* **ui:** stop duplicate Projects tabs on sort + align skill-badge heights ([4e45891](https://github.com/faisalkhan91/Fluxus/commit/4e45891c6e51ee08482169331ab8f31435e97018))
* Update project name and paths after relocation ([7c423c7](https://github.com/faisalkhan91/Fluxus/commit/7c423c70b0caeaf3b35e2f4776f8c807de2e6578))
* **web-vitals:** add cancel() to actually use the stored idleHandle ([f7681db](https://github.com/faisalkhan91/Fluxus/commit/f7681dbfdf7c50079d369256bcf85095c5706d54))


### Miscellaneous

* align two stray comments with code ([41299a8](https://github.com/faisalkhan91/Fluxus/commit/41299a8d2ab283697ae3937ea30fe44db0ee8bfe))
* **assets:** drop 5 orphaned binaries (~610 KB) ([3918f7f](https://github.com/faisalkhan91/Fluxus/commit/3918f7f2ac8e916466ad2d16eb64041daace392d))
* **blog:** add cover images for three May posts + regen image-dims ([894fcad](https://github.com/faisalkhan91/Fluxus/commit/894fcad4c9c2bec6592941410e9c64aadd51c89e))
* **build:** clear lingering errors, warnings, and pre-existing test debt ([38d8fe9](https://github.com/faisalkhan91/Fluxus/commit/38d8fe9f1d7d68af881ac2f2230cb8ab0b094f8e))
* Bump version to 1.0.0 and update README for Angular 18 enhancements ([7645739](https://github.com/faisalkhan91/Fluxus/commit/7645739ff99aec39c35b6c70bb92a4b31405485b))
* bump version to 2.2.2 ([25e240f](https://github.com/faisalkhan91/Fluxus/commit/25e240f655a48d8f197d4109ca42a237e2beb2ab))
* **changelog:** synchronize production build and deployment pipeline state ([ca9f1f8](https://github.com/faisalkhan91/Fluxus/commit/ca9f1f84758e808f541a762a4aae8fde5fb3805f))
* **changelog:** trigger production build and deployment ([a0b22d0](https://github.com/faisalkhan91/Fluxus/commit/a0b22d0584d55ddbc498ebb4467ecbce288c4c86))
* **ci:** clear lint + prettier blockers ([8b15df6](https://github.com/faisalkhan91/Fluxus/commit/8b15df6223db670909a218b8874f2648e8729c4f))
* **ci:** document new CI/CD topology and add GHCR retention ([0d388d2](https://github.com/faisalkhan91/Fluxus/commit/0d388d249a812d45d997a30fc3b31aaca398d4fe))
* **ci:** rebuild GitHub Actions for security, simplicity, and PR-based GitOps ([5248249](https://github.com/faisalkhan91/Fluxus/commit/52482493a98b387cab602c4342525a5d7d0ee9a3))
* Clean up package-lock.json by removing unused dependencies ([99bc6ab](https://github.com/faisalkhan91/Fluxus/commit/99bc6abd60568dcd86a652eda89a9ff3629b5e07))
* declare MIT license in package.json ([773acec](https://github.com/faisalkhan91/Fluxus/commit/773acec5035665d08fd91110c3fc4da38b09f966))
* delete dead computeReadingTime; build script owns the canonical impl ([ee1b6a7](https://github.com/faisalkhan91/Fluxus/commit/ee1b6a7fa2c0107b7d77152e75c79d9c387fa910))
* **deps-dev:** bump typescript-eslint ([580a520](https://github.com/faisalkhan91/Fluxus/commit/580a520f48f3263548e1b7a809df23c5a6949830))
* **deps-dev:** bump typescript-eslint from 8.56.1 to 8.59.0 in the eslint group across 1 directory ([9721b46](https://github.com/faisalkhan91/Fluxus/commit/9721b469aeae0adfc56a5d949ae038cac980c976))
* **deps:** bump docker/build-push-action from 7.0.0 to 7.1.0 ([eda252c](https://github.com/faisalkhan91/Fluxus/commit/eda252c8684e548ee42a229894d8fc39656213cc))
* **deps:** bump docker/build-push-action from 7.0.0 to 7.1.0 ([be045ae](https://github.com/faisalkhan91/Fluxus/commit/be045aeae954043b9ec6eae7adbb45e0feb30e35))
* **deps:** bump docker/login-action from 4.0.0 to 4.1.0 ([3b5cd47](https://github.com/faisalkhan91/Fluxus/commit/3b5cd47276eb9262ebdb53440a6b8fb4e950b1c2))
* **deps:** bump docker/login-action from 4.0.0 to 4.1.0 ([2b67aaf](https://github.com/faisalkhan91/Fluxus/commit/2b67aaf9cfa7ceffb66dc251628aa980b8f744eb))
* **deps:** bump nginxinc/nginx-unprivileged ([59f3a8f](https://github.com/faisalkhan91/Fluxus/commit/59f3a8f18a80bdba69103d91f47e1059d70faa56))
* **deps:** bump nginxinc/nginx-unprivileged from 1.27-alpine to 1.29-alpine ([11cb7c0](https://github.com/faisalkhan91/Fluxus/commit/11cb7c0a23003b2d3632aabf1f03e5a664dfb345))
* **deps:** patch eslint deps + lift Angular floor to installed 21.2.13 ([4c785b2](https://github.com/faisalkhan91/Fluxus/commit/4c785b228e89938a00d893c5356591626d384a13))
* **deps:** tighten dependabot grouping and ignore deferred majors ([b79b988](https://github.com/faisalkhan91/Fluxus/commit/b79b98876a5b56f33151588fb35a6a0b1d4b8733))
* enhance blog post error handling and update styles ([570da60](https://github.com/faisalkhan91/Fluxus/commit/570da60d18ffaa321ab713e3e21b55d7899bc4f6))
* Fix dependency version conflicts for Angular packages ([9350fa1](https://github.com/faisalkhan91/Fluxus/commit/9350fa1444c7c47767a0b6ffc845be83bf18f1a4))
* force release and update CI configurations ([5bc2cab](https://github.com/faisalkhan91/Fluxus/commit/5bc2cab90152a1905f0879418970b7069ec4cefe))
* force version to 2.0.0 and fix tag prefix ([9e17c39](https://github.com/faisalkhan91/Fluxus/commit/9e17c3954558df317829dec1bb5701fd0aefcc0c))
* format release-please-config.json to appease prettier ([9978334](https://github.com/faisalkhan91/Fluxus/commit/9978334ed2d5592c12b516f52b6e68e8463449f0))
* **format:** apply prettier sweep flushed by broader lint scope ([55b3ac7](https://github.com/faisalkhan91/Fluxus/commit/55b3ac771e27271918d59f4bcd1b4b60a2cbe113))
* **format:** global prettier sweep to normalize line endings and styles ([205d66b](https://github.com/faisalkhan91/Fluxus/commit/205d66b7000199fb9b9dc4861e565248e544dc6e))
* **format:** trim trailing spaces in homelab-storage-foundation table ([d1fa758](https://github.com/faisalkhan91/Fluxus/commit/d1fa7585ca3c098a1762dd64a6f36b98a0fa5853))
* **lint:** fold prettier --check into npm run lint ([4f6c961](https://github.com/faisalkhan91/Fluxus/commit/4f6c961b2dba7fd85406232c297bf59243cbc70a))
* **main:** release 1.2.0 ([c324843](https://github.com/faisalkhan91/Fluxus/commit/c3248435533e0847ea5f7e355438e29129ba3983))
* **main:** release 1.2.0 ([9d38268](https://github.com/faisalkhan91/Fluxus/commit/9d38268bc4e1ca862a196ab094a12b25bae88fac))
* **main:** release 1.2.1 ([5c5e69b](https://github.com/faisalkhan91/Fluxus/commit/5c5e69b7cd4642e28c2d01c9503e721da67f67f6))
* **main:** release 1.2.1 ([ee1e48a](https://github.com/faisalkhan91/Fluxus/commit/ee1e48ad4e7167cc845b726f809e73ac58476d8e))
* **main:** release 1.2.2 ([21a21f0](https://github.com/faisalkhan91/Fluxus/commit/21a21f0bb3130eabe90892728ed71b3eb6c32b88))
* **main:** release 1.2.2 ([4c1ae1c](https://github.com/faisalkhan91/Fluxus/commit/4c1ae1c212eaf96e6de27b946603b405a2256697))
* **main:** release 1.2.3 ([90210fa](https://github.com/faisalkhan91/Fluxus/commit/90210fa64bc8dd3081d186646576087c09afa84f))
* **main:** release 1.2.3 ([45c1197](https://github.com/faisalkhan91/Fluxus/commit/45c11978fa96635b5401796fbb595043bd287582))
* **main:** release 1.2.4 ([cc07132](https://github.com/faisalkhan91/Fluxus/commit/cc0713208819f75fb689c787b22d8e4c58620c90))
* **main:** release 1.2.4 ([fc7eaaf](https://github.com/faisalkhan91/Fluxus/commit/fc7eaaf8648d8317708881bf91e8d31498ce1f14))
* **main:** release 1.3.0 ([c7f7c0f](https://github.com/faisalkhan91/Fluxus/commit/c7f7c0fb7f30cd3ff2520b71f0c872cf8d539a7a))
* **main:** release 1.3.0 ([21fbf09](https://github.com/faisalkhan91/Fluxus/commit/21fbf0985402edb6b86faf480b76c7833c1b4b74))
* **main:** release 2.0.0 ([eeea63b](https://github.com/faisalkhan91/Fluxus/commit/eeea63bf7a44cecc2f036fecf4bad19f98bf9e77))
* **main:** release 2.0.0 ([7bcf64d](https://github.com/faisalkhan91/Fluxus/commit/7bcf64d2f57e3e8a3312299b27486ca6765764eb))
* **main:** release 2.1.0 ([6fd32b6](https://github.com/faisalkhan91/Fluxus/commit/6fd32b6d47b3828addf282cf26785434f58e58d5))
* **main:** release 2.1.0 ([f922085](https://github.com/faisalkhan91/Fluxus/commit/f922085609a3d8cab99df4880015c30f2ebf989a))
* **main:** release 2.1.1 ([7d3aa0f](https://github.com/faisalkhan91/Fluxus/commit/7d3aa0f7acb989cc243677dfbd2c450c24b0cf98))
* **main:** release 2.1.1 ([2f4ba4f](https://github.com/faisalkhan91/Fluxus/commit/2f4ba4fab59e59ea761566da53b131777b7b9637))
* **main:** release 2.2.0 ([bcf4d85](https://github.com/faisalkhan91/Fluxus/commit/bcf4d8570bad54e924caf1daba8064f471e8708f))
* **main:** release 2.2.0 ([15375a0](https://github.com/faisalkhan91/Fluxus/commit/15375a018e4061fbb4880effca33731a35cff423))
* **main:** release 2.2.1 ([d2b7406](https://github.com/faisalkhan91/Fluxus/commit/d2b7406b58dafa07fb76fa0734431ee4b9865d5a))
* **main:** release 2.2.1 ([02773eb](https://github.com/faisalkhan91/Fluxus/commit/02773eba30721396b41e929b327aa6d867e9baf7))
* **main:** release 2.3.0 ([4862a6f](https://github.com/faisalkhan91/Fluxus/commit/4862a6f7f1ee600f2c1d25dd849943329b7db4ad))
* **main:** release 2.3.0 ([1a69ce9](https://github.com/faisalkhan91/Fluxus/commit/1a69ce9f7b96f4f98cc0ae27dc9dd174a210da51))
* **main:** release 3.0.0 ([c50fd0e](https://github.com/faisalkhan91/Fluxus/commit/c50fd0ef5fff53da688c25780467d21a596031bf))
* **main:** release 3.0.0 ([e5663af](https://github.com/faisalkhan91/Fluxus/commit/e5663af2d6bafb9a2e22377bfa9124fa269bb619))
* **main:** release fluxus 2.0.0 ([6b5c9e7](https://github.com/faisalkhan91/Fluxus/commit/6b5c9e79ba8f7c6fb9abcf4f53c92106b54c619d))
* **main:** release fluxus 2.0.0 ([c797d12](https://github.com/faisalkhan91/Fluxus/commit/c797d124cae7641a224e5d09f50f950560996a11))
* **main:** release fluxus 2.1.0 ([6ccba7d](https://github.com/faisalkhan91/Fluxus/commit/6ccba7ddd88e1aa390d48bc10864b228b58083b2))
* **main:** release fluxus 2.1.0 ([da5e3b4](https://github.com/faisalkhan91/Fluxus/commit/da5e3b4695239a145becc50494c594a1edda9cf3))
* patch cleanup ([9b3c6cf](https://github.com/faisalkhan91/Fluxus/commit/9b3c6cfb800b9b16183701492d3aa29e6fb307fb))
* redesign adaptive favicon suite with &gt;fk_ prompt mark ([afa9324](https://github.com/faisalkhan91/Fluxus/commit/afa93248c49e3e03c1e151078d6e3687fd03b323))
* Refactor configuration files and update dependencies ([950e805](https://github.com/faisalkhan91/Fluxus/commit/950e805f940c5bd7c36d9c51121db416aed7c2e9))
* refresh build stamp to point at the v3.1.0 release commit ([5b5e295](https://github.com/faisalkhan91/Fluxus/commit/5b5e295736aae16eb15698bdf383ee6daf6a3b71))
* release 1.2.3 ([18f6472](https://github.com/faisalkhan91/Fluxus/commit/18f64724824154680a911c93b85541850cc4e055))
* release 1.3.0 and update changelog ([5b6312d](https://github.com/faisalkhan91/Fluxus/commit/5b6312de5f16201d126c9dc79d4d3e29c3b57535))
* **release:** 2.4.0 ([fa07e64](https://github.com/faisalkhan91/Fluxus/commit/fa07e6486e7cc45f7ea80de2b81a1601522b08d8))
* **release:** 3.1.0 ([768c709](https://github.com/faisalkhan91/Fluxus/commit/768c70981b95493b8aed39c83aae8922c0dabf52))
* **release:** bump version to 1.2.4 and update changelog for rendering fixes ([8c3412a](https://github.com/faisalkhan91/Fluxus/commit/8c3412a36da64bb49e60049d3811c4c03defbe0f))
* remove obsolete CI fixes and update workflows ([b74a3dc](https://github.com/faisalkhan91/Fluxus/commit/b74a3dc8a53f3933f2341949dbded61631c9e138))
* remove zone.js dependency and update Angular configuration ([6211ceb](https://github.com/faisalkhan91/Fluxus/commit/6211ceb15b90a313defa31bfb76341eeef60422c))
* satisfy CI lint + format + typecheck on the revamped projects surface ([b65aff7](https://github.com/faisalkhan91/Fluxus/commit/b65aff7192aec5219c8c2858f0c623b2f6191131))
* **ts:** enable verbatimModuleSyntax + 70 type-only import fixes ([af4332e](https://github.com/faisalkhan91/Fluxus/commit/af4332ecc4b2e2244f197e75a88745d1370c4dfc))
* update .gitignore and package files for Playwright integration ([d7539dc](https://github.com/faisalkhan91/Fluxus/commit/d7539dc27eadc487b59062ca4ee7ae99e9e0f6ef))
* update Angular and related dependencies to latest versions ([02f8120](https://github.com/faisalkhan91/Fluxus/commit/02f8120e5c40feecf2a4864c6d08fa588079d36e))
* Update Angular dependencies to version 21.2.6 ([853f5d6](https://github.com/faisalkhan91/Fluxus/commit/853f5d68e11b6d2c4d24894c67adc76e795de02b))
* Update Angular dependencies to version 21.2.6 ([4e92756](https://github.com/faisalkhan91/Fluxus/commit/4e92756e55f5f719f0bad9558c8a690d97232b01))
* update CI workflows and ignore CHANGELOG.md in Prettier ([73676d0](https://github.com/faisalkhan91/Fluxus/commit/73676d0a53bdc63561f2f47c84af11200b3a3e01))
* update configuration and improve error handling ([606d0eb](https://github.com/faisalkhan91/Fluxus/commit/606d0eb539cedbb24754b48ac7590fa4395ef0c1))
* update dependencies and enhance blog post error handling ([0afc52b](https://github.com/faisalkhan91/Fluxus/commit/0afc52b4bdaac10f539b7be57ee758ca0a0d584c))
* update Docker and NGINX configurations ([413713f](https://github.com/faisalkhan91/Fluxus/commit/413713fa2ad449f702870f7d1d81edee9d36d3a6))
* Update Docker publish workflow actions to latest versions ([7037b30](https://github.com/faisalkhan91/Fluxus/commit/7037b3039365b8c99eabb28e480d002aae21fdfe))
* Update Docker publish workflow to checkout Homelab monorepo and update Kubernetes manifest with new image tag ([9ece076](https://github.com/faisalkhan91/Fluxus/commit/9ece0762b8f8913ff0f83fb55f74cf5781a70d77))
* Update Dockerfile and package-lock.json for Angular 24 compatibility ([0805d5a](https://github.com/faisalkhan91/Fluxus/commit/0805d5a1c899fcfd5dae366cfb6c0c2868488cb9))
* Update Karma configuration to allow empty test suites ([a918791](https://github.com/faisalkhan91/Fluxus/commit/a918791c5be364ddec84916d76ad89dbc9b77021))
* Update live link in README to point to new domain ([b41c7e9](https://github.com/faisalkhan91/Fluxus/commit/b41c7e9f706b4866f7c7443fbbb8bcfaabba9e14))
* update package dependencies and enhance profile descriptions ([501d4da](https://github.com/faisalkhan91/Fluxus/commit/501d4dab4190a75ed0e83bc29c1b65b0b7f614f4))
* update package-lock.json and refine experience descriptions ([878a11b](https://github.com/faisalkhan91/Fluxus/commit/878a11b6f25045af88aae4561bf7114a5625a108))
* Update package-lock.json version to 1.1.0 and optimize CSS imports ([6451f2b](https://github.com/faisalkhan91/Fluxus/commit/6451f2b45dd83e1be4ae0146d767ed9c07fbe6f5))
* Update README and CHANGELOG for Angular 21 migration and new features ([dddf018](https://github.com/faisalkhan91/Fluxus/commit/dddf018e17ee849868e8b627dcff60360eb85224))
* update TypeScript version and remove unused Angular dependency ([2009d51](https://github.com/faisalkhan91/Fluxus/commit/2009d512b0a5ed94e2288fbf98afc88c7e8a8768))
* Update version to 1.1.0 for Angular 18 release ([0ddcff8](https://github.com/faisalkhan91/Fluxus/commit/0ddcff88995b7b947a5cf37bb558a3b4019eb86c))
* Upgrade Angular dependencies to version 18 and update TypeScript configuration ([1a37993](https://github.com/faisalkhan91/Fluxus/commit/1a37993831b91c12cf5af3b4b717e999ac5772ad))


### Refactoring

* assertNever guard on ProjectSort + CommandKind switches ([9afb8bc](https://github.com/faisalkhan91/Fluxus/commit/9afb8bcd4b6b8c7dbdddf43ed72a4b9465488fc8))
* **blog-post:** cancel pending UI-reset timers on destroy ([08fd096](https://github.com/faisalkhan91/Fluxus/commit/08fd0967438dca2544a5a5d0ca5b351b3a5b4680))
* **blog-post:** extract BlogPostSeoService for head writes ([dbdfb38](https://github.com/faisalkhan91/Fluxus/commit/dbdfb3828dc7bfc083ef602aa9499efade3fb2fc))
* **blog-post:** extract MermaidService for the diagram lifecycle ([3529847](https://github.com/faisalkhan91/Fluxus/commit/3529847462843d534da2973bc61965d9a59c43a8))
* **blog-post:** pin reading-progress JS fallback to document root ([d731dc6](https://github.com/faisalkhan91/Fluxus/commit/d731dc6eeb0634f810571bb0ff4f0fe718edf866))
* **blog:** explicit return types on BlogService computed signals ([d90f6da](https://github.com/faisalkhan91/Fluxus/commit/d90f6da7c90515d8d0e9e50b265552f6d5bfae5c))
* **bottom-sheet:** remove bottom sheet component and associated styles ([c143701](https://github.com/faisalkhan91/Fluxus/commit/c143701e94cfd3af81edc606ce759eb480c9adc1))
* **command-palette:** extract CommandCatalogService ([512151d](https://github.com/faisalkhan91/Fluxus/commit/512151d6b852a2de7927bdc71b529f77eff45dc4))
* **error-handler:** typed sentry field instead of double cast ([2e01175](https://github.com/faisalkhan91/Fluxus/commit/2e011759716ce50f2d5cbbb908e91d7650f47845))
* **experience-data:** enhance clarity and conciseness of experience descriptions ([fc61867](https://github.com/faisalkhan91/Fluxus/commit/fc6186772594652bf9c7a62da953e954af20eb62))
* **experience-data:** further enhance clarity and conciseness of experience descriptions ([e01ffe7](https://github.com/faisalkhan91/Fluxus/commit/e01ffe7d4dfd272af162daa5e3f161eba7fbc542))
* **github-meta:** const-guard the rel() optional, drop !. ([7c24862](https://github.com/faisalkhan91/Fluxus/commit/7c248629222c376ff5e21a020a1173c49181a7a5))
* hoist prefers-reduced-motion check to motion.utils.ts ([c2764d0](https://github.com/faisalkhan91/Fluxus/commit/c2764d0f5965f70b87b7a8578850d8b716eebd7a))
* hoist URL shapes for blog/project routes to url.utils.ts ([0fca681](https://github.com/faisalkhan91/Fluxus/commit/0fca681cd29648299a10df98c8c8411d8ed44d8e))
* **main:** remove unnecessary comments from main application entry point ([a4d7a07](https://github.com/faisalkhan91/Fluxus/commit/a4d7a07d3fbe26d40d1a43b8f2796c9a977bfb49))
* **navigation:** enhance mobile menu structure with dividers and improved item types ([05734e9](https://github.com/faisalkhan91/Fluxus/commit/05734e9af4282ecb0629684772eb730355a0d81c))
* **navigation:** update routing and navigation structure for improved clarity ([3124154](https://github.com/faisalkhan91/Fluxus/commit/3124154350b79af23a78c31cfee66b2a5229e48b))
* portfolio audit remediation (SEO, a11y, SSR, UX) ([d2cbee5](https://github.com/faisalkhan91/Fluxus/commit/d2cbee5dc346a029b48d90aabb1c05860bdcb4a8))
* **projects:** dedupe GitHub meta render + formatters ([be30f23](https://github.com/faisalkhan91/Fluxus/commit/be30f232c1b77c76bde20edb9d4afb329fa5bd22))
* **projects:** drop language-color stripe from cards + detail ([78ef729](https://github.com/faisalkhan91/Fluxus/commit/78ef729973491e0e5489a1daf7a35ee9b38bb950))
* **projects:** replace ::ng-deep with --glass-card-padding override ([b91ea8a](https://github.com/faisalkhan91/Fluxus/commit/b91ea8a74103fa8cdfafaabc34deee41973fbb03))
* Relocate all FluxusUI files to the root directory ([7855150](https://github.com/faisalkhan91/Fluxus/commit/785515058fff117a28e8c5812956c0701990ba12))
* round-2 audit remediation (bundle split, icon SSR, mobile layout) ([ec18f63](https://github.com/faisalkhan91/Fluxus/commit/ec18f6323b7de71cde881480e93e817f986c13aa))
* **scripts:** dedupe slugify into scripts/lib/projects.mjs ([c4a9f3e](https://github.com/faisalkhan91/Fluxus/commit/c4a9f3ea6dc6c1e0e9b46022f43f3b0f28a1ba64))
* **scripts:** use shared slugify instead of duplicating tagSlug ([b58e274](https://github.com/faisalkhan91/Fluxus/commit/b58e274d7fc3b2877f2074dc99bb8802cecda8ab))
* **seo,hero,test:** dedupe setCanonical + tidy branch housekeeping ([6781fc7](https://github.com/faisalkhan91/Fluxus/commit/6781fc7c88218732d33fb0cca93358862bffde42))
* **seo:** dedupe updateMetaTags into SeoService.updateDynamicMeta ([37acb3d](https://github.com/faisalkhan91/Fluxus/commit/37acb3d5ffc1764f42e1e65b29ddfb224e187347))
* **sidebar:** convert manual unsubscribe to takeUntilDestroyed ([7363dde](https://github.com/faisalkhan91/Fluxus/commit/7363ddeacccafd651d26412c0f98c690b0742c27))
* **skills:** enhance skills component with media query support and dynamic badge display ([6221210](https://github.com/faisalkhan91/Fluxus/commit/6221210689acc95058aa91863b6d6264a54627c3))
* **skills:** restructure skills categories and enhance UI interactions ([a7c1314](https://github.com/faisalkhan91/Fluxus/commit/a7c131422c59ec86b355051a1170f9c9bc950bf9))
* **tag-pages:** use named-args for updateMetaTags so slug/label can't swap ([a7c626a](https://github.com/faisalkhan91/Fluxus/commit/a7c626ae1ba935b339674868a912eb08ea158472))
* tighten updateIndicator/updateFades visibility to private ([1e51c84](https://github.com/faisalkhan91/Fluxus/commit/1e51c84374c6d7bffc82b2aaae19fef150cab0d8))
* **timeline:** update entry details layout and styling ([d8b05a3](https://github.com/faisalkhan91/Fluxus/commit/d8b05a3fe5516493fecd6a8956cee30e8af1be60))
* update Angular configuration and testing setup ([6ab8573](https://github.com/faisalkhan91/Fluxus/commit/6ab8573154b0af86ba5da34017ce0af360627a22))
* Upgrade Angular dependencies and restructure application setup ([f077b83](https://github.com/faisalkhan91/Fluxus/commit/f077b83790f113e3ca03dbe7f7e69bd957252e4d))
* **web-vitals:** track scheduleIdle handle in tagged union ([3738b1b](https://github.com/faisalkhan91/Fluxus/commit/3738b1bd319b9cb2ad2477981bc960eb2acb3cfc))


### Performance

* **about:** add priority hint to avatar image for LCP ([00e7f1a](https://github.com/faisalkhan91/Fluxus/commit/00e7f1ab2de69ee62ffcbfad48281f0a968f7a90))
* **blog:** swap Date.getTime sort comparator for ISO string compare ([6b22ef5](https://github.com/faisalkhan91/Fluxus/commit/6b22ef58e4222c56be811d21a979a985381c272a))
* **scripts:** batch fetchParticipation calls (5-way concurrent) ([5fba9e1](https://github.com/faisalkhan91/Fluxus/commit/5fba9e10c4a085bfcf1ca5fcc52419b713972a36))
* **scripts:** parallelise OG card rasterisation ([2d58b32](https://github.com/faisalkhan91/Fluxus/commit/2d58b327a578971f5fd9a3bc73d1401af9db65ac))
* **skills:** memoize visibleSkills as a computed Map ([f9fad8e](https://github.com/faisalkhan91/Fluxus/commit/f9fad8ef26f8ef6bbff734fbe179abd62bb6be19))


### Documentation

* **audit:** rendering audit 2026-04 ([6a120fd](https://github.com/faisalkhan91/Fluxus/commit/6a120fdb31be0d03fc8d37b02fbb9ea273683266))
* **best-practices:** note verbatimModuleSyntax requirement ([ab23d14](https://github.com/faisalkhan91/Fluxus/commit/ab23d1429edb85cea9606eb02ba96d3db113b90b))
* **ci,readme:** reflect GitHub-topic project pipeline ([bda3747](https://github.com/faisalkhan91/Fluxus/commit/bda37478b39211be224971d4ae3fe5cefc3ede80))
* header for inject-meta.mjs + JSDoc on TabService public API ([b415e92](https://github.com/faisalkhan91/Fluxus/commit/b415e92e6e111ef9534d4699b9726cd51a3ec405))
* **readme:** add Notable implementation details section ([5dd2086](https://github.com/faisalkhan91/Fluxus/commit/5dd2086dc206845d03946120c59661b73d30b123))
* **readme:** align test count + Node version with package.json reality ([506759f](https://github.com/faisalkhan91/Fluxus/commit/506759fa0c7ccdad7eb7f42fdb40b52dfabf52f3))
* Revamp README.md to enhance project description, features, tech stack, and setup instructions ([da9656f](https://github.com/faisalkhan91/Fluxus/commit/da9656f2ec34f11d2b927eb70af89243a3b89f4a))
* **tabs:** record why Cmd/Ctrl+W close cannot be implemented ([14efbec](https://github.com/faisalkhan91/Fluxus/commit/14efbec6a6a3a0b91b124c47a2c69fed9538e425))

## [3.1.0](https://github.com/faisalkhan91/Fluxus/compare/v3.0.0...v3.1.0) (2026-05-19)

Eleven audit rounds of accessibility, SEO, security, theme, and refactor work,
plus four new blog posts and a connective Skills hub. No breaking changes —
every public surface stays compatible with v3.0.0.

### Features

- **themes:** multi-theme registry with palette picker and last-by-scheme toggle; swap Dracula/Gruvbox for Night Owl, Horizon, GitHub Light, Ayu Dark, and Rose Pine; cross-fade body + html on switch; OKLCH scope plugged; pre-paint script keeps `data-theme` set before first paint
- **projects:** GitHub becomes source-of-truth for the catalog; new `/projects/:slug` detail page with README excerpt + 52-week sparkline; `/projects/tag/:slug` archives; sort controls with sliding active indicator; list+grid views with shared card chrome; tag chips deep-link to skill anchors
- **skills:** Skills page becomes a connective hub — per-skill `#skill-<slug>` anchors, tier + tagline metadata, feature strip + uniform grid + list view, view-transition between Grid↔List, monochrome brand SVGs render correctly on dark themes
- **palette:** project entries scroll to the matching card; theme-prefix queries; pointer-modality-aware footer hints; arrow-key navigation scrolls the active option into view (WCAG 2.4.8)
- **a11y:** focus moves to `#main-content` on every route nav; `aria-busy` + `role="status"` on async blog post fetch; `aria-disabled` mirrors `disabled` on every glow-button (iOS VoiceOver parity); `aria-live="assertive"` on contact form errors; WARNING / CAUTION callouts emit landmark regions; forced-colors safety net for icon chrome and focus rings; roving tabindex on radiogroup toggles; tag-pill targets ≥24 px (WCAG 2.2 SC 2.5.8); `inert` on background while modals are open
- **seo:** Article + BreadcrumbList JSON-LD on `/projects/<slug>` (was missing entirely); CollectionPage on tag archives; BlogPosting enriched with `wordCount` + `articleSection`; `og:locale="en_US"` on every prerendered page; `og:image:width/height/type` for the default OG card; `twitter:image:alt` on every social-card branch
- **mobile:** identity header in drawer with 44×44 close target; drawer footer with palette + theme picker + resume; collapsible TOC under 1280 px; iOS edge-to-edge viewport via `viewport-fit=cover`; `.ext` chips render in the drawer; 16 px input font kills iOS auto-zoom on focus
- **pwa:** Apple PWA meta tags wired for iOS standalone mode; webmanifest gets `purpose: maskable`, `scope`, and `categories`
- **tabs:** middle-click closes tabs (universal editor convention); `[attr.title]` surfaces the full label on truncation
- **app-update:** sticky toast warns active readers before the deferred reload swap
- **content:** Reporting Pipeline Notes 3-post series + Storage Foundation post; editorial pass on existing posts (catchier titles + readability); 96 px thumbnails on non-featured + tag-archive cards

### Bug Fixes

- **seo:** clear robots tag on every navigation (closes a real noindex-bleed bug); `noindex,nofollow` on SPA-nav 404s, project-detail invalid-slug fallback, draft + future-dated posts; canonical trailing-slash matches the prerendered HTML; preserve root canonical trailing slash
- **csp:** tighten with `object-src 'none'`, `upgrade-insecure-requests`, `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Resource-Policy: same-origin`; markdown link walker neutralises `javascript:` URIs; attribute-injection defence on alt / title / href
- **a11y / privacy:** `rel="noreferrer"` on every external `_blank` link; explicit `aria-live="assertive"` on form errors; tab-pill targets ≥24 px; `--link-color` token clears AA on dark crimson; respect `prefers-reduced-motion` in heading-permalink scroll
- **prose:** inline code wraps inside the token on narrow viewports (`overflow-wrap: anywhere`)
- **print:** explicitly disable all animation + transition
- **theme:** `scrollbar-color` + `scrollbar-width` for Firefox parity; mirror active theme scheme to `:root color-scheme`; guard every localStorage call against Safari private mode
- **mobile:** close drawer on `NavigationStart` (Android back parity); drawer footer flex-shrink + active-route auto-scroll; copy button visible on touch with 24×44 hit area; toast region above the floating nav pill; clear iPhone safe areas on toast + reading-progress bar; standardise mobile breakpoint at 767 px to match `MOBILE_MAX`
- **mermaid:** cross-fade placeholder → rendered SVG; coalesce concurrent renders + cancel deferred handles; expose `cancel()` for component destroy
- **tab-bar / palette / hero:** indicator teleport suppressed on first hydration; palette restores focus to its trigger on close; hero cross-fades skeletons → cards on `@defer` hydration
- **blog-post:** cover `sizes` uses viewport-relative units (fixes NG02952); reading-progress bar excluded from route view-transition
- **contact:** guard `onSubmit` re-entry while stage transitions; cancel `emailCopied` reset on destroy + double-tap
- **markdown:** catch `marked.parse()` exceptions instead of bubbling; emit literal `hljs` span markup for known languages
- **sw:** cache prerendered routes + align index path + drop dead glob
- Also: blog mobile non-featured cards stack like featured; certifications Home/End scroll on the cert rail; web-vitals `cancel()` actually used; SSR `posts.json` parse errors surfaced; `BlogService.posts` made signal-graph-aware of "today" gate

### Refactoring

- hoist `prefersReducedMotion()` to `motion.utils.ts` (4 callsites unified)
- hoist URL shapes for blog/project routes to `url.utils.ts` (10 callsites unified)
- extract `CommandCatalogService` from the palette; `MermaidService` owns diagram lifecycle; `BlogPostSeoService` owns head writes; `SeoService.updateDynamicMeta` deduped
- enable `verbatimModuleSyntax` + 70 type-only import fixes
- explicit return types on `BlogService` computed signals; `assertNever` guard on `ProjectSort` + `CommandKind` switches; typed sentry field replaces a double-cast; named-args for tag-page `updateMetaTags` so slug / label can't swap
- sidebar manual unsubscribe → `takeUntilDestroyed`; `--glass-card-padding` override replaces `::ng-deep`
- scripts dedupe `slugify` into `scripts/lib/projects.mjs`

### Performance

- memoize `visibleSkills` as a computed `Map`
- ISO-string sort comparator beats `Date.getTime` for date sorts
- avatar gets `priority` LCP hint
- batch GitHub `fetchParticipation` (5-way concurrent); parallelise OG card rasterisation
- add `anyScript` budget to gate lazy-chunk regressions

### Documentation

- README: "Notable implementation details" section (site.config, themes, `verbatimModuleSyntax`, mobile / iOS); align test count + Node version with `package.json` reality
- `.ai/best-practices.md`: note `verbatimModuleSyntax` requirement
- `inject-meta.mjs`: header docstring; `TabService`: JSDoc on public API
- tabs: record why Cmd/Ctrl+W close cannot be implemented (browser reservation)

### Build / Miscellaneous

- pin `.browserslistrc` to a modern evergreen baseline
- declare `"license": "MIT"` in `package.json`
- surface favicon + resume generator scripts as npm tasks
- `audit-csp` emits a CI-greppable `✓ csp-audit: pass` / `✗ csp-audit: fail` summary line
- `build-feed` + `build-sitemap` byte-stable sort (slug tiebreaker, project tag/detail sorted)
- escape URL interpolation in `build-feed`; fail-fast `dist/` check in `build-sitemap`
- `sync-reading-times` exposes `wordCount` for `inject-meta` consumption

### Tests

- 665 specs pass (~600 baseline); 50+ new regression specs across the audit rounds
- new coverage: attribute-injection defence, Safari private-mode storage recovery, mermaid revert path, web-vitals lifecycle, `BlogPostSeoService` URL builder, `SeoService.setLinkRel`, route-nav focus, command palette `scrollIntoView`, contact `onSubmit` re-entry guard
- hygiene: `vi.restoreAllMocks()` discipline across `tab.service`, `clipboard.utils`, `app-update.service`; consolidated timer reset; e2e visual baselines refreshed for new themes + `/projects` + hero

## [3.0.0](https://github.com/faisalkhan91/Fluxus/compare/v2.4.0...v3.0.0) (2026-04-27)


### ⚠ BREAKING CHANGES

* comprehensive accessibility, security, and infrastructure overhaul

### Features

* Add adjacent post navigation and reading progress indicator to blog post component ([01ae611](https://github.com/faisalkhan91/Fluxus/commit/01ae611a554eb24861c3b12c3ea2e85300e084d4))
* Add adjacent post navigation and reading progress indicator to blog post component ([4e8c342](https://github.com/faisalkhan91/Fluxus/commit/4e8c342dfdad2404ad99d2930d346c5b017de3bc))
* Add blog feature with routing and styling enhancements ([55e33a6](https://github.com/faisalkhan91/Fluxus/commit/55e33a696f404f579803b495129715c0555b50c7))
* Add custom Nginx configuration for SPA routing in Dockerfile ([503094d](https://github.com/faisalkhan91/Fluxus/commit/503094d50c23fa1505374fd0895f73d7eaf46e22))
* Add new blog post on Angular Signals state management ([00c07ad](https://github.com/faisalkhan91/Fluxus/commit/00c07ad18560a42a86faf04d26411f10ea88c86d))
* add path mapping for module imports and update environment references ([dd64f45](https://github.com/faisalkhan91/Fluxus/commit/dd64f450d42f3e4bcb5b1aa839840a4e5f113abe))
* audit ([29fd9e0](https://github.com/faisalkhan91/Fluxus/commit/29fd9e00565a8a85d3bba6c45cb801fecfbe20ef))
* Audit and new version. ([2ea240e](https://github.com/faisalkhan91/Fluxus/commit/2ea240e2b070c332c9999f64202d3a3773311c0b))
* audit patch source ([e700cf2](https://github.com/faisalkhan91/Fluxus/commit/e700cf21eef5101a239fe3f72bcd9138804fb8e0))
* **blog:** add homelab storage architecture post ([da06567](https://github.com/faisalkhan91/Fluxus/commit/da0656739366796c26d872ef641f8e2a0e559127))
* **blog:** correct image mapping and add all assembly photos ([38a2296](https://github.com/faisalkhan91/Fluxus/commit/38a2296beb897086cb9b0902c533b6ab9d5469ef))
* **blog:** polish Subscribe button + add dev spot-check path for feed builder ([16644a5](https://github.com/faisalkhan91/Fluxus/commit/16644a5351d1f1a9632f97f3602cca5c26f6b9fb))
* **blog:** publish storage foundation and freshness posts ([be8d256](https://github.com/faisalkhan91/Fluxus/commit/be8d256b39ce86a11ea6cb786bb41c02e070ff9c))
* **ci:** publish blog content updates without a semver release ([e64138f](https://github.com/faisalkhan91/Fluxus/commit/e64138ff43ada79f2dab96784318c16fd5843444))
* comprehensive portfolio remediation pass ([c21738d](https://github.com/faisalkhan91/Fluxus/commit/c21738dbe7404f49bc5b59683fccc85a4e6d557a))
* Enhance Angular configuration and improve server-side rendering support ([ca045b8](https://github.com/faisalkhan91/Fluxus/commit/ca045b8d2f1473c8ab8075bdeace788c7fcb21e3))
* Enhance navigation and tab functionality with new home link and close tab logic ([f369a69](https://github.com/faisalkhan91/Fluxus/commit/f369a699907e467b2786535326854093144b48f6))
* Enhance SEO and accessibility features across the application ([561b70c](https://github.com/faisalkhan91/Fluxus/commit/561b70c7a5a84cdee38fb38ce565e5a197c81f23))
* Enhance SEO and styling across the application ([d9e9c96](https://github.com/faisalkhan91/Fluxus/commit/d9e9c96660838c15d4667cc1912d685d2943af8c))
* Enhance SEO and styling across the application ([02cc35b](https://github.com/faisalkhan91/Fluxus/commit/02cc35bab5374b0dfffa5247efae82739e5a1d48))
* Enhance styling and functionality across various components ([a3b965d](https://github.com/faisalkhan91/Fluxus/commit/a3b965dfe6b5eb635664bb68c87bdc3f2767d1cc))
* Experience and Navigation Upgrades ([931f69b](https://github.com/faisalkhan91/Fluxus/commit/931f69baecee749792ca5f3a480d244cc4530ec7))
* force release pipeline to trigger ([7d5b4c0](https://github.com/faisalkhan91/Fluxus/commit/7d5b4c0256f9481e3380466dca7cbe2b056cc1f4))
* **hero:** layered boot sequence + pointer parallax + token shimmer ([6af886b](https://github.com/faisalkhan91/Fluxus/commit/6af886b97963dd255f054896d824e02425644b34))
* Improve icon component to handle server-side rendering ([489c8e0](https://github.com/faisalkhan91/Fluxus/commit/489c8e0a836924c74d0f55c33781715819f39318))
* Improve user profile and SEO details for enhanced visibility ([7e23b2a](https://github.com/faisalkhan91/Fluxus/commit/7e23b2a549de5c49135aefeab47dbdd80f926168))
* Major config changes ([a710005](https://github.com/faisalkhan91/Fluxus/commit/a710005c033a41926d858d406196b3f563c0fbf2))
* **motion:** land motion audit 2026-04 + tab-tightness + cleanup ([6a00746](https://github.com/faisalkhan91/Fluxus/commit/6a007460074f7a3523ef5f8fff5f89f88582a2df))
* New blog post ([aea1340](https://github.com/faisalkhan91/Fluxus/commit/aea1340ee481738f7a1b3f36b0f005cda3b32fab))
* new blog! ([3132e58](https://github.com/faisalkhan91/Fluxus/commit/3132e5828ab0ec9450a3bab078b8f2b69674e7ef))
* Optimize Angular build and enhance NGINX configuration ([165ba6a](https://github.com/faisalkhan91/Fluxus/commit/165ba6ac74f432a1c3ea7d8f3efb88847f21761b))
* rendering and animations ([1074c6c](https://github.com/faisalkhan91/Fluxus/commit/1074c6c6cdc5a7bab03ff6808e54ca72e218bcad))
* **rendering:** land rendering audit 2026-04 implementation ([762ad50](https://github.com/faisalkhan91/Fluxus/commit/762ad50470bd993ba399b19e266656f765bdd9e0))
* round-3 architect upgrades + blog UX polish ([a75eb91](https://github.com/faisalkhan91/Fluxus/commit/a75eb917eea59efffcd8c7b420ad76f5115e867d))
* update Angular configuration and dependencies, enhance blog features ([b883a9e](https://github.com/faisalkhan91/Fluxus/commit/b883a9e52887c669cc46f79331188a5dbb1ad0dc))
* Update profile and SEO details to reflect senior role and experience ([8d38c25](https://github.com/faisalkhan91/Fluxus/commit/8d38c2596939ec4c04b5b836d9c25b020d2fcaa9))
* v2.0 -- full best-practices audit, test coverage, and CI/CD hardening ([53cf408](https://github.com/faisalkhan91/Fluxus/commit/53cf40893776c5ca34fc7089bcfa69084058148a))


### Bug Fixes

* **audit:** escape hostname dots in prerender audit regexes ([b179058](https://github.com/faisalkhan91/Fluxus/commit/b179058fe2254d54111e5da919529901299e2ac0))
* **blog:** featured cover overflow + tighten list entrance jank ([7afd529](https://github.com/faisalkhan91/Fluxus/commit/7afd529844264b082cc5839528dd1a368139db5c))
* **blog:** update cover image for motion audit post ([8574bfc](https://github.com/faisalkhan91/Fluxus/commit/8574bfccba8d2c318767c8dd3d9e8661b4f77db3))
* **blog:** update image paths to be relative ([621b6cc](https://github.com/faisalkhan91/Fluxus/commit/621b6cc1b508315accdbba8a4ca9ba99c16fb5f2))
* **blog:** use [@starting-style](https://github.com/starting-style) for entrance to kill Firefox FOUC ([db92105](https://github.com/faisalkhan91/Fluxus/commit/db92105a5c8d5a2fefdbbe181295590f5e704207))
* **build:** resolve Windows path issues in image-dims script ([86dd060](https://github.com/faisalkhan91/Fluxus/commit/86dd0609d8304fe5ffaff9885bb57f6a276c526e))
* **changelog:** correct version comparison links and update README for routing changes ([86e3d15](https://github.com/faisalkhan91/Fluxus/commit/86e3d15d217223f77d25702e0b909e606556f117))
* **changelog:** remove unnecessary whitespace and align bug fix entries ([5b1bc08](https://github.com/faisalkhan91/Fluxus/commit/5b1bc0897642bc2eee1de13e78474ffb526e1f72))
* **ci:** update lighthouse-ci-action to correct SHA for v12.1.0 ([746baaf](https://github.com/faisalkhan91/Fluxus/commit/746baafbe7845acd54a43c4bd894e434fe0fa57d))
* **ci:** use verified SHA for lighthouse-ci-action v12.1.0 ([b641002](https://github.com/faisalkhan91/Fluxus/commit/b6410026a0bcb3f574eac96828a261165052429e))
* **core:** bootstrap application and core runtime initialization logic ([9e3e0a3](https://github.com/faisalkhan91/Fluxus/commit/9e3e0a3b37dbcb25094699323a54f462493b88b0))
* **feed:** honour post.updated on &lt;updated&gt; + use type=text on summary ([f2409b9](https://github.com/faisalkhan91/Fluxus/commit/f2409b9ee4fb2bdfe5c470c78269924414ec9c37))
* force release pipeline to trigger ([814a3a8](https://github.com/faisalkhan91/Fluxus/commit/814a3a80e48dde63b7e7e9586ab64d5db1680503))
* **image:** upgrade base packages and update trivy-action to v0.36.0 ([6bd1990](https://github.com/faisalkhan91/Fluxus/commit/6bd19906c5a279c72d453d745268b3e3b405dd41))
* **image:** upgrade base packages and update trivy-action to v0.36.0 ([f201b98](https://github.com/faisalkhan91/Fluxus/commit/f201b987abfc3ddbb3941f596c2eb3c292017443))
* **layout:** centre collapsed sidebar footer buttons and align mobile heading anchors ([a097b45](https://github.com/faisalkhan91/Fluxus/commit/a097b45a0a51004939c8ec662c9545a86dc1851b))
* **layout:** hide heading permalink anchor on mobile to keep heading text anchored to the column edge ([eee00ac](https://github.com/faisalkhan91/Fluxus/commit/eee00acd72197a470540dea3bbeedd2a5d80f52e))
* remove obsolete CI error fix patch and update Karma configuration ([93bebe2](https://github.com/faisalkhan91/Fluxus/commit/93bebe2e51d855ef2cde94978531c3c009e5558a))
* Remove unnecessary peer dependencies from package-lock.json ([60ad0b6](https://github.com/faisalkhan91/Fluxus/commit/60ad0b6e9a661b0e440016099c820d820fbac699))
* Removed patch files ([8c875dc](https://github.com/faisalkhan91/Fluxus/commit/8c875dc94cd2d28a46f19e0e413566efe2a5daf6))
* resolve CI lint errors and setup-node deprecation ([bdf4418](https://github.com/faisalkhan91/Fluxus/commit/bdf441858ea36cd8055cf36e705952dba656a2f1))
* resolve SSR NotYetImplemented error in IconComponent ([44eef70](https://github.com/faisalkhan91/Fluxus/commit/44eef70e1210d746408f76e0aeb66e315320576e))
* **security:** ignore known base image vulnerabilities in Trivy scan ([26f705e](https://github.com/faisalkhan91/Fluxus/commit/26f705ee7021c7e0a16191b45d9707fb04867765))
* **sidebar:** anchor collapsed-state icons via padding so they stay in the 60 px rail ([e141a65](https://github.com/faisalkhan91/Fluxus/commit/e141a6575f7f57c19dd48af8c413db0848330143))
* **sidebar:** hide labels in tablet [@media](https://github.com/media) so collapsed icons stay visible ([6893a14](https://github.com/faisalkhan91/Fluxus/commit/6893a14bcbaf62eb89df9924a48bef6c7350c739))
* **sidebar:** shrink collapsed footer buttons to icon-button width so chrome fits the 60 px rail ([846f153](https://github.com/faisalkhan91/Fluxus/commit/846f153b98656647e28694e7149a1de75a2bd5b4))
* suppress CVE-2026-28390 in .trivyignore ([b5f2555](https://github.com/faisalkhan91/Fluxus/commit/b5f2555c31bac134b63dd6a3c42322ce51ae5c8a))
* suppress CVE-2026-28390 in .trivyignore ([b0a31c1](https://github.com/faisalkhan91/Fluxus/commit/b0a31c1c44f31f2e310631199c1172c3adf3a71e))
* **sw:** activate new app versions at next safe navigation boundary ([5ca7aaf](https://github.com/faisalkhan91/Fluxus/commit/5ca7aaf85b0ec7e6ac5ee9d807cf5209033e8b3e))
* **test:** resolve Playwright focus-trap collision, a11y, and timing failures ([d7c7199](https://github.com/faisalkhan91/Fluxus/commit/d7c71992b450dd5cca43a73874844b4eab0c17e6))
* Update project name and paths after relocation ([7c423c7](https://github.com/faisalkhan91/Fluxus/commit/7c423c70b0caeaf3b35e2f4776f8c807de2e6578))


### Miscellaneous

* **build:** clear lingering errors, warnings, and pre-existing test debt ([38d8fe9](https://github.com/faisalkhan91/Fluxus/commit/38d8fe9f1d7d68af881ac2f2230cb8ab0b094f8e))
* Bump version to 1.0.0 and update README for Angular 18 enhancements ([7645739](https://github.com/faisalkhan91/Fluxus/commit/7645739ff99aec39c35b6c70bb92a4b31405485b))
* bump version to 2.2.2 ([25e240f](https://github.com/faisalkhan91/Fluxus/commit/25e240f655a48d8f197d4109ca42a237e2beb2ab))
* **changelog:** synchronize production build and deployment pipeline state ([ca9f1f8](https://github.com/faisalkhan91/Fluxus/commit/ca9f1f84758e808f541a762a4aae8fde5fb3805f))
* **changelog:** trigger production build and deployment ([a0b22d0](https://github.com/faisalkhan91/Fluxus/commit/a0b22d0584d55ddbc498ebb4467ecbce288c4c86))
* **ci:** document new CI/CD topology and add GHCR retention ([0d388d2](https://github.com/faisalkhan91/Fluxus/commit/0d388d249a812d45d997a30fc3b31aaca398d4fe))
* **ci:** rebuild GitHub Actions for security, simplicity, and PR-based GitOps ([5248249](https://github.com/faisalkhan91/Fluxus/commit/52482493a98b387cab602c4342525a5d7d0ee9a3))
* Clean up package-lock.json by removing unused dependencies ([99bc6ab](https://github.com/faisalkhan91/Fluxus/commit/99bc6abd60568dcd86a652eda89a9ff3629b5e07))
* **deps-dev:** bump typescript-eslint ([580a520](https://github.com/faisalkhan91/Fluxus/commit/580a520f48f3263548e1b7a809df23c5a6949830))
* **deps-dev:** bump typescript-eslint from 8.56.1 to 8.59.0 in the eslint group across 1 directory ([9721b46](https://github.com/faisalkhan91/Fluxus/commit/9721b469aeae0adfc56a5d949ae038cac980c976))
* **deps:** bump docker/build-push-action from 7.0.0 to 7.1.0 ([eda252c](https://github.com/faisalkhan91/Fluxus/commit/eda252c8684e548ee42a229894d8fc39656213cc))
* **deps:** bump docker/build-push-action from 7.0.0 to 7.1.0 ([be045ae](https://github.com/faisalkhan91/Fluxus/commit/be045aeae954043b9ec6eae7adbb45e0feb30e35))
* **deps:** bump docker/login-action from 4.0.0 to 4.1.0 ([3b5cd47](https://github.com/faisalkhan91/Fluxus/commit/3b5cd47276eb9262ebdb53440a6b8fb4e950b1c2))
* **deps:** bump docker/login-action from 4.0.0 to 4.1.0 ([2b67aaf](https://github.com/faisalkhan91/Fluxus/commit/2b67aaf9cfa7ceffb66dc251628aa980b8f744eb))
* **deps:** bump nginxinc/nginx-unprivileged ([59f3a8f](https://github.com/faisalkhan91/Fluxus/commit/59f3a8f18a80bdba69103d91f47e1059d70faa56))
* **deps:** bump nginxinc/nginx-unprivileged from 1.27-alpine to 1.29-alpine ([11cb7c0](https://github.com/faisalkhan91/Fluxus/commit/11cb7c0a23003b2d3632aabf1f03e5a664dfb345))
* **deps:** tighten dependabot grouping and ignore deferred majors ([b79b988](https://github.com/faisalkhan91/Fluxus/commit/b79b98876a5b56f33151588fb35a6a0b1d4b8733))
* enhance blog post error handling and update styles ([570da60](https://github.com/faisalkhan91/Fluxus/commit/570da60d18ffaa321ab713e3e21b55d7899bc4f6))
* Fix dependency version conflicts for Angular packages ([9350fa1](https://github.com/faisalkhan91/Fluxus/commit/9350fa1444c7c47767a0b6ffc845be83bf18f1a4))
* force release and update CI configurations ([5bc2cab](https://github.com/faisalkhan91/Fluxus/commit/5bc2cab90152a1905f0879418970b7069ec4cefe))
* force version to 2.0.0 and fix tag prefix ([9e17c39](https://github.com/faisalkhan91/Fluxus/commit/9e17c3954558df317829dec1bb5701fd0aefcc0c))
* format release-please-config.json to appease prettier ([9978334](https://github.com/faisalkhan91/Fluxus/commit/9978334ed2d5592c12b516f52b6e68e8463449f0))
* **format:** apply prettier sweep flushed by broader lint scope ([55b3ac7](https://github.com/faisalkhan91/Fluxus/commit/55b3ac771e27271918d59f4bcd1b4b60a2cbe113))
* **format:** global prettier sweep to normalize line endings and styles ([205d66b](https://github.com/faisalkhan91/Fluxus/commit/205d66b7000199fb9b9dc4861e565248e544dc6e))
* **format:** trim trailing spaces in homelab-storage-foundation table ([d1fa758](https://github.com/faisalkhan91/Fluxus/commit/d1fa7585ca3c098a1762dd64a6f36b98a0fa5853))
* **lint:** fold prettier --check into npm run lint ([4f6c961](https://github.com/faisalkhan91/Fluxus/commit/4f6c961b2dba7fd85406232c297bf59243cbc70a))
* **main:** release 1.2.0 ([c324843](https://github.com/faisalkhan91/Fluxus/commit/c3248435533e0847ea5f7e355438e29129ba3983))
* **main:** release 1.2.0 ([9d38268](https://github.com/faisalkhan91/Fluxus/commit/9d38268bc4e1ca862a196ab094a12b25bae88fac))
* **main:** release 1.2.1 ([5c5e69b](https://github.com/faisalkhan91/Fluxus/commit/5c5e69b7cd4642e28c2d01c9503e721da67f67f6))
* **main:** release 1.2.1 ([ee1e48a](https://github.com/faisalkhan91/Fluxus/commit/ee1e48ad4e7167cc845b726f809e73ac58476d8e))
* **main:** release 1.2.2 ([21a21f0](https://github.com/faisalkhan91/Fluxus/commit/21a21f0bb3130eabe90892728ed71b3eb6c32b88))
* **main:** release 1.2.2 ([4c1ae1c](https://github.com/faisalkhan91/Fluxus/commit/4c1ae1c212eaf96e6de27b946603b405a2256697))
* **main:** release 1.2.3 ([90210fa](https://github.com/faisalkhan91/Fluxus/commit/90210fa64bc8dd3081d186646576087c09afa84f))
* **main:** release 1.2.3 ([45c1197](https://github.com/faisalkhan91/Fluxus/commit/45c11978fa96635b5401796fbb595043bd287582))
* **main:** release 1.2.4 ([cc07132](https://github.com/faisalkhan91/Fluxus/commit/cc0713208819f75fb689c787b22d8e4c58620c90))
* **main:** release 1.2.4 ([fc7eaaf](https://github.com/faisalkhan91/Fluxus/commit/fc7eaaf8648d8317708881bf91e8d31498ce1f14))
* **main:** release 1.3.0 ([c7f7c0f](https://github.com/faisalkhan91/Fluxus/commit/c7f7c0fb7f30cd3ff2520b71f0c872cf8d539a7a))
* **main:** release 1.3.0 ([21fbf09](https://github.com/faisalkhan91/Fluxus/commit/21fbf0985402edb6b86faf480b76c7833c1b4b74))
* **main:** release 2.0.0 ([eeea63b](https://github.com/faisalkhan91/Fluxus/commit/eeea63bf7a44cecc2f036fecf4bad19f98bf9e77))
* **main:** release 2.0.0 ([7bcf64d](https://github.com/faisalkhan91/Fluxus/commit/7bcf64d2f57e3e8a3312299b27486ca6765764eb))
* **main:** release 2.1.0 ([6fd32b6](https://github.com/faisalkhan91/Fluxus/commit/6fd32b6d47b3828addf282cf26785434f58e58d5))
* **main:** release 2.1.0 ([f922085](https://github.com/faisalkhan91/Fluxus/commit/f922085609a3d8cab99df4880015c30f2ebf989a))
* **main:** release 2.1.1 ([7d3aa0f](https://github.com/faisalkhan91/Fluxus/commit/7d3aa0f7acb989cc243677dfbd2c450c24b0cf98))
* **main:** release 2.1.1 ([2f4ba4f](https://github.com/faisalkhan91/Fluxus/commit/2f4ba4fab59e59ea761566da53b131777b7b9637))
* **main:** release 2.2.0 ([bcf4d85](https://github.com/faisalkhan91/Fluxus/commit/bcf4d8570bad54e924caf1daba8064f471e8708f))
* **main:** release 2.2.0 ([15375a0](https://github.com/faisalkhan91/Fluxus/commit/15375a018e4061fbb4880effca33731a35cff423))
* **main:** release 2.2.1 ([d2b7406](https://github.com/faisalkhan91/Fluxus/commit/d2b7406b58dafa07fb76fa0734431ee4b9865d5a))
* **main:** release 2.2.1 ([02773eb](https://github.com/faisalkhan91/Fluxus/commit/02773eba30721396b41e929b327aa6d867e9baf7))
* **main:** release 2.3.0 ([4862a6f](https://github.com/faisalkhan91/Fluxus/commit/4862a6f7f1ee600f2c1d25dd849943329b7db4ad))
* **main:** release 2.3.0 ([1a69ce9](https://github.com/faisalkhan91/Fluxus/commit/1a69ce9f7b96f4f98cc0ae27dc9dd174a210da51))
* **main:** release fluxus 2.0.0 ([6b5c9e7](https://github.com/faisalkhan91/Fluxus/commit/6b5c9e79ba8f7c6fb9abcf4f53c92106b54c619d))
* **main:** release fluxus 2.0.0 ([c797d12](https://github.com/faisalkhan91/Fluxus/commit/c797d124cae7641a224e5d09f50f950560996a11))
* **main:** release fluxus 2.1.0 ([6ccba7d](https://github.com/faisalkhan91/Fluxus/commit/6ccba7ddd88e1aa390d48bc10864b228b58083b2))
* **main:** release fluxus 2.1.0 ([da5e3b4](https://github.com/faisalkhan91/Fluxus/commit/da5e3b4695239a145becc50494c594a1edda9cf3))
* redesign adaptive favicon suite with &gt;fk_ prompt mark ([afa9324](https://github.com/faisalkhan91/Fluxus/commit/afa93248c49e3e03c1e151078d6e3687fd03b323))
* Refactor configuration files and update dependencies ([950e805](https://github.com/faisalkhan91/Fluxus/commit/950e805f940c5bd7c36d9c51121db416aed7c2e9))
* release 1.2.3 ([18f6472](https://github.com/faisalkhan91/Fluxus/commit/18f64724824154680a911c93b85541850cc4e055))
* release 1.3.0 and update changelog ([5b6312d](https://github.com/faisalkhan91/Fluxus/commit/5b6312de5f16201d126c9dc79d4d3e29c3b57535))
* **release:** 2.4.0 ([fa07e64](https://github.com/faisalkhan91/Fluxus/commit/fa07e6486e7cc45f7ea80de2b81a1601522b08d8))
* **release:** bump version to 1.2.4 and update changelog for rendering fixes ([8c3412a](https://github.com/faisalkhan91/Fluxus/commit/8c3412a36da64bb49e60049d3811c4c03defbe0f))
* remove obsolete CI fixes and update workflows ([b74a3dc](https://github.com/faisalkhan91/Fluxus/commit/b74a3dc8a53f3933f2341949dbded61631c9e138))
* remove zone.js dependency and update Angular configuration ([6211ceb](https://github.com/faisalkhan91/Fluxus/commit/6211ceb15b90a313defa31bfb76341eeef60422c))
* update .gitignore and package files for Playwright integration ([d7539dc](https://github.com/faisalkhan91/Fluxus/commit/d7539dc27eadc487b59062ca4ee7ae99e9e0f6ef))
* update Angular and related dependencies to latest versions ([02f8120](https://github.com/faisalkhan91/Fluxus/commit/02f8120e5c40feecf2a4864c6d08fa588079d36e))
* Update Angular dependencies to version 21.2.6 ([853f5d6](https://github.com/faisalkhan91/Fluxus/commit/853f5d68e11b6d2c4d24894c67adc76e795de02b))
* Update Angular dependencies to version 21.2.6 ([4e92756](https://github.com/faisalkhan91/Fluxus/commit/4e92756e55f5f719f0bad9558c8a690d97232b01))
* update CI workflows and ignore CHANGELOG.md in Prettier ([73676d0](https://github.com/faisalkhan91/Fluxus/commit/73676d0a53bdc63561f2f47c84af11200b3a3e01))
* update configuration and improve error handling ([606d0eb](https://github.com/faisalkhan91/Fluxus/commit/606d0eb539cedbb24754b48ac7590fa4395ef0c1))
* update dependencies and enhance blog post error handling ([0afc52b](https://github.com/faisalkhan91/Fluxus/commit/0afc52b4bdaac10f539b7be57ee758ca0a0d584c))
* update Docker and NGINX configurations ([413713f](https://github.com/faisalkhan91/Fluxus/commit/413713fa2ad449f702870f7d1d81edee9d36d3a6))
* Update Docker publish workflow actions to latest versions ([7037b30](https://github.com/faisalkhan91/Fluxus/commit/7037b3039365b8c99eabb28e480d002aae21fdfe))
* Update Docker publish workflow to checkout Homelab monorepo and update Kubernetes manifest with new image tag ([9ece076](https://github.com/faisalkhan91/Fluxus/commit/9ece0762b8f8913ff0f83fb55f74cf5781a70d77))
* Update Dockerfile and package-lock.json for Angular 24 compatibility ([0805d5a](https://github.com/faisalkhan91/Fluxus/commit/0805d5a1c899fcfd5dae366cfb6c0c2868488cb9))
* Update Karma configuration to allow empty test suites ([a918791](https://github.com/faisalkhan91/Fluxus/commit/a918791c5be364ddec84916d76ad89dbc9b77021))
* Update live link in README to point to new domain ([b41c7e9](https://github.com/faisalkhan91/Fluxus/commit/b41c7e9f706b4866f7c7443fbbb8bcfaabba9e14))
* update package dependencies and enhance profile descriptions ([501d4da](https://github.com/faisalkhan91/Fluxus/commit/501d4dab4190a75ed0e83bc29c1b65b0b7f614f4))
* update package-lock.json and refine experience descriptions ([878a11b](https://github.com/faisalkhan91/Fluxus/commit/878a11b6f25045af88aae4561bf7114a5625a108))
* Update package-lock.json version to 1.1.0 and optimize CSS imports ([6451f2b](https://github.com/faisalkhan91/Fluxus/commit/6451f2b45dd83e1be4ae0146d767ed9c07fbe6f5))
* Update README and CHANGELOG for Angular 21 migration and new features ([dddf018](https://github.com/faisalkhan91/Fluxus/commit/dddf018e17ee849868e8b627dcff60360eb85224))
* update TypeScript version and remove unused Angular dependency ([2009d51](https://github.com/faisalkhan91/Fluxus/commit/2009d512b0a5ed94e2288fbf98afc88c7e8a8768))
* Update version to 1.1.0 for Angular 18 release ([0ddcff8](https://github.com/faisalkhan91/Fluxus/commit/0ddcff88995b7b947a5cf37bb558a3b4019eb86c))
* Upgrade Angular dependencies to version 18 and update TypeScript configuration ([1a37993](https://github.com/faisalkhan91/Fluxus/commit/1a37993831b91c12cf5af3b4b717e999ac5772ad))


### Refactoring

* **bottom-sheet:** remove bottom sheet component and associated styles ([c143701](https://github.com/faisalkhan91/Fluxus/commit/c143701e94cfd3af81edc606ce759eb480c9adc1))
* **experience-data:** enhance clarity and conciseness of experience descriptions ([fc61867](https://github.com/faisalkhan91/Fluxus/commit/fc6186772594652bf9c7a62da953e954af20eb62))
* **experience-data:** further enhance clarity and conciseness of experience descriptions ([e01ffe7](https://github.com/faisalkhan91/Fluxus/commit/e01ffe7d4dfd272af162daa5e3f161eba7fbc542))
* **main:** remove unnecessary comments from main application entry point ([a4d7a07](https://github.com/faisalkhan91/Fluxus/commit/a4d7a07d3fbe26d40d1a43b8f2796c9a977bfb49))
* **navigation:** enhance mobile menu structure with dividers and improved item types ([05734e9](https://github.com/faisalkhan91/Fluxus/commit/05734e9af4282ecb0629684772eb730355a0d81c))
* **navigation:** update routing and navigation structure for improved clarity ([3124154](https://github.com/faisalkhan91/Fluxus/commit/3124154350b79af23a78c31cfee66b2a5229e48b))
* portfolio audit remediation (SEO, a11y, SSR, UX) ([d2cbee5](https://github.com/faisalkhan91/Fluxus/commit/d2cbee5dc346a029b48d90aabb1c05860bdcb4a8))
* Relocate all FluxusUI files to the root directory ([7855150](https://github.com/faisalkhan91/Fluxus/commit/785515058fff117a28e8c5812956c0701990ba12))
* round-2 audit remediation (bundle split, icon SSR, mobile layout) ([ec18f63](https://github.com/faisalkhan91/Fluxus/commit/ec18f6323b7de71cde881480e93e817f986c13aa))
* **skills:** enhance skills component with media query support and dynamic badge display ([6221210](https://github.com/faisalkhan91/Fluxus/commit/6221210689acc95058aa91863b6d6264a54627c3))
* **skills:** restructure skills categories and enhance UI interactions ([a7c1314](https://github.com/faisalkhan91/Fluxus/commit/a7c131422c59ec86b355051a1170f9c9bc950bf9))
* **timeline:** update entry details layout and styling ([d8b05a3](https://github.com/faisalkhan91/Fluxus/commit/d8b05a3fe5516493fecd6a8956cee30e8af1be60))
* update Angular configuration and testing setup ([6ab8573](https://github.com/faisalkhan91/Fluxus/commit/6ab8573154b0af86ba5da34017ce0af360627a22))
* Upgrade Angular dependencies and restructure application setup ([f077b83](https://github.com/faisalkhan91/Fluxus/commit/f077b83790f113e3ca03dbe7f7e69bd957252e4d))


### Documentation

* **audit:** rendering audit 2026-04 ([6a120fd](https://github.com/faisalkhan91/Fluxus/commit/6a120fdb31be0d03fc8d37b02fbb9ea273683266))
* Revamp README.md to enhance project description, features, tech stack, and setup instructions ([da9656f](https://github.com/faisalkhan91/Fluxus/commit/da9656f2ec34f11d2b927eb70af89243a3b89f4a))

## [2.3.0](https://github.com/faisalkhan91/Fluxus/compare/v2.2.2...v2.3.0) (2026-04-26)


### Features

* add path mapping for module imports and update environment references ([dd64f45](https://github.com/faisalkhan91/Fluxus/commit/dd64f450d42f3e4bcb5b1aa839840a4e5f113abe))
* audit ([29fd9e0](https://github.com/faisalkhan91/Fluxus/commit/29fd9e00565a8a85d3bba6c45cb801fecfbe20ef))
* audit patch source ([e700cf2](https://github.com/faisalkhan91/Fluxus/commit/e700cf21eef5101a239fe3f72bcd9138804fb8e0))
* **blog:** polish Subscribe button + add dev spot-check path for feed builder ([16644a5](https://github.com/faisalkhan91/Fluxus/commit/16644a5351d1f1a9632f97f3602cca5c26f6b9fb))
* **ci:** publish blog content updates without a semver release ([e64138f](https://github.com/faisalkhan91/Fluxus/commit/e64138ff43ada79f2dab96784318c16fd5843444))
* comprehensive portfolio remediation pass ([c21738d](https://github.com/faisalkhan91/Fluxus/commit/c21738dbe7404f49bc5b59683fccc85a4e6d557a))
* **hero:** layered boot sequence + pointer parallax + token shimmer ([6af886b](https://github.com/faisalkhan91/Fluxus/commit/6af886b97963dd255f054896d824e02425644b34))
* **motion:** land motion audit 2026-04 + tab-tightness + cleanup ([6a00746](https://github.com/faisalkhan91/Fluxus/commit/6a007460074f7a3523ef5f8fff5f89f88582a2df))
* rendering and animations ([1074c6c](https://github.com/faisalkhan91/Fluxus/commit/1074c6c6cdc5a7bab03ff6808e54ca72e218bcad))
* **rendering:** land rendering audit 2026-04 implementation ([762ad50](https://github.com/faisalkhan91/Fluxus/commit/762ad50470bd993ba399b19e266656f765bdd9e0))
* round-3 architect upgrades + blog UX polish ([a75eb91](https://github.com/faisalkhan91/Fluxus/commit/a75eb917eea59efffcd8c7b420ad76f5115e867d))
* update Angular configuration and dependencies, enhance blog features ([b883a9e](https://github.com/faisalkhan91/Fluxus/commit/b883a9e52887c669cc46f79331188a5dbb1ad0dc))


### Bug Fixes

* **audit:** escape hostname dots in prerender audit regexes ([b179058](https://github.com/faisalkhan91/Fluxus/commit/b179058fe2254d54111e5da919529901299e2ac0))
* **blog:** featured cover overflow + tighten list entrance jank ([7afd529](https://github.com/faisalkhan91/Fluxus/commit/7afd529844264b082cc5839528dd1a368139db5c))
* **blog:** update cover image for motion audit post ([8574bfc](https://github.com/faisalkhan91/Fluxus/commit/8574bfccba8d2c318767c8dd3d9e8661b4f77db3))
* **blog:** use [@starting-style](https://github.com/starting-style) for entrance to kill Firefox FOUC ([db92105](https://github.com/faisalkhan91/Fluxus/commit/db92105a5c8d5a2fefdbbe181295590f5e704207))
* **build:** resolve Windows path issues in image-dims script ([86dd060](https://github.com/faisalkhan91/Fluxus/commit/86dd0609d8304fe5ffaff9885bb57f6a276c526e))
* **ci:** update lighthouse-ci-action to correct SHA for v12.1.0 ([746baaf](https://github.com/faisalkhan91/Fluxus/commit/746baafbe7845acd54a43c4bd894e434fe0fa57d))
* **ci:** use verified SHA for lighthouse-ci-action v12.1.0 ([b641002](https://github.com/faisalkhan91/Fluxus/commit/b6410026a0bcb3f574eac96828a261165052429e))
* **feed:** honour post.updated on &lt;updated&gt; + use type=text on summary ([f2409b9](https://github.com/faisalkhan91/Fluxus/commit/f2409b9ee4fb2bdfe5c470c78269924414ec9c37))
* **image:** upgrade base packages and update trivy-action to v0.36.0 ([6bd1990](https://github.com/faisalkhan91/Fluxus/commit/6bd19906c5a279c72d453d745268b3e3b405dd41))
* **image:** upgrade base packages and update trivy-action to v0.36.0 ([f201b98](https://github.com/faisalkhan91/Fluxus/commit/f201b987abfc3ddbb3941f596c2eb3c292017443))
* **test:** resolve Playwright focus-trap collision, a11y, and timing failures ([d7c7199](https://github.com/faisalkhan91/Fluxus/commit/d7c71992b450dd5cca43a73874844b4eab0c17e6))


### Miscellaneous

* **build:** clear lingering errors, warnings, and pre-existing test debt ([38d8fe9](https://github.com/faisalkhan91/Fluxus/commit/38d8fe9f1d7d68af881ac2f2230cb8ab0b094f8e))
* **ci:** document new CI/CD topology and add GHCR retention ([0d388d2](https://github.com/faisalkhan91/Fluxus/commit/0d388d249a812d45d997a30fc3b31aaca398d4fe))
* **ci:** rebuild GitHub Actions for security, simplicity, and PR-based GitOps ([5248249](https://github.com/faisalkhan91/Fluxus/commit/52482493a98b387cab602c4342525a5d7d0ee9a3))
* **deps:** tighten dependabot grouping and ignore deferred majors ([b79b988](https://github.com/faisalkhan91/Fluxus/commit/b79b98876a5b56f33151588fb35a6a0b1d4b8733))
* **format:** apply prettier sweep flushed by broader lint scope ([55b3ac7](https://github.com/faisalkhan91/Fluxus/commit/55b3ac771e27271918d59f4bcd1b4b60a2cbe113))
* **format:** global prettier sweep to normalize line endings and styles ([205d66b](https://github.com/faisalkhan91/Fluxus/commit/205d66b7000199fb9b9dc4861e565248e544dc6e))
* **format:** trim trailing spaces in homelab-storage-foundation table ([d1fa758](https://github.com/faisalkhan91/Fluxus/commit/d1fa7585ca3c098a1762dd64a6f36b98a0fa5853))
* **lint:** fold prettier --check into npm run lint ([4f6c961](https://github.com/faisalkhan91/Fluxus/commit/4f6c961b2dba7fd85406232c297bf59243cbc70a))
* update .gitignore and package files for Playwright integration ([d7539dc](https://github.com/faisalkhan91/Fluxus/commit/d7539dc27eadc487b59062ca4ee7ae99e9e0f6ef))


### Refactoring

* portfolio audit remediation (SEO, a11y, SSR, UX) ([d2cbee5](https://github.com/faisalkhan91/Fluxus/commit/d2cbee5dc346a029b48d90aabb1c05860bdcb4a8))
* round-2 audit remediation (bundle split, icon SSR, mobile layout) ([ec18f63](https://github.com/faisalkhan91/Fluxus/commit/ec18f6323b7de71cde881480e93e817f986c13aa))


### Documentation

* **audit:** rendering audit 2026-04 ([6a120fd](https://github.com/faisalkhan91/Fluxus/commit/6a120fdb31be0d03fc8d37b02fbb9ea273683266))

## [2.2.1](https://github.com/faisalkhan91/Fluxus/compare/v2.2.0...v2.2.1) (2026-04-22)


### Miscellaneous

* **deps-dev:** bump typescript-eslint ([580a520](https://github.com/faisalkhan91/Fluxus/commit/580a520f48f3263548e1b7a809df23c5a6949830))
* **deps-dev:** bump typescript-eslint from 8.56.1 to 8.59.0 in the eslint group across 1 directory ([9721b46](https://github.com/faisalkhan91/Fluxus/commit/9721b469aeae0adfc56a5d949ae038cac980c976))

## [2.2.0](https://github.com/faisalkhan91/Fluxus/compare/v2.1.1...v2.2.0) (2026-04-22)


### Features

* **blog:** add homelab storage architecture post ([da06567](https://github.com/faisalkhan91/Fluxus/commit/da0656739366796c26d872ef641f8e2a0e559127))
* **blog:** correct image mapping and add all assembly photos ([38a2296](https://github.com/faisalkhan91/Fluxus/commit/38a2296beb897086cb9b0902c533b6ab9d5469ef))
* New blog post ([aea1340](https://github.com/faisalkhan91/Fluxus/commit/aea1340ee481738f7a1b3f36b0f005cda3b32fab))


### Bug Fixes

* **blog:** update image paths to be relative ([621b6cc](https://github.com/faisalkhan91/Fluxus/commit/621b6cc1b508315accdbba8a4ca9ba99c16fb5f2))


### Miscellaneous

* **deps:** bump docker/build-push-action from 7.0.0 to 7.1.0 ([eda252c](https://github.com/faisalkhan91/Fluxus/commit/eda252c8684e548ee42a229894d8fc39656213cc))
* **deps:** bump docker/login-action from 4.0.0 to 4.1.0 ([3b5cd47](https://github.com/faisalkhan91/Fluxus/commit/3b5cd47276eb9262ebdb53440a6b8fb4e950b1c2))
* **deps:** bump nginxinc/nginx-unprivileged from 1.27-alpine to 1.29-alpine ([11cb7c0](https://github.com/faisalkhan91/Fluxus/commit/11cb7c0a23003b2d3632aabf1f03e5a664dfb345))

## [2.1.1](https://github.com/faisalkhan91/Fluxus/compare/v2.1.0...v2.1.1) (2026-04-12)


### Bug Fixes

* suppress CVE-2026-28390 in .trivyignore ([b5f2555](https://github.com/faisalkhan91/Fluxus/commit/b5f2555c31bac134b63dd6a3c42322ce51ae5c8a))
* suppress CVE-2026-28390 in .trivyignore ([b0a31c1](https://github.com/faisalkhan91/Fluxus/commit/b0a31c1c44f31f2e310631199c1172c3adf3a71e))

## [2.1.0](https://github.com/faisalkhan91/Fluxus/compare/v2.0.0...v2.1.0) (2026-04-12)


### Features

* Experience and Navigation Upgrades ([931f69b](https://github.com/faisalkhan91/Fluxus/commit/931f69baecee749792ca5f3a480d244cc4530ec7))


### Bug Fixes

* **changelog:** correct version comparison links and update README for routing changes ([86e3d15](https://github.com/faisalkhan91/Fluxus/commit/86e3d15d217223f77d25702e0b909e606556f117))


### Miscellaneous

* update package dependencies and enhance profile descriptions ([501d4da](https://github.com/faisalkhan91/Fluxus/commit/501d4dab4190a75ed0e83bc29c1b65b0b7f614f4))
* update package-lock.json and refine experience descriptions ([878a11b](https://github.com/faisalkhan91/Fluxus/commit/878a11b6f25045af88aae4561bf7114a5625a108))


### Refactoring

* **bottom-sheet:** remove bottom sheet component and associated styles ([c143701](https://github.com/faisalkhan91/Fluxus/commit/c143701e94cfd3af81edc606ce759eb480c9adc1))
* **experience-data:** enhance clarity and conciseness of experience descriptions ([fc61867](https://github.com/faisalkhan91/Fluxus/commit/fc6186772594652bf9c7a62da953e954af20eb62))
* **experience-data:** further enhance clarity and conciseness of experience descriptions ([e01ffe7](https://github.com/faisalkhan91/Fluxus/commit/e01ffe7d4dfd272af162daa5e3f161eba7fbc542))
* **navigation:** enhance mobile menu structure with dividers and improved item types ([05734e9](https://github.com/faisalkhan91/Fluxus/commit/05734e9af4282ecb0629684772eb730355a0d81c))
* **navigation:** update routing and navigation structure for improved clarity ([3124154](https://github.com/faisalkhan91/Fluxus/commit/3124154350b79af23a78c31cfee66b2a5229e48b))
* **skills:** enhance skills component with media query support and dynamic badge display ([6221210](https://github.com/faisalkhan91/Fluxus/commit/6221210689acc95058aa91863b6d6264a54627c3))
* **skills:** restructure skills categories and enhance UI interactions ([a7c1314](https://github.com/faisalkhan91/Fluxus/commit/a7c131422c59ec86b355051a1170f9c9bc950bf9))
* **timeline:** update entry details layout and styling ([d8b05a3](https://github.com/faisalkhan91/Fluxus/commit/d8b05a3fe5516493fecd6a8956cee30e8af1be60))

## [2.0.0](https://github.com/faisalkhan91/Fluxus/compare/v1.3.0...v2.0.0) (2026-04-05)


### ⚠ BREAKING CHANGES

* comprehensive accessibility, security, and infrastructure overhaul

### Features

* Add adjacent post navigation and reading progress indicator to blog post component ([01ae611](https://github.com/faisalkhan91/Fluxus/commit/01ae611a554eb24861c3b12c3ea2e85300e084d4))
* Add adjacent post navigation and reading progress indicator to blog post component ([4e8c342](https://github.com/faisalkhan91/Fluxus/commit/4e8c342dfdad2404ad99d2930d346c5b017de3bc))
* Add blog feature with routing and styling enhancements ([55e33a6](https://github.com/faisalkhan91/Fluxus/commit/55e33a696f404f579803b495129715c0555b50c7))
* Add custom Nginx configuration for SPA routing in Dockerfile ([503094d](https://github.com/faisalkhan91/Fluxus/commit/503094d50c23fa1505374fd0895f73d7eaf46e22))
* Add new blog post on Angular Signals state management ([00c07ad](https://github.com/faisalkhan91/Fluxus/commit/00c07ad18560a42a86faf04d26411f10ea88c86d))
* Audit and new version. ([2ea240e](https://github.com/faisalkhan91/Fluxus/commit/2ea240e2b070c332c9999f64202d3a3773311c0b))
* Enhance Angular configuration and improve server-side rendering support ([ca045b8](https://github.com/faisalkhan91/Fluxus/commit/ca045b8d2f1473c8ab8075bdeace788c7fcb21e3))
* Enhance navigation and tab functionality with new home link and close tab logic ([f369a69](https://github.com/faisalkhan91/Fluxus/commit/f369a699907e467b2786535326854093144b48f6))
* Enhance SEO and accessibility features across the application ([561b70c](https://github.com/faisalkhan91/Fluxus/commit/561b70c7a5a84cdee38fb38ce565e5a197c81f23))
* Enhance SEO and styling across the application ([d9e9c96](https://github.com/faisalkhan91/Fluxus/commit/d9e9c96660838c15d4667cc1912d685d2943af8c))
* Enhance SEO and styling across the application ([02cc35b](https://github.com/faisalkhan91/Fluxus/commit/02cc35bab5374b0dfffa5247efae82739e5a1d48))
* Enhance styling and functionality across various components ([a3b965d](https://github.com/faisalkhan91/Fluxus/commit/a3b965dfe6b5eb635664bb68c87bdc3f2767d1cc))
* force release pipeline to trigger ([7d5b4c0](https://github.com/faisalkhan91/Fluxus/commit/7d5b4c0256f9481e3380466dca7cbe2b056cc1f4))
* Improve icon component to handle server-side rendering ([489c8e0](https://github.com/faisalkhan91/Fluxus/commit/489c8e0a836924c74d0f55c33781715819f39318))
* Improve user profile and SEO details for enhanced visibility ([7e23b2a](https://github.com/faisalkhan91/Fluxus/commit/7e23b2a549de5c49135aefeab47dbdd80f926168))
* Major config changes ([a710005](https://github.com/faisalkhan91/Fluxus/commit/a710005c033a41926d858d406196b3f563c0fbf2))
* Optimize Angular build and enhance NGINX configuration ([165ba6a](https://github.com/faisalkhan91/Fluxus/commit/165ba6ac74f432a1c3ea7d8f3efb88847f21761b))
* Update profile and SEO details to reflect senior role and experience ([8d38c25](https://github.com/faisalkhan91/Fluxus/commit/8d38c2596939ec4c04b5b836d9c25b020d2fcaa9))
* v2.0 -- full best-practices audit, test coverage, and CI/CD hardening ([53cf408](https://github.com/faisalkhan91/Fluxus/commit/53cf40893776c5ca34fc7089bcfa69084058148a))


### Bug Fixes

* **changelog:** remove unnecessary whitespace and align bug fix entries ([5b1bc08](https://github.com/faisalkhan91/Fluxus/commit/5b1bc0897642bc2eee1de13e78474ffb526e1f72))
* **core:** bootstrap application and core runtime initialization logic ([9e3e0a3](https://github.com/faisalkhan91/Fluxus/commit/9e3e0a3b37dbcb25094699323a54f462493b88b0))
* force release pipeline to trigger ([814a3a8](https://github.com/faisalkhan91/Fluxus/commit/814a3a80e48dde63b7e7e9586ab64d5db1680503))
* remove obsolete CI error fix patch and update Karma configuration ([93bebe2](https://github.com/faisalkhan91/Fluxus/commit/93bebe2e51d855ef2cde94978531c3c009e5558a))
* Remove unnecessary peer dependencies from package-lock.json ([60ad0b6](https://github.com/faisalkhan91/Fluxus/commit/60ad0b6e9a661b0e440016099c820d820fbac699))
* Removed patch files ([8c875dc](https://github.com/faisalkhan91/Fluxus/commit/8c875dc94cd2d28a46f19e0e413566efe2a5daf6))
* resolve CI lint errors and setup-node deprecation ([bdf4418](https://github.com/faisalkhan91/Fluxus/commit/bdf441858ea36cd8055cf36e705952dba656a2f1))
* resolve SSR NotYetImplemented error in IconComponent ([44eef70](https://github.com/faisalkhan91/Fluxus/commit/44eef70e1210d746408f76e0aeb66e315320576e))
* **security:** ignore known base image vulnerabilities in Trivy scan ([26f705e](https://github.com/faisalkhan91/Fluxus/commit/26f705ee7021c7e0a16191b45d9707fb04867765))
* Update project name and paths after relocation ([7c423c7](https://github.com/faisalkhan91/Fluxus/commit/7c423c70b0caeaf3b35e2f4776f8c807de2e6578))


### Miscellaneous

* Bump version to 1.0.0 and update README for Angular 18 enhancements ([7645739](https://github.com/faisalkhan91/Fluxus/commit/7645739ff99aec39c35b6c70bb92a4b31405485b))
* **changelog:** synchronize production build and deployment pipeline state ([ca9f1f8](https://github.com/faisalkhan91/Fluxus/commit/ca9f1f84758e808f541a762a4aae8fde5fb3805f))
* **changelog:** trigger production build and deployment ([a0b22d0](https://github.com/faisalkhan91/Fluxus/commit/a0b22d0584d55ddbc498ebb4467ecbce288c4c86))
* Clean up package-lock.json by removing unused dependencies ([99bc6ab](https://github.com/faisalkhan91/Fluxus/commit/99bc6abd60568dcd86a652eda89a9ff3629b5e07))
* enhance blog post error handling and update styles ([570da60](https://github.com/faisalkhan91/Fluxus/commit/570da60d18ffaa321ab713e3e21b55d7899bc4f6))
* Fix dependency version conflicts for Angular packages ([9350fa1](https://github.com/faisalkhan91/Fluxus/commit/9350fa1444c7c47767a0b6ffc845be83bf18f1a4))
* force release and update CI configurations ([5bc2cab](https://github.com/faisalkhan91/Fluxus/commit/5bc2cab90152a1905f0879418970b7069ec4cefe))
* force version to 2.0.0 and fix tag prefix ([9e17c39](https://github.com/faisalkhan91/Fluxus/commit/9e17c3954558df317829dec1bb5701fd0aefcc0c))
* **main:** release 1.2.0 ([c324843](https://github.com/faisalkhan91/Fluxus/commit/c3248435533e0847ea5f7e355438e29129ba3983))
* **main:** release 1.2.0 ([9d38268](https://github.com/faisalkhan91/Fluxus/commit/9d38268bc4e1ca862a196ab094a12b25bae88fac))
* **main:** release 1.2.1 ([5c5e69b](https://github.com/faisalkhan91/Fluxus/commit/5c5e69b7cd4642e28c2d01c9503e721da67f67f6))
* **main:** release 1.2.1 ([ee1e48a](https://github.com/faisalkhan91/Fluxus/commit/ee1e48ad4e7167cc845b726f809e73ac58476d8e))
* **main:** release 1.2.2 ([21a21f0](https://github.com/faisalkhan91/Fluxus/commit/21a21f0bb3130eabe90892728ed71b3eb6c32b88))
* **main:** release 1.2.2 ([4c1ae1c](https://github.com/faisalkhan91/Fluxus/commit/4c1ae1c212eaf96e6de27b946603b405a2256697))
* **main:** release 1.2.3 ([90210fa](https://github.com/faisalkhan91/Fluxus/commit/90210fa64bc8dd3081d186646576087c09afa84f))
* **main:** release 1.2.3 ([45c1197](https://github.com/faisalkhan91/Fluxus/commit/45c11978fa96635b5401796fbb595043bd287582))
* **main:** release 1.2.4 ([cc07132](https://github.com/faisalkhan91/Fluxus/commit/cc0713208819f75fb689c787b22d8e4c58620c90))
* **main:** release 1.2.4 ([fc7eaaf](https://github.com/faisalkhan91/Fluxus/commit/fc7eaaf8648d8317708881bf91e8d31498ce1f14))
* **main:** release 1.3.0 ([c7f7c0f](https://github.com/faisalkhan91/Fluxus/commit/c7f7c0fb7f30cd3ff2520b71f0c872cf8d539a7a))
* **main:** release 1.3.0 ([21fbf09](https://github.com/faisalkhan91/Fluxus/commit/21fbf0985402edb6b86faf480b76c7833c1b4b74))
* **main:** release fluxus 2.0.0 ([6b5c9e7](https://github.com/faisalkhan91/Fluxus/commit/6b5c9e79ba8f7c6fb9abcf4f53c92106b54c619d))
* **main:** release fluxus 2.0.0 ([c797d12](https://github.com/faisalkhan91/Fluxus/commit/c797d124cae7641a224e5d09f50f950560996a11))
* **main:** release fluxus 2.1.0 ([6ccba7d](https://github.com/faisalkhan91/Fluxus/commit/6ccba7ddd88e1aa390d48bc10864b228b58083b2))
* **main:** release fluxus 2.1.0 ([da5e3b4](https://github.com/faisalkhan91/Fluxus/commit/da5e3b4695239a145becc50494c594a1edda9cf3))
* redesign adaptive favicon suite with &gt;fk_ prompt mark ([afa9324](https://github.com/faisalkhan91/Fluxus/commit/afa93248c49e3e03c1e151078d6e3687fd03b323))
* Refactor configuration files and update dependencies ([950e805](https://github.com/faisalkhan91/Fluxus/commit/950e805f940c5bd7c36d9c51121db416aed7c2e9))
* release 1.2.3 ([18f6472](https://github.com/faisalkhan91/Fluxus/commit/18f64724824154680a911c93b85541850cc4e055))
* release 1.3.0 and update changelog ([5b6312d](https://github.com/faisalkhan91/Fluxus/commit/5b6312de5f16201d126c9dc79d4d3e29c3b57535))
* **release:** bump version to 1.2.4 and update changelog for rendering fixes ([8c3412a](https://github.com/faisalkhan91/Fluxus/commit/8c3412a36da64bb49e60049d3811c4c03defbe0f))
* remove obsolete CI fixes and update workflows ([b74a3dc](https://github.com/faisalkhan91/Fluxus/commit/b74a3dc8a53f3933f2341949dbded61631c9e138))
* remove zone.js dependency and update Angular configuration ([6211ceb](https://github.com/faisalkhan91/Fluxus/commit/6211ceb15b90a313defa31bfb76341eeef60422c))
* update Angular and related dependencies to latest versions ([02f8120](https://github.com/faisalkhan91/Fluxus/commit/02f8120e5c40feecf2a4864c6d08fa588079d36e))
* Update Angular dependencies to version 21.2.6 ([853f5d6](https://github.com/faisalkhan91/Fluxus/commit/853f5d68e11b6d2c4d24894c67adc76e795de02b))
* Update Angular dependencies to version 21.2.6 ([4e92756](https://github.com/faisalkhan91/Fluxus/commit/4e92756e55f5f719f0bad9558c8a690d97232b01))
* update CI workflows and ignore CHANGELOG.md in Prettier ([73676d0](https://github.com/faisalkhan91/Fluxus/commit/73676d0a53bdc63561f2f47c84af11200b3a3e01))
* update configuration and improve error handling ([606d0eb](https://github.com/faisalkhan91/Fluxus/commit/606d0eb539cedbb24754b48ac7590fa4395ef0c1))
* update dependencies and enhance blog post error handling ([0afc52b](https://github.com/faisalkhan91/Fluxus/commit/0afc52b4bdaac10f539b7be57ee758ca0a0d584c))
* update Docker and NGINX configurations ([413713f](https://github.com/faisalkhan91/Fluxus/commit/413713fa2ad449f702870f7d1d81edee9d36d3a6))
* Update Docker publish workflow actions to latest versions ([7037b30](https://github.com/faisalkhan91/Fluxus/commit/7037b3039365b8c99eabb28e480d002aae21fdfe))
* Update Docker publish workflow to checkout Homelab monorepo and update Kubernetes manifest with new image tag ([9ece076](https://github.com/faisalkhan91/Fluxus/commit/9ece0762b8f8913ff0f83fb55f74cf5781a70d77))
* Update Dockerfile and package-lock.json for Angular 24 compatibility ([0805d5a](https://github.com/faisalkhan91/Fluxus/commit/0805d5a1c899fcfd5dae366cfb6c0c2868488cb9))
* Update Karma configuration to allow empty test suites ([a918791](https://github.com/faisalkhan91/Fluxus/commit/a918791c5be364ddec84916d76ad89dbc9b77021))
* Update live link in README to point to new domain ([b41c7e9](https://github.com/faisalkhan91/Fluxus/commit/b41c7e9f706b4866f7c7443fbbb8bcfaabba9e14))
* Update package-lock.json version to 1.1.0 and optimize CSS imports ([6451f2b](https://github.com/faisalkhan91/Fluxus/commit/6451f2b45dd83e1be4ae0146d767ed9c07fbe6f5))
* Update README and CHANGELOG for Angular 21 migration and new features ([dddf018](https://github.com/faisalkhan91/Fluxus/commit/dddf018e17ee849868e8b627dcff60360eb85224))
* update TypeScript version and remove unused Angular dependency ([2009d51](https://github.com/faisalkhan91/Fluxus/commit/2009d512b0a5ed94e2288fbf98afc88c7e8a8768))
* Update version to 1.1.0 for Angular 18 release ([0ddcff8](https://github.com/faisalkhan91/Fluxus/commit/0ddcff88995b7b947a5cf37bb558a3b4019eb86c))
* Upgrade Angular dependencies to version 18 and update TypeScript configuration ([1a37993](https://github.com/faisalkhan91/Fluxus/commit/1a37993831b91c12cf5af3b4b717e999ac5772ad))


### Refactoring

* **main:** remove unnecessary comments from main application entry point ([a4d7a07](https://github.com/faisalkhan91/Fluxus/commit/a4d7a07d3fbe26d40d1a43b8f2796c9a977bfb49))
* Relocate all FluxusUI files to the root directory ([7855150](https://github.com/faisalkhan91/Fluxus/commit/785515058fff117a28e8c5812956c0701990ba12))
* update Angular configuration and testing setup ([6ab8573](https://github.com/faisalkhan91/Fluxus/commit/6ab8573154b0af86ba5da34017ce0af360627a22))
* Upgrade Angular dependencies and restructure application setup ([f077b83](https://github.com/faisalkhan91/Fluxus/commit/f077b83790f113e3ca03dbe7f7e69bd957252e4d))


### Documentation

* Revamp README.md to enhance project description, features, tech stack, and setup instructions ([da9656f](https://github.com/faisalkhan91/Fluxus/commit/da9656f2ec34f11d2b927eb70af89243a3b89f4a))

## [2.1.0](https://github.com/faisalkhan91/Fluxus/compare/fluxus-v2.0.0...fluxus-v2.1.0) (2026-04-05)


### Features

* force release pipeline to trigger ([7d5b4c0](https://github.com/faisalkhan91/Fluxus/commit/7d5b4c0256f9481e3380466dca7cbe2b056cc1f4))


### Bug Fixes

* Removed patch files ([8c875dc](https://github.com/faisalkhan91/Fluxus/commit/8c875dc94cd2d28a46f19e0e413566efe2a5daf6))

## [2.0.0](https://github.com/faisalkhan91/Fluxus/compare/fluxus-v1.3.0...fluxus-v2.0.0) (2026-04-04)


### ⚠ BREAKING CHANGES

* comprehensive accessibility, security, and infrastructure overhaul

### Features

* Add adjacent post navigation and reading progress indicator to blog post component ([01ae611](https://github.com/faisalkhan91/Fluxus/commit/01ae611a554eb24861c3b12c3ea2e85300e084d4))
* Add adjacent post navigation and reading progress indicator to blog post component ([4e8c342](https://github.com/faisalkhan91/Fluxus/commit/4e8c342dfdad2404ad99d2930d346c5b017de3bc))
* Add blog feature with routing and styling enhancements ([55e33a6](https://github.com/faisalkhan91/Fluxus/commit/55e33a696f404f579803b495129715c0555b50c7))
* Add custom Nginx configuration for SPA routing in Dockerfile ([503094d](https://github.com/faisalkhan91/Fluxus/commit/503094d50c23fa1505374fd0895f73d7eaf46e22))
* Add new blog post on Angular Signals state management ([00c07ad](https://github.com/faisalkhan91/Fluxus/commit/00c07ad18560a42a86faf04d26411f10ea88c86d))
* Audit and new version. ([2ea240e](https://github.com/faisalkhan91/Fluxus/commit/2ea240e2b070c332c9999f64202d3a3773311c0b))
* Enhance Angular configuration and improve server-side rendering support ([ca045b8](https://github.com/faisalkhan91/Fluxus/commit/ca045b8d2f1473c8ab8075bdeace788c7fcb21e3))
* Enhance navigation and tab functionality with new home link and close tab logic ([f369a69](https://github.com/faisalkhan91/Fluxus/commit/f369a699907e467b2786535326854093144b48f6))
* Enhance SEO and accessibility features across the application ([561b70c](https://github.com/faisalkhan91/Fluxus/commit/561b70c7a5a84cdee38fb38ce565e5a197c81f23))
* Enhance SEO and styling across the application ([d9e9c96](https://github.com/faisalkhan91/Fluxus/commit/d9e9c96660838c15d4667cc1912d685d2943af8c))
* Enhance SEO and styling across the application ([02cc35b](https://github.com/faisalkhan91/Fluxus/commit/02cc35bab5374b0dfffa5247efae82739e5a1d48))
* Enhance styling and functionality across various components ([a3b965d](https://github.com/faisalkhan91/Fluxus/commit/a3b965dfe6b5eb635664bb68c87bdc3f2767d1cc))
* Improve icon component to handle server-side rendering ([489c8e0](https://github.com/faisalkhan91/Fluxus/commit/489c8e0a836924c74d0f55c33781715819f39318))
* Improve user profile and SEO details for enhanced visibility ([7e23b2a](https://github.com/faisalkhan91/Fluxus/commit/7e23b2a549de5c49135aefeab47dbdd80f926168))
* Major config changes ([a710005](https://github.com/faisalkhan91/Fluxus/commit/a710005c033a41926d858d406196b3f563c0fbf2))
* Optimize Angular build and enhance NGINX configuration ([165ba6a](https://github.com/faisalkhan91/Fluxus/commit/165ba6ac74f432a1c3ea7d8f3efb88847f21761b))
* Update profile and SEO details to reflect senior role and experience ([8d38c25](https://github.com/faisalkhan91/Fluxus/commit/8d38c2596939ec4c04b5b836d9c25b020d2fcaa9))
* v2.0 -- full best-practices audit, test coverage, and CI/CD hardening ([53cf408](https://github.com/faisalkhan91/Fluxus/commit/53cf40893776c5ca34fc7089bcfa69084058148a))


### Bug Fixes

* **changelog:** remove unnecessary whitespace and align bug fix entries ([5b1bc08](https://github.com/faisalkhan91/Fluxus/commit/5b1bc0897642bc2eee1de13e78474ffb526e1f72))
* **core:** bootstrap application and core runtime initialization logic ([9e3e0a3](https://github.com/faisalkhan91/Fluxus/commit/9e3e0a3b37dbcb25094699323a54f462493b88b0))
* force release pipeline to trigger ([814a3a8](https://github.com/faisalkhan91/Fluxus/commit/814a3a80e48dde63b7e7e9586ab64d5db1680503))
* remove obsolete CI error fix patch and update Karma configuration ([93bebe2](https://github.com/faisalkhan91/Fluxus/commit/93bebe2e51d855ef2cde94978531c3c009e5558a))
* Remove unnecessary peer dependencies from package-lock.json ([60ad0b6](https://github.com/faisalkhan91/Fluxus/commit/60ad0b6e9a661b0e440016099c820d820fbac699))
* resolve CI lint errors and setup-node deprecation ([bdf4418](https://github.com/faisalkhan91/Fluxus/commit/bdf441858ea36cd8055cf36e705952dba656a2f1))
* resolve SSR NotYetImplemented error in IconComponent ([44eef70](https://github.com/faisalkhan91/Fluxus/commit/44eef70e1210d746408f76e0aeb66e315320576e))
* **security:** ignore known base image vulnerabilities in Trivy scan ([26f705e](https://github.com/faisalkhan91/Fluxus/commit/26f705ee7021c7e0a16191b45d9707fb04867765))
* Update project name and paths after relocation ([7c423c7](https://github.com/faisalkhan91/Fluxus/commit/7c423c70b0caeaf3b35e2f4776f8c807de2e6578))


### Miscellaneous

* Bump version to 1.0.0 and update README for Angular 18 enhancements ([7645739](https://github.com/faisalkhan91/Fluxus/commit/7645739ff99aec39c35b6c70bb92a4b31405485b))
* **changelog:** synchronize production build and deployment pipeline state ([ca9f1f8](https://github.com/faisalkhan91/Fluxus/commit/ca9f1f84758e808f541a762a4aae8fde5fb3805f))
* **changelog:** trigger production build and deployment ([a0b22d0](https://github.com/faisalkhan91/Fluxus/commit/a0b22d0584d55ddbc498ebb4467ecbce288c4c86))
* Clean up package-lock.json by removing unused dependencies ([99bc6ab](https://github.com/faisalkhan91/Fluxus/commit/99bc6abd60568dcd86a652eda89a9ff3629b5e07))
* enhance blog post error handling and update styles ([570da60](https://github.com/faisalkhan91/Fluxus/commit/570da60d18ffaa321ab713e3e21b55d7899bc4f6))
* Fix dependency version conflicts for Angular packages ([9350fa1](https://github.com/faisalkhan91/Fluxus/commit/9350fa1444c7c47767a0b6ffc845be83bf18f1a4))
* force release and update CI configurations ([5bc2cab](https://github.com/faisalkhan91/Fluxus/commit/5bc2cab90152a1905f0879418970b7069ec4cefe))
* **main:** release 1.2.0 ([c324843](https://github.com/faisalkhan91/Fluxus/commit/c3248435533e0847ea5f7e355438e29129ba3983))
* **main:** release 1.2.0 ([9d38268](https://github.com/faisalkhan91/Fluxus/commit/9d38268bc4e1ca862a196ab094a12b25bae88fac))
* **main:** release 1.2.1 ([5c5e69b](https://github.com/faisalkhan91/Fluxus/commit/5c5e69b7cd4642e28c2d01c9503e721da67f67f6))
* **main:** release 1.2.1 ([ee1e48a](https://github.com/faisalkhan91/Fluxus/commit/ee1e48ad4e7167cc845b726f809e73ac58476d8e))
* **main:** release 1.2.2 ([21a21f0](https://github.com/faisalkhan91/Fluxus/commit/21a21f0bb3130eabe90892728ed71b3eb6c32b88))
* **main:** release 1.2.2 ([4c1ae1c](https://github.com/faisalkhan91/Fluxus/commit/4c1ae1c212eaf96e6de27b946603b405a2256697))
* **main:** release 1.2.3 ([90210fa](https://github.com/faisalkhan91/Fluxus/commit/90210fa64bc8dd3081d186646576087c09afa84f))
* **main:** release 1.2.3 ([45c1197](https://github.com/faisalkhan91/Fluxus/commit/45c11978fa96635b5401796fbb595043bd287582))
* **main:** release 1.2.4 ([cc07132](https://github.com/faisalkhan91/Fluxus/commit/cc0713208819f75fb689c787b22d8e4c58620c90))
* **main:** release 1.2.4 ([fc7eaaf](https://github.com/faisalkhan91/Fluxus/commit/fc7eaaf8648d8317708881bf91e8d31498ce1f14))
* **main:** release 1.3.0 ([c7f7c0f](https://github.com/faisalkhan91/Fluxus/commit/c7f7c0fb7f30cd3ff2520b71f0c872cf8d539a7a))
* **main:** release 1.3.0 ([21fbf09](https://github.com/faisalkhan91/Fluxus/commit/21fbf0985402edb6b86faf480b76c7833c1b4b74))
* redesign adaptive favicon suite with &gt;fk_ prompt mark ([afa9324](https://github.com/faisalkhan91/Fluxus/commit/afa93248c49e3e03c1e151078d6e3687fd03b323))
* Refactor configuration files and update dependencies ([950e805](https://github.com/faisalkhan91/Fluxus/commit/950e805f940c5bd7c36d9c51121db416aed7c2e9))
* release 1.2.3 ([18f6472](https://github.com/faisalkhan91/Fluxus/commit/18f64724824154680a911c93b85541850cc4e055))
* release 1.3.0 and update changelog ([5b6312d](https://github.com/faisalkhan91/Fluxus/commit/5b6312de5f16201d126c9dc79d4d3e29c3b57535))
* **release:** bump version to 1.2.4 and update changelog for rendering fixes ([8c3412a](https://github.com/faisalkhan91/Fluxus/commit/8c3412a36da64bb49e60049d3811c4c03defbe0f))
* remove obsolete CI fixes and update workflows ([b74a3dc](https://github.com/faisalkhan91/Fluxus/commit/b74a3dc8a53f3933f2341949dbded61631c9e138))
* remove zone.js dependency and update Angular configuration ([6211ceb](https://github.com/faisalkhan91/Fluxus/commit/6211ceb15b90a313defa31bfb76341eeef60422c))
* update Angular and related dependencies to latest versions ([02f8120](https://github.com/faisalkhan91/Fluxus/commit/02f8120e5c40feecf2a4864c6d08fa588079d36e))
* Update Angular dependencies to version 21.2.6 ([853f5d6](https://github.com/faisalkhan91/Fluxus/commit/853f5d68e11b6d2c4d24894c67adc76e795de02b))
* Update Angular dependencies to version 21.2.6 ([4e92756](https://github.com/faisalkhan91/Fluxus/commit/4e92756e55f5f719f0bad9558c8a690d97232b01))
* update CI workflows and ignore CHANGELOG.md in Prettier ([73676d0](https://github.com/faisalkhan91/Fluxus/commit/73676d0a53bdc63561f2f47c84af11200b3a3e01))
* update configuration and improve error handling ([606d0eb](https://github.com/faisalkhan91/Fluxus/commit/606d0eb539cedbb24754b48ac7590fa4395ef0c1))
* update dependencies and enhance blog post error handling ([0afc52b](https://github.com/faisalkhan91/Fluxus/commit/0afc52b4bdaac10f539b7be57ee758ca0a0d584c))
* update Docker and NGINX configurations ([413713f](https://github.com/faisalkhan91/Fluxus/commit/413713fa2ad449f702870f7d1d81edee9d36d3a6))
* Update Docker publish workflow actions to latest versions ([7037b30](https://github.com/faisalkhan91/Fluxus/commit/7037b3039365b8c99eabb28e480d002aae21fdfe))
* Update Docker publish workflow to checkout Homelab monorepo and update Kubernetes manifest with new image tag ([9ece076](https://github.com/faisalkhan91/Fluxus/commit/9ece0762b8f8913ff0f83fb55f74cf5781a70d77))
* Update Dockerfile and package-lock.json for Angular 24 compatibility ([0805d5a](https://github.com/faisalkhan91/Fluxus/commit/0805d5a1c899fcfd5dae366cfb6c0c2868488cb9))
* Update Karma configuration to allow empty test suites ([a918791](https://github.com/faisalkhan91/Fluxus/commit/a918791c5be364ddec84916d76ad89dbc9b77021))
* Update live link in README to point to new domain ([b41c7e9](https://github.com/faisalkhan91/Fluxus/commit/b41c7e9f706b4866f7c7443fbbb8bcfaabba9e14))
* Update package-lock.json version to 1.1.0 and optimize CSS imports ([6451f2b](https://github.com/faisalkhan91/Fluxus/commit/6451f2b45dd83e1be4ae0146d767ed9c07fbe6f5))
* Update README and CHANGELOG for Angular 21 migration and new features ([dddf018](https://github.com/faisalkhan91/Fluxus/commit/dddf018e17ee849868e8b627dcff60360eb85224))
* update TypeScript version and remove unused Angular dependency ([2009d51](https://github.com/faisalkhan91/Fluxus/commit/2009d512b0a5ed94e2288fbf98afc88c7e8a8768))
* Update version to 1.1.0 for Angular 18 release ([0ddcff8](https://github.com/faisalkhan91/Fluxus/commit/0ddcff88995b7b947a5cf37bb558a3b4019eb86c))
* Upgrade Angular dependencies to version 18 and update TypeScript configuration ([1a37993](https://github.com/faisalkhan91/Fluxus/commit/1a37993831b91c12cf5af3b4b717e999ac5772ad))


### Refactoring

* **main:** remove unnecessary comments from main application entry point ([a4d7a07](https://github.com/faisalkhan91/Fluxus/commit/a4d7a07d3fbe26d40d1a43b8f2796c9a977bfb49))
* Relocate all FluxusUI files to the root directory ([7855150](https://github.com/faisalkhan91/Fluxus/commit/785515058fff117a28e8c5812956c0701990ba12))
* update Angular configuration and testing setup ([6ab8573](https://github.com/faisalkhan91/Fluxus/commit/6ab8573154b0af86ba5da34017ce0af360627a22))
* Upgrade Angular dependencies and restructure application setup ([f077b83](https://github.com/faisalkhan91/Fluxus/commit/f077b83790f113e3ca03dbe7f7e69bd957252e4d))


### Documentation

* Revamp README.md to enhance project description, features, tech stack, and setup instructions ([da9656f](https://github.com/faisalkhan91/Fluxus/commit/da9656f2ec34f11d2b927eb70af89243a3b89f4a))

## [Unreleased]

### Added

- Comprehensive unit test suite for all feature and UI components (Vitest + jsdom)
- `TrustedHtmlPipe` for safe HTML rendering in blog posts
- `slugify` utility for generating valid HTML IDs from dynamic content
- `HEALTHCHECK` instruction in Dockerfile polling `/healthz` endpoint
- Centralized NGINX security headers via `security-headers.conf` include
- `/healthz` health check endpoint in NGINX config
- Dependabot configuration for npm, Docker, and GitHub Actions (`.github/dependabot.yml`)
- `CODEOWNERS` file for automatic PR reviewer assignment
- Pull request template with review checklist
- `release-please-config.json` and `.release-please-manifest.json` for explicit Release Please configuration
- Multi-architecture Docker builds (`linux/amd64`, `linux/arm64`)
- Build artifact upload in CI workflow (7-day retention)
- Environment files with `siteUrl` and `siteName` constants

### Changed

- Pinned Dockerfile base images by SHA256 digest for reproducible builds
- Pinned all GitHub Actions by commit SHA
- Release Please workflow updated to use config-file/manifest-file mode
- Docker publish GitOps steps now conditional on `HOMELAB_PERSONAL_ACCESS_TOKEN` secret
- Enabled `optimization.fonts: true` in Angular production config for font inlining
- Replaced hardcoded URLs with `environment.siteUrl` / `environment.siteName`
- Replaced `typeof window` checks with `isPlatformBrowser()` in `MediaQueryService`
- Refactored `bypassSecurityTrustHtml` usage to `TrustedHtmlPipe` with strict CSP
- Added `datetime` attributes to all `<time>` elements
- Replaced invalid nested `<button>` in editor tab bar with semantic `<button>` + `role="tab"`
- Fixed `aria-labelledby` references with dynamically generated valid IDs via `slugify`
- Added ARIA attributes (`aria-controls`, `aria-selected`, `role`) to interactive components
- Updated README with Testing, CI/CD, Docker HEALTHCHECK, and Dependabot documentation

### Fixed

- Nested interactive element violations (button-in-button, anchor-wrapping-button)
- Missing `aria-labelledby` target IDs on section headers
- Invalid HTML IDs containing spaces in Skills and Projects components
- Blog post rendering raw HTML for non-existent posts (now shows error state)
- Redundant `role="main"` on semantic `<main>` element

### Security

- Added Trivy vulnerability scanning with `.trivyignore` for known base image CVEs
- Docker images pinned by digest to prevent supply-chain substitution
- All CI actions pinned by commit SHA

## [1.3.0](https://github.com/faisalkhan91/Fluxus/compare/v1.2.4...v1.3.0) (2026-04-04)

### Features

* Major config changes ([a710005](https://github.com/faisalkhan91/Fluxus/commit/a710005c033a41926d858d406196b3f563c0fbf2))

### Changed

- Migrated from Zone.js-based to zoneless change detection (Angular 21 default) — ~33KB bundle reduction, 30-40% rendering improvement
- Replaced `provideZoneChangeDetection()` with `provideBrowserGlobalErrorListeners()` in app config
- Migrated test runner from Karma/Jasmine to Vitest (Angular 21 default)
- Updated TypeScript from `^5.5.0` to `~5.9.0` (latest supported by Angular 21 toolchain)
- Updated `@types/node` from `^20.17.19` to `^24.12.2`
- Updated `typecheck` script to scope to `tsconfig.app.json`

### Removed

- `zone.js` dependency and polyfill
- `@angular/platform-browser-dynamic` (unused, app uses standalone bootstrap)
- Karma, Jasmine, and related dev dependencies (`karma`, `karma-chrome-launcher`, `karma-coverage`, `karma-jasmine`, `karma-jasmine-html-reporter`, `jasmine-core`, `@types/jasmine`)
- Legacy `karma.conf.js`, `src/test.ts`, `src/polyfills.ts`

### Added

- `vitest` and `jsdom` dev dependencies
- Baseline `app.component.spec.ts` for Vitest
- AI/LLM context files (`.ai/`, `.cursor/rules/`)

## [1.2.4](https://github.com/faisalkhan91/Fluxus/compare/v1.2.3...v1.2.4) (2026-04-04)

### Bug Fixes

- force release pipeline to trigger ([814a3a8](https://github.com/faisalkhan91/Fluxus/commit/814a3a80e48dde63b7e7e9586ab64d5db1680503))

### Changed

- Synchronized production build and deployment pipeline state via changelog alignment
- Rewrote `nginx.conf` with SSG-aware routing, gzip, granular cache policies, custom 404, `server_tokens off`
- Cache strategy: immutable 1-year for hashed JS/CSS/fonts; 1-year for images; `no-cache` for HTML/manifest/sitemap
- Disabled font inlining (`optimization.fonts: false`) to eliminate build-time Google Fonts dependency
- Updated Angular to 21.2.7, RxJS to 7.8.2, Express to 5.2.1
- Rewrote `README.md` and `CHANGELOG.md` to follow 2026 best practices

### Added

- Multi-stage Dockerfile with `node:24-alpine` builder and `nginxinc/nginx-unprivileged:1.27-alpine` runtime
- BuildKit optimizations: `--mount=type=cache` for npm, `COPY --link` for layer independence
- OCI image labels (`org.opencontainers.image.*`)
- `.dockerignore` excluding build artifacts and metadata
- Adaptive SVG favicon with dark/light mode via `prefers-color-scheme`
- Multi-size `favicon.ico` (16/32/48), `apple-touch-icon.png`, PWA manifest icons (192/512)

### Fixed

- Resolved `NotYetImplemented` error in `IconComponent` during SSG prerendering
- Custom 404 returns HTTP 404 via `index.csr.html` copied as `404.html`

### Security

- Added CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy in NGINX

## [1.2.3](https://github.com/faisalkhan91/Fluxus/compare/v1.2.2...v1.2.3) (2026-04-04)

### Bug Fixes

- **security:** ignore known base image vulnerabilities in Trivy scan ([26f705e](https://github.com/faisalkhan91/Fluxus/commit/26f705ee7021c7e0a16191b45d9707fb04867765))

## [1.2.2](https://github.com/faisalkhan91/Fluxus/compare/v1.2.1...v1.2.2) (2026-04-04)

### Bug Fixes

- **core:** bootstrap application and core runtime initialization logic ([9e3e0a3](https://github.com/faisalkhan91/Fluxus/commit/9e3e0a3b37dbcb25094699323a54f462493b88b0))

## [1.2.1](https://github.com/faisalkhan91/Fluxus/compare/v1.2.0...v1.2.1) (2026-04-03)

### Bug Fixes

- remove obsolete CI error fix patch and update Karma configuration ([93bebe2](https://github.com/faisalkhan91/Fluxus/commit/93bebe2e51d855ef2cde94978531c3c009e5558a))
- resolve CI lint errors and setup-node deprecation ([bdf4418](https://github.com/faisalkhan91/Fluxus/commit/bdf441858ea36cd8055cf36e705952dba656a2f1))

## [1.2.0](https://github.com/faisalkhan91/Fluxus/compare/v1.1.0...v1.2.0) (2026-04-03)

### Features

- Add adjacent post navigation and reading progress indicator to blog post component ([01ae611](https://github.com/faisalkhan91/Fluxus/commit/01ae611a554eb24861c3b12c3ea2e85300e084d4))
- Add adjacent post navigation and reading progress indicator to blog post component ([4e8c342](https://github.com/faisalkhan91/Fluxus/commit/4e8c342dfdad2404ad99d2930d346c5b017de3bc))
- Add blog feature with routing and styling enhancements ([55e33a6](https://github.com/faisalkhan91/Fluxus/commit/55e33a696f404f579803b495129715c0555b50c7))
- Add custom Nginx configuration for SPA routing in Dockerfile ([503094d](https://github.com/faisalkhan91/Fluxus/commit/503094d50c23fa1505374fd0895f73d7eaf46e22))
- Add new blog post on Angular Signals state management ([00c07ad](https://github.com/faisalkhan91/Fluxus/commit/00c07ad18560a42a86faf04d26411f10ea88c86d))
- Enhance Angular configuration and improve server-side rendering support ([ca045b8](https://github.com/faisalkhan91/Fluxus/commit/ca045b8d2f1473c8ab8075bdeace788c7fcb21e3))
- Enhance navigation and tab functionality with new home link and close tab logic ([f369a69](https://github.com/faisalkhan91/Fluxus/commit/f369a699907e467b2786535326854093144b48f6))
- Enhance SEO and accessibility features across the application ([561b70c](https://github.com/faisalkhan91/Fluxus/commit/561b70c7a5a84cdee38fb38ce565e5a197c81f23))
- Enhance SEO and styling across the application ([d9e9c96](https://github.com/faisalkhan91/Fluxus/commit/d9e9c96660838c15d4667cc1912d685d2943af8c))
- Enhance SEO and styling across the application ([02cc35b](https://github.com/faisalkhan91/Fluxus/commit/02cc35bab5374b0dfffa5247efae82739e5a1d48))
- Enhance styling and functionality across various components ([a3b965d](https://github.com/faisalkhan91/Fluxus/commit/a3b965dfe6b5eb635664bb68c87bdc3f2767d1cc))
- Improve icon component to handle server-side rendering ([489c8e0](https://github.com/faisalkhan91/Fluxus/commit/489c8e0a836924c74d0f55c33781715819f39318))
- Improve user profile and SEO details for enhanced visibility ([7e23b2a](https://github.com/faisalkhan91/Fluxus/commit/7e23b2a549de5c49135aefeab47dbdd80f926168))
- Optimize Angular build and enhance NGINX configuration ([165ba6a](https://github.com/faisalkhan91/Fluxus/commit/165ba6ac74f432a1c3ea7d8f3efb88847f21761b))
- Update profile and SEO details to reflect senior role and experience ([8d38c25](https://github.com/faisalkhan91/Fluxus/commit/8d38c2596939ec4c04b5b836d9c25b020d2fcaa9))

### Bug Fixes

- Remove unnecessary peer dependencies from package-lock.json ([60ad0b6](https://github.com/faisalkhan91/Fluxus/commit/60ad0b6e9a661b0e440016099c820d820fbac699))
- resolve SSR NotYetImplemented error in IconComponent ([44eef70](https://github.com/faisalkhan91/Fluxus/commit/44eef70e1210d746408f76e0aeb66e315320576e))

## [1.2.0] - 2026-04-01

### Added

- SEO suite: per-route `<title>`, `og:*`, `twitter:*` meta tags, canonical URLs, `sitemap.xml`, `robots.txt`
- Blog engine with Markdown posts, syntax-highlighted code blocks, reading progress bar, and prev/next navigation
- Post-build script (`scripts/inject-blog-meta.mjs`) to inject post-specific OG/Twitter tags into prerendered blog HTML
- Blog posts: Angular Signals state management, Cloud-Native CI/CD pipelines, and a blog post template
- Skip-to-content link, `id="main-content"` on `<main>`, WCAG AA focus styles, ARIA attributes on all interactive elements
- Noscript fallback in `index.html`
- Web manifest (`src/site.webmanifest`) with PWA metadata
- Google Fonts loading via `<link rel="preconnect">` + `<link rel="stylesheet">`

## [1.1.1] - 2026-03-31

### Added

- SSG (Static Site Generation) via `outputMode: "static"` with 12 prerendered routes
- Glass Workspace design system with glassmorphism surfaces, sidebar, editor tab bar, and mobile nav pill
- Design tokens as CSS custom properties for surfaces, glass, accent, typography, spacing, and transitions
- Dark/light mode via `ThemeService` with `[data-theme]` attribute on `<html>`
- Reusable UI components: `glass-card`, `glass-panel`, `glow-button`, `sidebar`, `mobile-nav-pill`, `editor-tab-bar`, `icon`, `section-header`, `skill-badge`, `timeline`, `bottom-sheet`
- Navigation services: `TabService`, `NavigationService`, `MediaQueryService` with reactive breakpoint signals
- Initial Dockerfile and NGINX config for containerized deployment
- GitHub Actions workflow for Docker publish
- Gemini coding conventions file

### Changed

- Migrated from Angular 18 to Angular 21.2.6
- Rewrote architecture to standalone components, signals, `OnPush` change detection, `inject()`, `input()`/`output()` functions
- Refactored header and profile components for design consistency
- Restructured lazy-loaded feature routes inside `ShellComponent`

## [1.1.0] - 2025-09-05

### Changed

- Upgraded from Angular 16 to Angular 18.2.13
- Updated TypeScript to 5.4.5 with ES2022 target
- Updated Angular CLI to 18.2.20
- Relocated project from subdirectory to root
- Refactored CSS for profile overview, skills, and interests components
- Consolidated profile component styles into main stylesheet
- Refactored CSS variables for colors and gradients

## [1.0.0] - 2023-05-06

### Added

- Profile overview, experience, skills, portfolio, and interests components
- Timeline feature for experience component
- Profile navigation with toggle functionality
- Home component layout

## [0.0.0] - 2021-03-29

### Added

- Initial portfolio website built with Angular 16
- Landing page, header, navigation, and profile components
- Responsive design with color scheme iterations
- Routing setup and component styling

[Unreleased]: https://github.com/faisalkhan91/Fluxus/compare/v1.3.0...HEAD
[1.3.0]: https://github.com/faisalkhan91/Fluxus/compare/v1.2.4...v1.3.0
[1.2.0]: https://github.com/faisalkhan91/Fluxus/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/faisalkhan91/Fluxus/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/faisalkhan91/Fluxus/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/faisalkhan91/Fluxus/compare/v0.0.0...v1.0.0
[0.0.0]: https://github.com/faisalkhan91/Fluxus/releases/tag/v0.0.0
