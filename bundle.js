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
    pokemon: new Set(),
    items: new Set(),
    battle: new Set(),
}

/* overrides */ {
    KeyItemController.showGainModal = function () { };
    SpecialEventRequirement.prototype.isCompleted = function () { return false }
}

function updateRouteInfo() {
    const region = GameConstants.Region.kanto;
    const datas = regionGuide[region] = [];

    function newData() {
        return {
            region: '',
            area: '',
            pokemon: [],
            key: [],
            shops: [],
            needed: []
        }
    }

    //#region Calculators
    function getRegionFromTown(town) {
        const t = TownList[town]
        if (!t) 
            return ''
        return SubRegions.getSubRegionById(t.region, t.subRegion || 0).name
    }

    function checkTown(index, data) {
        const t = towns[index];
        if (!t.isUnlocked())
            return false;

        data.region = SubRegions.getSubRegionById(t.region, t.subRegion || 0).name
        data.area = t.name
        datas.push(data)

        t.content.forEach(c => {
            switch (c.constructor.name) {
                // find new items to buy
                case 'Shop': {
                    c.items.forEach((i) => {
                        switch (i.constructor.name) {
                            case "BattleItem":
                                break;
                            case "PokemonItem": {
                                if (!done.pokemon.has(i.name)) {
                                    done.pokemon.add(i.name)
                                    data.shops.push(i.name);
                                }
                                break
                            }
                            case "BuyKeyItem": {
                                i.gain(1);
                                done.items.add(i.name)
                                done.items.add(i._displayName)
                                data.key.push(i._displayName);
                            }
                            default: {
                                if (!done.items.has(i.name)) {
                                    i.gain(1);
                                    done.items.add(i.name)
                                    done.items.add(i._displayName)
                                    data.shops.push(i._displayName);
                                }
                            }
                        }
                    })
                }
                case 'Gym': {
                    checkGym(t.name, newData())
                    break
                }
                case 'TemporaryBattle': {
                    checkBattle(c.name, newData())
                    break
                }
            }
        });

        return true;
    }
    function checkRoute(index, data) {
        const r = routes[index]
        if (!r.isUnlocked()) {
            return false;
        }

        data.region = SubRegions.getSubRegionById(r.region, r.subRegion || 0).name
        data.area = r.routeName.replace(`${data.region} Route`, "")
        datas.push(data)

        // find new pokemon
        r.pokemon.land.forEach(p => {
            if (!done.pokemon.has(p)) {
                data.pokemon.push(p)
                done.pokemon.add(p)
            }
        })

        App.game.statistics.routeKills[r.region][r.number](100)
        return true
    }
    function checkDungeon(index, data) {
        const d = dungeonList[index];
        if (!d.isUnlocked()) {
            return false
        }

        data.region = getRegionFromTown(index) 
        data.area = d.name;
        datas.push(data)

        // find new pokemon as encounter
        d.pokemonList.forEach(p => {
            if (!done.pokemon.has(p)) {
                data.pokemon.push(p)
                done.pokemon.add(p)
            }
        })
        // find new pokemon as boss (wihtout events)
        d.bossList.forEach(e => {
            if (e.constructor.name === "DungeonBossPokemon" && e.options?.requirement == null && !done.pokemon.has(e.name)) {
                data.pokemon.push(e.name)
                done.pokemon.add(e.name)
            }
        })

        const dungeon_index = GameConstants.RegionDungeons.flat().indexOf(d.name);
        App.game.statistics.dungeonsCleared[dungeon_index](1000)
        return true;
    }
    function checkGym(index, data) {
        const g = GymList[index];
        if (!g || !g.isUnlocked() || !g.parent.isUnlocked()) {
            return false;
        } else if (g.clears()) {
            return true
        }

        data.region = getRegionFromTown(index) 
        data.area = `${g.town}'s gym`
        datas.push(data)

        GymBattle.gym = g;
        g.firstWinReward();

        App.game.statistics.gymsDefeated[GameConstants.getGymIndex(index)](200);
        return true
    }
    function checkBattle(index, data) {
        const b = TemporaryBattleList[index]
        if (!b.isUnlocked()) {
            return false
        } else if (done.battle.has(b.name)) {
            return true
        }

        data.region = getRegionFromTown(b.optionalArgs.returnTown || b.parent.name) 
        data.area = /*b.optionalArgs.displayName ||*/ b.name
        datas.push(data)

        TemporaryBattleRunner.startBattle(b)
        TemporaryBattleRunner.battleWon(b)

        done.battle.add(b.name)
        return true
    }
    function checkQuest(questLine) {

        const current = questLine.curQuestObject()

        if (current.dungeon) {
            const dungeon_index = GameConstants.RegionDungeons.flat().indexOf(current.dungeon);
            const current_clear = App.game.statistics.dungeonsCleared[dungeon_index]()

            if (current_clear > 0) {
                App.game.statistics.dungeonsCleared[dungeon_index](current_clear + 1)
            }
        } else if (current.gymTown) {
            const gym_index = GameConstants.getGymIndex(current.gymTown)
            const current_clear = App.game.statistics.gymsDefeated[gym_index]()
            
            if (current_clear > 0) {
                App.game.statistics.gymsDefeated[gym_index](current_clear + 1);
            }
        }

        // console.log(questLine.curQuestObject())

        return questLine.state() === QuestLineState.ended
    }
    //#endregion

    const towns = Object.values(TownList).filter(t => t.region === region)
    const routes = Routes.getRoutesByRegion(region)
    const dungeons = GameConstants.RegionDungeons[region]
    const gyms = GameConstants.RegionGyms[region]
    const battles = GameConstants.TemporaryBattles
    const quests = App.game.quests.questLines()
    const keys = new Set(App.game.keyItems.itemList)

    let idx = tdx = rdx = ddx = gdx = bdx = 0, qdx = 1;

    do {

        App.game.quests.questLines().forEach((q)=>{
            if (q.state() === QuestLineState.started) {
                checkQuest(q)
            }
        })

        if (checkTown(tdx, newData())) {
            tdx++
        } else if (checkGym(gyms[gdx], newData())) {
            gdx++
        } else if (checkBattle(battles[bdx], newData())) {
            bdx++
        } else if (checkDungeon(dungeons[ddx], newData())) {
            ddx++
        } else if (checkRoute(rdx, newData())) {
            rdx++
        }

        for (k of keys) {
            if (k.isUnlocked()) {
                if (!done.items.has(k.displayName)) {
                    datas[idx].key.push(k.displayName);
                    done.items.add(k.displayName);
                }
                keys.delete(k)
            }
        }

        requestAnimationFrame(() => {
            $('#receiveBadgeModal').modal('hide')
            $('#questStepClearedModal').modal('hide')
        })
    } while (idx++ < datas.length)

    console.log(gyms[gdx], battles[bdx], dungeons[ddx])
}

module.exports = {
    updateRouteInfo,
    getRegion: (r) => regionGuide[r]
}

},{}],5:[function(require,module,exports){
const { applyDatatables } = require('../pokeclicker-wiki/scripts/datatables')

function mergeGridCells() {
    var dimension_col = 0;

    $('.table:has(thead)').each((_, element) => {
        var first_instance = null;
        var rowspan = 1;

        $(element).find('tr').each(function () {

            // find the td of the correct column (determined by the dimension_col set above)
            var dimension_td = $(this).find(`td:nth-child(${dimension_col + 1})`);

            if(!dimension_td) {
                return;
            }

            if (first_instance == null) {
                // must be the first row
                first_instance = dimension_td;
            } else if (dimension_td.text() == first_instance.text()) {
                // the current td is identical to the previous
                // remove the current td
                dimension_td.remove();
                // increment the rowspan attribute of the first instance
                first_instance.attr('rowspan', ++rowspan);
            } else {
                // this cell is different from the last
                first_instance = dimension_td;
                rowspan = 1;
            }
        })
    })
    //         var dimension_cells = new Array();
    //         var dimension_col = null;
    //         var columnCount = $(element, "tr:first th").length;

    // console.log(columnCount)

    //         for (dimension_col = 0; dimension_col < columnCount; dimension_col++) {
    //             // first_instance holds the first instance of identical td
    //             var first_instance = null;
    //             var rowspan = 1;
    //             // iterate through rows
    //             $("#example").find('tr').each(function () {

    //                 // find the td of the correct column (determined by the dimension_col set above)
    //                 var dimension_td = $(this).find('td:nth-child(' + dimension_col + ')');

    //                 if (first_instance == null) {
    //                     // must be the first row
    //                     first_instance = dimension_td;
    //                 } else if (dimension_td.text() == first_instance.text()) {
    //                     // the current td is identical to the previous
    //                     // remove the current td
    //                     dimension_td.remove();
    //                     ++rowspan;
    //                     // increment the rowspan attribute of the first instance
    //                     first_instance.attr('rowspan', rowspan);
    //                 } else {
    //                     // this cell is different from the last
    //                     first_instance = dimension_td;
    //                     rowspan = 1;
    //                 }
    //             });
    //         }
    //     })
}

module.exports = {
    applyDatatables: function () {
        applyDatatables();
        mergeGridCells();
    },
}

},{"../pokeclicker-wiki/scripts/datatables":1}],6:[function(require,module,exports){
// import our version etc
const package = require('../pokeclicker/package.json');

// pokeclicker-wiki/scripts/game break Requirement completion so we put it back
const oldComplete = Requirement.prototype.isCompleted 

window.Guide = {
    package,
    ...require('./datatables'),
    ...require('./manual'),
    ...require('../pokeclicker-wiki/scripts/game'),
    ...require('./data'),
    ...require('./navigation'),
}

Requirement.prototype.isCompleted = oldComplete;
},{"../pokeclicker-wiki/scripts/game":2,"../pokeclicker/package.json":3,"./data":4,"./datatables":5,"./manual":7,"./navigation":8}],7:[function(require,module,exports){
function swap(array, index_a, index_b)
{
    const tmp = array[index_a]
    array[index_a] = array[index_b]
    array[index_b] = tmp
}

TownList['Route 4 Pokémon Center'].name = 'Route 3 Pokémon Center'
TownList["Bill's House"].requirements.push(new RouteKillRequirement(10, 0, 5))
TownList["Vermilion City"].requirements.push(new TemporaryBattleRequirement("Blue 3"))
TownList["Saffron City"].requirements.push(new ClearDungeonRequirement(1, GameConstants.RegionDungeons.flat().indexOf('Rocket Game Corner')))
TemporaryBattleList['Snorlax route 16'].requirements.push(new RouteKillRequirement(10, 0, 15))
TownList["Fuchsia City"].requirements.push(new RouteKillRequirement(10, 0, 18))

swap(GameConstants.TemporaryBattles, 6, 7) // exchange Snorlax 16 and Blue 5
swap(GameConstants.TemporaryBattles, 5, 6) // exchange Snorlax 12 and Blue 5
},{}],8:[function(require,module,exports){
const { applyDatatables } = require('./datatables');
const { updateRouteInfo } = require('./data');

const applyBindings = ko.observable(false);

$('document').off('ready');
$(document).ready(() => {

  ko.applyBindings({}, document.getElementById('nav-bar'));
  ko.applyBindings({}, document.getElementById('settings-modal'));
  ko.applyBindings({}, document.getElementById('questStepClearedModal'));

  applyBindings.subscribe((v) => {
    // Unbind and re-bind knockout
    if (v) {
      applyBindings(false);
      ko.cleanNode(document.getElementById('wiki-page-content'));
      ko.applyBindings({}, document.getElementById('wiki-page-content'));
      applyDatatables();
    }
  });

  updateRouteInfo();

  const pageElement = $('#wiki-page-content');
  $.get("./pages/region.html", (data) => {
    pageElement.html(data);
    applyBindings(true);
  })
});

},{"./data":4,"./datatables":5}]},{},[6]);
