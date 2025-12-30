(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
// Applying datatables to all tables on the page (with some exceptions)
const applyDatatables = () => {
    // Any table with headers
    $('.table:has(thead)').each((i, element) => {
        try {
            const rows = element.getElementsByTagName('tr').length;
            // Don't process these as datatables cannot handle them
            const doNotProcess = element.querySelectorAll('[colspan],[rowspan],.no-data-tables').length || element.classList.contains('no-data-tables');

            // Don't process anything with less than 40 rows
            if (doNotProcess) return;

            // Bootstrap style tables, with responsive table
            let dom = `<'row'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6'f>><'row table-responsive'<'col-sm-12'tr>><'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7 text-center'p>>`;
                // How many items per page
            let pageLength = 25;
            // How to order our pages
            let order = [[0, 'asc']];

            // If we have less than 40 rows, we don't need pagination, but table will still be sortable
            if (rows < 40) {
                pageLength = 40;
                dom = `<'row'<'col-sm-12 col-md-6'><'col-sm-12 col-md-6'>><'row table-responsive'<'col-sm-12'tr>><'row'<'col-sm-12 col-md-5'><'col-sm-12 col-md-7 text-center'>>`
                order = [];
            }

            $(element).DataTable({
                // Remember page/search/order
                stateSave: true,
                stateSaveCallback: function(settings, data) {
                    sessionStorage.setItem(`DataTables_${Wiki.pageType()}_${Wiki.pageName()}_${i}`, JSON.stringify(data));
                    // Only keep tables position if on same page type/parent
                    Object.keys(sessionStorage).forEach((key) => {
                        if (key.startsWith('DataTables') && !key.includes(Wiki.pageType())) {
                            delete sessionStorage[key];
                        }
                    })
                },
                stateLoadCallback: function(settings) {
                    return JSON.parse(sessionStorage.getItem(`DataTables_${Wiki.pageType()}_${Wiki.pageName()}_${i}`) || '{}');
                },
                dom,
                pageLength,
                order,
                // Our custom page implementation
                pagingType: 'simple_numbers_no_ellipses',
                // Adjust text
                language: {
                  paginate: {
                    previous: '←',
                    next: '→',
                  }
                }
            });

            // Setup a custom handler to reset sort order after descending instead of going back to ascending
            // Accomplished by finding and intercepting the mutation of the sorting th's class from desc to asc
            const tableId = element.id;
            const callback = (mutationList) => {
                for (const mutation of mutationList) {
                    if (mutation.type === "attributes" &&
                        mutation.attributeName == "class" &&
                        mutation.oldValue.includes("sorting_desc") &&
                        mutation.target.classList.contains("sorting_asc")
                    ) {
                        $(`#${tableId}`).DataTable().order.neutral().draw();
                    }
                }
            };
            document.querySelectorAll(`#${tableId} th.sorting`).forEach((el) => {
                new MutationObserver(callback).observe(el, { attributes: true, attributeFilter: ['class'], attributeOldValue: true });
            });
        } catch(e){}
    });
}

/* CUSTOM DATA TABLES STUFF */

// Hide any error messages that may appear (remove this line for debugging)
$.fn.dataTable.ext.errMode = 'none';

// Adjust how page numbers are shown
$.fn.DataTable.ext.pager.simple_numbers_no_ellipses = (page, pages) => {
    // how many buttons total (excluding next/prev buttons)
    const buttons = 5; // Limit to 5 so it should be fine on mobile
    const half = Math.floor( buttons / 2 );

    page = Math.max(0, page - half);
    const count = Math.min(pages - page, buttons);
    const numbers = [];
    for (let i = 0; i < count; i++){
        numbers.push(page++);
    }

    numbers.DT_el = 'span';

    return [ 'previous', numbers, 'next' ];
};

module.exports = {
    applyDatatables,
}

},{}],2:[function(require,module,exports){
/*
Initializing anything we need from the game files
*/

// Add bootstrap 5 themes (needs to load early)
themes = Settings.getSetting('theme');
themes.options.push(new SettingOption('Morph', 'morph'));
themes.options.push(new SettingOption('Quartz', 'quartz'));
themes.options.push(new SettingOption('Vapor', 'vapor'));
themes.options.push(new SettingOption('Zephyr', 'zephyr'));

const now = new Date();
if (now.getMonth() == 3 && now.getDate() == 1) {
  themes.options.forEach((t) => {
  t.value = "sketchy";
  });
  themes.set("sketchy");
  themes.options.push(new SettingOption("Definitely Not Sketchy", "sketchy"));
}
themes.options.sort((a, b) => (a.text).localeCompare(b.text));

// Suppress game notifications
Notifier.notify = () => {};

// Ensure requirements are never satisfied so they are always shown
Requirement.prototype.isCompleted = () => false;

// Not sure why but this was causing an error on load after the v0.10.22 update
SortModules = () => {};

// Custom binds as these aren't loaded
player = new Player();
player.highestRegion(1);
const multiplier = new Multiplier();
App.game = new Game(
  new Update(),
  new Profile(),
  new Breeding(multiplier),
  new Pokeballs(),
  new PokeballFilters(),
  new Wallet(multiplier),
  new KeyItems(),
  new BadgeCase(),
  new OakItems([20, 50, 100], multiplier),
  new OakItemLoadouts(),
  new PokemonCategories(),
  new Party(multiplier),
  new Gems(),
  new Underground(),
  new Farming(multiplier),
  new LogBook(),
  new RedeemableCodes(),
  new Statistics(),
  new Quests(),
  new SpecialEvents(),
  new Discord(),
  new AchievementTracker(),
  new Challenges(),
  new BattleFrontier(),
  multiplier,
  new SaveReminder(),
  new BattleCafeSaveObject(),
  new DreamOrbController()
);
App.game.farming.initialize();
App.game.breeding.initialize();
App.game.oakItems.initialize();
App.game.keyItems.initialize();
App.game.underground.initialize();
App.game.specialEvents.initialize();
QuestLineHelper.loadQuestLines();
BattleFrontierRunner.stage(100);
BattleFrontierBattle.generateNewEnemy();
AchievementHandler.initialize(multiplier, new Challenges());

BerryDeal.generateDeals(now);
GemDeals.generateDeals();
ShardDeal.generateDeals();
GenericDeal.generateDeals();
SafariPokemonList.generateSafariLists(); // This needs to be after anything that generates shopmon due to Friend Safari calcs
Weather.generateWeather(now);

// Farm Simulator
App.game.farming.plotList.forEach((p) => p.isUnlocked = true); // All plots unlocked
App.game.farming.mutations.forEach(m => { // All mutations unlocked
  Object.defineProperty(m, 'unlocked', {
    get: function() { return true; }
  });
});
// Set Oak Items to max level
App.game.oakItems.itemList.forEach((item) => item.level = item.maxLevel);

// Map our requirment hints to the requirement
Requirement.prototype.toJSON = function() {
  const req = this.__proto__.constructor.name === 'LazyRequirementWrapper'
    ? this.unwrap()
    : this;

  return {
    ...Object.fromEntries(Object.entries(req)),
    hint: req.hint(),
    __class: req.__proto__.constructor.name,
  };
};

// Knockout tooltip bindings
ko.bindingHandlers.tooltip = {
  init: (element, valueAccessor) => {
      const local = ko.utils.unwrapObservable(valueAccessor()),
          options = {};

      ko.utils.extend(options, ko.bindingHandlers.tooltip.options);
      ko.utils.extend(options, local);

      $(element).tooltip(options);

      ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
          $(element).tooltip('dispose');
      });
  }
};

Settings.getSetting('theme').observableValue.subscribe(theme => {
  document.body.className = `no-select ${theme}`;
});

},{}],3:[function(require,module,exports){
module.exports={
  "name": "pokeclicker",
  "version": "0.10.25",
  "description": "PokéClicker repository",
  "main": "index.js",
  "scripts": {
    "start": "cross-env NODE_ENV=development gulp",
    "build": "cross-env NODE_ENV=development gulp build",
    "test": "npm-run-all --continue-on-error test-scripts eslint stylelint",
    "test-scripts": "gulp scripts && npm run vitest-nocoverage",
    "vitest": "vitest --run",
    "vitest-nocoverage": "vitest --run --coverage false",
    "eslint": "eslint --ext ts ./src/scripts ./src/modules",
    "eslint-fix": "eslint --ext ts --fix ./src/scripts ./src/modules",
    "stylelint": "stylelint \"./src/**/*.less\" --cache",
    "stylelint-fix": "npm run stylelint -- --fix",
    "website": "npm run tl:update && npm test && cross-env NODE_ENV=production gulp website",
    "publish": "npm test && node publish.js",
    "tl:init": "git submodule update --init",
    "tl:update": "git submodule update --remote",
    "clean": "npm ci && npm run tl:init"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/pokeclicker/pokeclicker.git"
  },
  "babel": {
    "presets": [
      "@babel/preset-env"
    ]
  },
  "author": "RedSparr0w",
  "license": "ISC",
  "bugs": {
    "url": "https://github.com/pokeclicker/pokeclicker/issues"
  },
  "homepage": "https://github.com/pokeclicker/pokeclicker#readme",
  "devDependencies": {
    "@babel/core": "^7.0.0",
    "@babel/preset-env": "^7.0.0",
    "@babel/register": "^7.0.0",
    "@types/bootstrap": "^4.3.1",
    "@types/bootstrap-notify": "^3.1.34",
    "@types/intro.js": "^2.4.7",
    "@types/jquery": "^3.5.16",
    "@types/knockout": "^3.4.66",
    "@types/sortablejs": "^1.10.5",
    "@typescript-eslint/eslint-plugin": "^5.50.0",
    "@typescript-eslint/parser": "^5.50.0",
    "@vitest/coverage-v8": "^3.1.3",
    "bootstrap-notify": "^3.1.3",
    "browser-sync": "^3.0.2",
    "cross-env": "^7.0.2",
    "del": "^5.1.0",
    "es6-promise": "^4.2.8",
    "eslint": "^7.32.0",
    "eslint-config-airbnb-typescript": "^17.0.0",
    "eslint-plugin-import": "^2.22.1",
    "gh-pages": "^6.1.1",
    "gulp": "^4.0.2",
    "gulp-autoprefixer": "^8.0.0",
    "gulp-changed": "^4.0.2",
    "gulp-clean": "^0.4.0",
    "gulp-clean-css": "^4.3.0",
    "gulp-concat": "^2.6.0",
    "gulp-ejs": "^5.1.0",
    "gulp-file-include": "^2.2.2",
    "gulp-filter": "^6.0.0",
    "gulp-less": "^5.0.0",
    "gulp-plumber": "^1.2.1",
    "gulp-rename": "^2.0.0",
    "gulp-replace": "^1.0.0",
    "gulp-size": "^3.0.0",
    "gulp-sourcemaps": "^2.6.5",
    "gulp-stream-to-promise": "^0.1.0",
    "gulp-strip-debug": "^3.0.0",
    "gulp-typescript": "^5.0.1",
    "husky": "^4.3.8",
    "jsdom": "^25.0.0",
    "npm-run-all2": "^6.2.0",
    "postcss-less": "^6.0.0",
    "stylelint": "^15.10.1",
    "stylelint-config-standard-less": "^1.0.0",
    "ts-loader": "^8.0.4",
    "ts-node": "^10.9.1",
    "typescript": "^4.9.5",
    "vitest": "^3.1.3",
    "webpack": "^5.76.0",
    "webpack-cli": "^5.0.1",
    "webpack-stream": "^7.0.0"
  },
  "dependencies": {
    "bootstrap": "^4.5.3",
    "i18next": "^21.9.2",
    "i18next-browser-languagedetector": "^6.1.5",
    "i18next-chained-backend": "^3.1.0",
    "i18next-http-backend": "^1.4.4",
    "intro.js": "^2.9.3",
    "jquery": "^3.5.1",
    "knockout": "^3.5.1",
    "popper.js": "^1.16.0",
    "sortablejs": "^1.10.2"
  },
  "overrides": {
    "clean-css": ">=5.3.1"
  }
}

},{}],4:[function(require,module,exports){

const regionGuide = [];
const done = {
    catch: new Set(),
    route: new Set(),
}

/* overrides */ {
    RouteKillRequirement.prototype.isCompleted = function () {
        return done.route.has(`${this.region}-${this.route}`)
    }
}

/* calculator */ {
    const region = GameConstants.Region.kanto;
    const datas = regionGuide[region] = [];

    const towns = Object.values(TownList).filter(t => t.region === region)
    const routes = Routes.getRoutesByRegion(region)
    const dungeons = GameConstants.RegionDungeons[region]

    while (1) {
        const t = towns[0];
        if (t.isUnlocked()) {
            const _ = {
                region: SubRegions.getSubRegionById(t.region, t.subRegion || 0).name,
                area: t.name,
                items: [],
                catch: []
            }

            datas.push(_);
            towns.shift();
            continue;
        }

        const r = routes[0]
        if (r.isUnlocked()) {
            const _ = {
                region: SubRegions.getSubRegionById(r.region, r.subRegion || 0).name,
                area: r.routeName,
                items: [],
                catch: []
            }

            r.pokemon.land.forEach(p => {
                if (!done.catch.has(p)) {
                    _.catch.push(p)
                    done.catch.add(p)
                }
            })

            // unlock RouteRequirements
            done.route.add(`${r.region}-${r.number}`)

            datas.push(_);
            routes.shift();
            continue;
        }

        // const d = dungeonList[dungeons[0]];
        // if (d.isUnlocked()) {
        //     console.log(d)
        // }

        // console.log(d, d.isUnlocked());
        // console.log(dungeons);

        break;
    }
}

module.exports = {
    getRegion: (r) => regionGuide[r]
}

},{}],5:[function(require,module,exports){
// import our version etc
const package = require('../pokeclicker/package.json');

window.Guide = {
    package,
    ...require('../pokeclicker-wiki/scripts/datatables'),
    ...require('../pokeclicker-wiki/scripts/game'),
    ...require('./data'),
    ...require('./navigation'),
}

},{"../pokeclicker-wiki/scripts/datatables":1,"../pokeclicker-wiki/scripts/game":2,"../pokeclicker/package.json":3,"./data":4,"./navigation":6}],6:[function(require,module,exports){
const applyBindings = ko.observable(false);

$('document').off('ready');
$(document).ready(() => {
  ko.applyBindings({}, document.getElementById('nav-bar'));
  ko.applyBindings({}, document.getElementById('settings-modal'));

  applyBindings.subscribe((v) => {
    // Unbind and re-bind knockout
    if (v) {
      applyBindings(false);
      ko.cleanNode(document.getElementById('wiki-page-content'));
      ko.applyBindings({}, document.getElementById('wiki-page-content'));
      applyDatatables();
    }
  });

    const pageElement = $('#wiki-page-content');
    $.get("./pages/region.html", (data) => {
        pageElement.html(data);
        applyBindings(true);
    }) 
});

},{}]},{},[5]);
