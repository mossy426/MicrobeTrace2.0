# Microbetrace

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 7.0.0.

## Development Environment

Angular CLI: 7.3.10<br />
Node: 12.22.12<br />
Npm: 6.14.16<br />
OS: darwin x64<br />
Angular: 7.2.16<br />
... animations, common, compiler, compiler-cli, core, forms<br />
... language-service, platform-browser, platform-browser-dynamic<br />
... router<br />

Package                           Version
----------------------------------------------------------- 
@angular-devkit/architect         0.13.10<br />
@angular-devkit/build-angular     0.13.10<br />
@angular-devkit/build-optimizer   0.13.10<br />
@angular-devkit/build-webpack     0.13.10<br />
@angular-devkit/core              7.3.10<br />
@angular-devkit/schematics        7.3.10<br />
@angular/cdk                      7.3.2<br />
@angular/cli                      7.3.10<br />
@angular/material                 7.3.2<br />
@ngtools/webpack                  7.3.10<br />
@schematics/angular               7.3.10<br />
@schematics/update                0.13.10<br />
rxjs                              6.3.3<br />
typescript                        3.2.4<br />
webpack                           4.29.0


## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Build angular app on personal github account using gh-pages

1. Fork repo to personal account.
2. Navigate to settings of forked repo.
3. Go to pages in the sidebar.
4. Source should be gh-pages branch and the root folder.

## Update angular web app

1. Checkout angularMigration branch of forked repo.
2. Run npm i angular-cli-ghpages --save-dev  (Only if you dont already have it. This will install globally)
3. Run an npm install to get node modules if not done yet.
4. Make changes to the webapp and test locally.
5. Run ng build --prod --optimization=false --base-href "https://YOURusername.github.io/MicrobeTrace/"
6. Run npx ngh --dir dist/Microbetrace
7. Updates will be visible in 5-10 minutes.

IMPORTANT before building dist folder - If adding new assets that are loaded via filepath in the app (.ie src="assets/images/Logo.png"), follow these steps:
1. Add the asset filepath to the "assets" array in the angular.json file.
2. When referencing the asset in the code, modify the filepath to use the appRootUrl() function, which depending on whether the app is running locally or online, generates the correct path to the root where the assets are located. For example, when loading a newly imported image, I should make the "src" value [src]="appRootUrl() + 'assets/images/Logo.png'", instead of src="assets/images/Logo.png".

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
