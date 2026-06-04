// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const prettierConfig = require('eslint-config-prettier');

module.exports = defineConfig([
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
      prettierConfig,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: ['app'],
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: ['app', ''],
          style: 'kebab-case',
        },
      ],

      // === best-practices.md conformance ratchet ===
      // The codebase already follows all of these; encoding them as lint
      // errors stops the standards from silently drifting back. Each maps
      // to a rule in .ai/best-practices.md.

      // "verbatimModuleSyntax ... pure-interface imports must use import type"
      // — enforced at the compiler level too, but the lint rule auto-fixes
      // and keeps the separate-statement style the codebase already uses.
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      // (OnPush is the v22 default under our zoneless setup — explicit
      // changeDetection is no longer required, so the prefer-on-push rule is
      // dropped to match the refreshed .ai conventions.)
      // "Use signals for state" / "input() and output() functions instead of decorators"
      '@angular-eslint/prefer-signals': 'error',
      // "Use the inject() function instead of constructor injection"
      '@angular-eslint/prefer-inject': 'error',
      // "Do NOT use @HostBinding/@HostListener — put bindings in host object"
      '@angular-eslint/prefer-host-metadata-property': 'error',
      // NOTE: @angular-eslint/no-uncalled-signals (catches a signal used
      // without () in a binding) needs type-aware linting (parserOptions
      // projectService), which would slow CI lint — deferred as an opt-in.
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {
      // "Use native control flow (@if/@for/@switch) instead of *ngIf/*ngFor/*ngSwitch"
      '@angular-eslint/template/prefer-control-flow': 'error',
      // "Use NgOptimizedImage for all static images"
      '@angular-eslint/template/prefer-ngsrc': 'error',
      // Cleanliness + bug-catchers that align with the codebase's style.
      '@angular-eslint/template/prefer-self-closing-tags': 'error',
      '@angular-eslint/template/no-empty-control-flow': 'error',
    },
  },
]);
