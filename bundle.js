(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/*
Initializing anything we need from the game files
*/

// Add bootstrap 5 themes (needs to load early)
themes = Settings.getSetting('theme');
themes.options.push(new SettingOption('Morph', 'morph'));
themes.options.push(new SettingOption('Quartz', 'quartz'));
themes.options.push(new SettingOption('Vapor', 'vapor'));
themes.options.push(new SettingOption('Zephyr', 'zephyr'));
themes.options.sort((a, b) => (a.text).localeCompare(b.text));

// Suppress game notifications
Notifier.notify = () => {};

// Ensure weather never satisfies requirements so they are always shown
Weather.currentWeather = () => -1;

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

const now = new Date();
DailyDeal.generateDeals(5, now);
BerryDeal.generateDeals(now);
GemDeal.generateDeals();
ShardDeal.generateDeals();
SafariPokemonList.generateSafariLists(); // This needs to be after anything that generates shopmon due to Friend Safari calcs

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

},{}],2:[function(require,module,exports){
module.exports={
  "name": "pokeclicker",
  "version": "0.10.18",
  "description": "PokéClicker repository",
  "main": "index.js",
  "scripts": {
    "start": "cross-env NODE_ENV=development gulp",
    "test": "npm run ts-test && npm run eslint && npm run stylelint && npm run vitest",
    "ts-test": "gulp scripts",
    "vitest": "vitest --run",
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
      "env"
    ]
  },
  "author": "RedSparr0w",
  "license": "ISC",
  "bugs": {
    "url": "https://github.com/pokeclicker/pokeclicker/issues"
  },
  "homepage": "https://github.com/pokeclicker/pokeclicker#readme",
  "devDependencies": {
    "@types/bootstrap": "^4.3.1",
    "@types/bootstrap-notify": "^3.1.34",
    "@types/gtag.js": "0.0.4",
    "@types/intro.js": "^2.4.7",
    "@types/jquery": "^3.5.16",
    "@types/knockout": "^3.4.66",
    "@types/sortablejs": "^1.10.5",
    "@typescript-eslint/eslint-plugin": "^5.50.0",
    "@typescript-eslint/parser": "^5.50.0",
    "@vitest/coverage-c8": "^0.29.8",
    "babel-core": "^6.26.3",
    "babel-preset-env": "^1.7.0",
    "babel-register": "^6.26.0",
    "bootstrap-notify": "^3.1.3",
    "browser-sync": "^2.28.3",
    "cross-env": "^7.0.2",
    "del": "^5.1.0",
    "es6-promise": "^4.2.8",
    "eslint-config-airbnb-typescript": "^17.0.0",
    "eslint-plugin-import": "^2.22.1",
    "gh-pages": "^4.0.0",
    "gulp": "^4.0.2",
    "gulp-autoprefixer": "^7.0.1",
    "gulp-changed": "^4.0.2",
    "gulp-clean": "^0.4.0",
    "gulp-concat": "^2.6.0",
    "gulp-connect": "^5.7.0",
    "gulp-ejs": "^5.1.0",
    "gulp-file-include": "^2.2.2",
    "gulp-filter": "^6.0.0",
    "gulp-html-import": "^0.0.2",
    "gulp-less": "^4.0.1",
    "gulp-minify-css": "^1.2.1",
    "gulp-minify-html": "^1.0.4",
    "gulp-plumber": "^1.2.1",
    "gulp-rename": "^2.0.0",
    "gulp-replace": "^1.0.0",
    "gulp-size": "^3.0.0",
    "gulp-sourcemaps": "^2.6.5",
    "gulp-stream-to-promise": "^0.1.0",
    "gulp-strip-debug": "^3.0.0",
    "gulp-typescript": "^5.0.1",
    "gulp-util": "^3.0.7",
    "husky": "^4.3.8",
    "natives": "^1.1.6",
    "postcss-less": "^6.0.0",
    "stylelint": "^15.10.1",
    "stylelint-config-standard-less": "^1.0.0",
    "ts-loader": "^8.0.4",
    "ts-node": "^10.9.1",
    "typescript": "^4.9.5",
    "vitest": "^0.29.8",
    "webpack": "^5.76.0",
    "webpack-cli": "^5.0.1",
    "webpack-stream": "^6.1.0"
  },
  "dependencies": {
    "bootstrap": "^4.5.3",
    "eslint": "^7.4.0",
    "i18next": "^21.9.2",
    "i18next-browser-languagedetector": "^6.1.5",
    "i18next-chained-backend": "^3.1.0",
    "i18next-http-backend": "^1.4.4",
    "intro.js": "^2.9.3",
    "jquery": "^3.5.1",
    "knockout": "^3.5.1",
    "popper.js": "^1.16.0",
    "sortablejs": "^1.10.2"
  }
}

},{}],3:[function(require,module,exports){
function applyDatatables() {
    // Any table with headers
    $('.table:has(thead)').each((i, element) => {
    try {
        const rows = element.getElementsByTagName('tr').length;
        // Don't process these as datatables cannot handle them
        const doNotProcess = element.querySelectorAll('[colspan],[rowspan],.no-data-tables').length || element.classList.contains('no-data-tables');

        // Don't process anything with less than 40 rows
        if (doNotProcess) return;

        // Bootstrap style tables, with responsive table
        let dom = `<'row'<'col-sm-12 col-md-6'i><'col-sm-12 col-md-6'p>><'row table-responsive'<'col-sm-12'tr>>`;
        // How many items per page
        let pageLength = 20;

        // If we have less than 40 rows, we don't need pagination, but table will still be sortable
        if (rows < 40) {
            pageLength = 40;
            dom = `<'row'<'col-sm-12 col-md-6'><'col-sm-12 col-md-6'>><'row table-responsive'<'col-sm-12'tr>>`
        }

        $(element).DataTable({
            // Remember page/search/order
            stateSave: true,
            dom,
            pageLength,
            // Adjust text
            language: {
                paginate: {
                    previous: '←',
                    next: '→',
                }
            },
            searching:false,
            ordering:false,
            hideEmptyCols:{
                perPage: true,
            },
            drawCallback: function() {
                mergeGridCells()
            }
        }).fnAdjustColumnSizing()
    } catch (e) { }
})
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


function mergeGridCells() {
    var dimension_col = 0;

    $('.table:has(thead)').each((_, element) => {
        var first_instance = null;
        var rowspan = 1;

        $(element).find('tr').each(function () {

            // find the td of the correct column (determined by the dimension_col set above)
            var dimension_td = $(this).find(`td:nth-child(${dimension_col + 1})`);

            if (!dimension_td) {
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
}

module.exports = {
    applyDatatables,
    mergeGridCells
}

},{}],4:[function(require,module,exports){
const queue = new Map()
const cache = {
    evo: new Set(),
    pokemon: new Set(),
    regionalItem: new Set(),
    regionalDock: true, // default true because we skip this check in kanto
}

/* overrides */ {
    App.game.quests.getQuestLine('Tutorial Quests').state(QuestLineState.ended);

    KeyItemController.showGainModal = function () { };
    ClientRequirement.prototype.isCompleted = function () { return true }
    SpecialEventRequirement.prototype.isCompleted = function () { return false }
    PartyPokemon.prototype.checkForLevelEvolution = function () { }; // prevent pokemon from evolving with level.
    Party.prototype.calculatePokemonAttack = function () { };
}

//#region Data Filler
function addPokemon(pokemon) {
    if (cache.pokemon.has(pokemon))
        return

    this.pokemon.push(pokemon)
    cache.pokemon.add(pokemon)

    App.game.party.gainPokemonByName(pokemon)

    const pkm = App.game.party.getPokemonByName(pokemon)
    if (pkm.evolutions == null || pkm.evolutions.length == 0)
        return

    pkm.level = App.game.badgeCase.maxLevel()

    for (const evo of pkm.evolutions) {
        if (!EvolutionHandler.isSatisfied(evo)) {
            continue;
        }

        switch (evo.trigger) {
            case EvoTrigger.STONE: {
                if (cache.evo.has(evo.stone)) {
                    addPokemon.call(this, evo.evolvedPokemon)
                }
                break
            }
            case EvoTrigger.LEVEL: {
                addPokemon.call(this, evo.evolvedPokemon)
                break;
            }
        }
    }
}

function addMysteryEgg(region) {
    for (const type of Object.values(App.game.breeding.hatchList)) {
        for (const pkm of type[region]) {
            addPokemon.call(this, pkm)
        }
    }
}

function addEvoStone(stone) {
    cache.evo.add(stone)

    for (const pkm of App.game.party.caughtPokemon) {
        if (pkm.evolutions == null || pkm.evolutions.length == 0)
            continue

        for (const evo of pkm.evolutions) {
            if (evo.trigger === EvoTrigger.STONE && evo.stone === stone && EvolutionHandler.isSatisfied(evo)) {
                addPokemon.call(this, evo.evolvedPokemon)

                if (!cache.regionalDock && PokemonHelper.calcNativeRegion(evo.basePokemon) < instance.regionsData.length - 1) {
                    cache.pokemon.delete(evo.basePokemon);
                }
            }
        }
    }
}
//#endregion

//#region Data classes
class Data {
    constructor(town, area) {
        this.region = town ? SubRegions.getSubRegionById(town.region, town.subRegion || 0).name : ''
        this.area = area
    }

    compute() {
        return {
            region: this.region,
            area: this.area,
            key: [],
            shops: [],
            pokemon: [],
        }
    }
}

class TownData extends Data {
    static add(town) {
        queue.set(`t.${town.name}`, new this(town))

        town.content.forEach(content => {
            switch (content.constructor.name) {
                case 'Gym': {
                    GymData.add(content, town)
                    break;
                }
                case 'TemporaryBattle': {
                    BattleData.add(content)
                    break;
                }
                case 'MoveToDungeon': {
                    DungeonData.add(content.dungeon)
                    break;
                }
            }
        });
    }

    constructor(town) {
        super(town, town.name)
        this._ref = town;
    }

    complete() {
        if (!this._ref.isUnlocked()) {
            return false
        }

        for (const shop of this._ref.content) {
            if (shop.constructor.name !== "Shop") {
                continue;
            }
            shop.items.forEach(item => item.gain(1))
        }
        return true
    }

    compute() {
        const data = super.compute();

        for (const content of this._ref.content) {
            switch (content.constructor.name) {
                case 'Shop':
                    this.handleShops(content, data);
                    break;
                case 'SafariTownContent':
                    const pokemonList = SafariPokemonList.list[this._ref.region]()
                    for (const pokemon of pokemonList) {
                        addPokemon.call(data, pokemon.name)
                    }
                    break
                case 'DockTownContent':
                    if (!cache.regionalDock) {
                        for (const pkm of App.game.party.caughtPokemon) {
                            cache.pokemon.add(pkm.name)
                        }
                        cache.regionalDock = true
                    }
                    break
            }
        }

        return data
    }

    handleShops(shop, data) {
        let hasShopMon = false

        for (const item of shop.items) {
            switch (item.constructor.name) {
                case "PokeballItem": {
                    if (!cache.regionalItem.has(item.name)) {
                        cache.regionalItem.add(item.name)
                        data.shops.push(item.displayName)
                    }
                    break;
                }
                case "PokemonItem": {
                    hasShopMon = true
                    addPokemon.call(data, item.name);
                    break;
                }
                case "EggItem": {
                    if (App.game.keyItems.hasKeyItem(KeyItemType.Mystery_egg)) {
                        if (item.type === GameConstants.EggItemType.Mystery_egg) {
                            addMysteryEgg.call(data, this._ref.region)
                            data.shops.push(item.displayName)
                        }
                    } else {

                        data.shops.push(item.displayName)
                        item.gain(1)
                    }
                    break;
                }
                case "EvolutionStone": {
                    if (!cache.evo.has(item.type)) {
                        data.shops.push(item.displayName)
                        addEvoStone.call(data, item.type)
                    }
                    break;
                }
            }
        }

        if (hasShopMon)
            data.shops.push('ShopMon')
    }
}
class GymData extends Data {
    static add(gym, town) {
        town ??= TownList[gym.town];
        queue.set(`g.${gym.town}`, new this(gym, town))
    }

    constructor(gym, town) {
        super(town, TownList[gym.town] ? `${gym.town}'s gym` : gym.town)
        this._ref = gym;
        this._refTown = town;
    }

    complete() {
        if (!this._ref.isUnlocked() || (this._refTown && !this._refTown.isUnlocked())) {
            return false
        }

        GameHelper.incrementObservable(App.game.statistics.gymsDefeated[GameConstants.getGymIndex(this._ref.town)]);
        App.game.badgeCase.gainBadge(this._ref.badgeReward);
        this._ref.rewardFunction();

        return true
    }

    compute() {
        const data = super.compute();
        for (const pkm of App.game.party.caughtPokemon) {
            if (pkm.evolutions == null || pkm.evolutions.length == 0)
                continue

            pkm.level = App.game.badgeCase.maxLevel()

            for (const evo of pkm.evolutions) {
                if (evo.trigger === EvoTrigger.LEVEL && EvolutionHandler.isSatisfied(evo)) {
                    addPokemon.call(data, evo.evolvedPokemon)
                }
            }
        }
        return data
    }
}
class BattleData extends Data {
    static add(battle) {
        const town = TownList[battle.optionalArgs.returnTown || battle.parent.name];
        queue.set(`b.${battle.name}`, new this(battle, town))
    }

    constructor(battle, town) {
        super(town, battle.name)
        this._ref = battle;
        this._refTown = town;
    }

    complete() {
        if (!this._ref.isUnlocked() || !this._refTown.isUnlocked()) {
            return false
        }

        TemporaryBattleRunner.startBattle(this._ref)
        TemporaryBattleRunner.battleWon(this._ref)

        return true
    }
}
class DungeonData extends Data {
    static add(dungeon) {
        queue.set(`d.${dungeon.name}`, new this(dungeon))
    }

    constructor(dungeon) {
        super(TownList[dungeon.name], dungeon.name)
        this._ref = dungeon;
    }

    complete() {
        if (!this._ref.isUnlocked()) {
            return false
        }

        GameHelper.incrementObservable(App.game.statistics.dungeonsCleared[GameConstants.getDungeonIndex(this._ref.name)]);

        return true
    }

    compute() {
        const data = super.compute();

        this._ref.pokemonList.forEach(addPokemon.bind(data))
        this._ref.bossPokemonList.forEach(addPokemon.bind(data))

        return data
    }
}
class RouteData extends Data {
    static add(route) {
        queue.set(`r.${route.routeName}`, new this(route))
    }

    constructor(route) {
        super(route, route.routeName)
        this._ref = route;

        this.area = this.area.replace(`${this.region} Route`, "")
    }

    complete() {
        if (!this._ref.isUnlocked()) {
            return false
        }

        App.game.statistics.routeKills[this._ref.region][this._ref.number](100)

        return true
    }

    compute() {
        const data = super.compute();
        RouteHelper.getAvailablePokemonList(this._ref.number, this._ref.region).forEach(addPokemon.bind(data))
        return data
    }
}

class FossilData extends Data {
    static add(region) {
        const pokemonList = Object.values(GameConstants.FossilToPokemon).filter(p => PokemonHelper.calcNativeRegion(p) === region)
        if (pokemonList.length > 0)
            queue.set(`fossil.${region}`, new this({ region }, pokemonList))
    }

    constructor(region, pokemonList) {
        super(region, "Fossils")
        this.pokemonList = pokemonList
    }

    complete() {
        return true
    }

    compute() {
        const data = super.compute();
        this.pokemonList.forEach(addPokemon.bind(data))
        return data
    }
}
class RoamingData extends Data {
    static add(region) {
        RoamingPokemonList.roamerGroups[region].forEach((subregion, i) => {
            const pkmList = RoamingPokemonList.list[region][i]?.filter(pkm => pkm.pokemon.nativeRegion === region)
            if (pkmList)
                queue.set(`roaming.${subregion.name}`, new this(subregion.name, pkmList))
        })
    }

    constructor(region, pokemonList) {
        super(null, "Roamers")
        this.region = region
        this.pokemonList = pokemonList
    }

    complete() {
        return this.pokemonList.some(pkm => pkm.isRoaming())
    }

    compute() {
        const data = super.compute();
        this.pokemonList.forEach(pkm => {
            if (pkm.isRoaming()) {
                addPokemon.call(data, pkm.pokemon.name)
            }
        })
        return data
    }
}
class BreedingData extends Data {
    static add(region) {
        const min = region > 0 ? GameConstants.MaxIDPerRegion[region - 1] : 0
        const max = GameConstants.MaxIDPerRegion[region]

        queue.set(`breeding.${region}`, new this({ region }, min + 1, max))
    }

    constructor(region, minId, maxId) {
        super(region, "Breeding")
        this.minId = minId
        this.maxId = maxId
    }

    complete() {
        return true
    }

    compute() {
        const data = super.compute();
        for (let id = this.minId; id <= this.maxId; id++) {
            if (!App.game.party.getPokemon(id)) {
                addPokemon.call(data, PokemonHelper.getPokemonById(id).name)
            }
        }
        return data
    }
}

class QuestlineData {
    static add(quest) {
        queue.set(`q.${quest.name}`, new this(quest))
    }

    constructor(quest) {
        this._ref = quest
    }

    complete() {
        const q = this._ref;

        switch (q.state()) {
            case QuestLineState.inactive: {
                if (q.requirement && !q.requirement.isCompleted()) {
                    return false;
                }
                if (q.bulletinBoard === GameConstants.BulletinBoards.None) {
                    return false;
                }
                q.beginQuest()
            }
            case QuestLineState.started: {
                const current = q.curQuestObject()
                switch (current.constructor.name) {
                    case 'DefeatDungeonQuest': {
                        if (!queue.has(`d.${current.dungeon}`)) {
                            GameHelper.incrementObservable(App.game.statistics.dungeonsCleared[GameConstants.getDungeonIndex(current.dungeon)]);
                        }
                        break;
                    }
                    case 'DefeatGymQuest': {
                        if (!queue.has(`g.${current.gymTown}`)) {
                            GameHelper.incrementObservable(App.game.statistics.gymsDefeated[GameConstants.getGymIndex(current.gymTown)]);
                        }
                        break;
                    }
                    case 'TalkToNPCQuest': {
                        if (!current.npc.options.requirement || current.npc.options.requirement.isCompleted())
                            current.npc.talkedTo(true)
                        break;
                    }
                    default:
                    // console.log(current)
                }
                break
            }
        }
        return q.state() === QuestLineState.ended
    }
}
class KeyItemData {
    static add(item) {
        queue.set(`i.${KeyItemType[item.name]}`, new this(item))
    }

    constructor(item) {
        this._ref = item
    }

    complete() {
        if (!this._ref.isUnlocked()) {
            return false
        }

        const region = instance.regionsData.length - 1
        const regionData = instance.regionsData[region]
        const data = regionData[regionData.length - 1]
        if (!data) {
            return true
        }

        data.key.push(this._ref.displayName)

        switch (this._ref.name) {
            case KeyItemType.Mystery_egg: {
                const newData = {
                    region: data.region,
                    area: "DayCare",
                    pokemon: []
                }

                addMysteryEgg.call(newData, region)
                regionData.push(newData)
                break;
            }
        }

        return true
    }
}
//#endregion

class ACSRQGuide {
    regionsData = []
    getRegion(region) {
        return this.regionsData[region]
    }

    updateRouteInfo() {
        for (const quest of App.game.quests.questLines()) {
            QuestlineData.add(quest)
        }
        for (const item of App.game.keyItems.itemList) {
            KeyItemData.add(item)
        }

        for (let region = GameConstants.Region.kanto; region < GameConstants.Region.hoenn; region++) {
            this.regionsData[region] = []

            for (const town of Object.values(TownList).filter(town => town.region === region && town.constructor.name === "Town")) {
                TownData.add(town)
            }

            for (const battle of Object.values(TemporaryBattleList).filter(battle => TownList[battle.optionalArgs.returnTown || battle.parent?.name]?.region === region)) {
                BattleData.add(battle)
            }

            for (const dungeon of GameConstants.RegionDungeons[region]) {
                DungeonData.add(dungeonList[dungeon])
            }

            for (const route of Routes.getRoutesByRegion(region)) {
                RouteData.add(route)
            }

            FossilData.add(region)
            RoamingData.add(region)
            BreedingData.add(region)

            let result, iterator = queue.entries();
            do {
                result = iterator.next();
                if (result.done)
                    continue

                const [key, data] = result.value;
                if (data.complete()) {

                    if (data instanceof Data)
                        this.regionsData[region].push(data.compute())

                    // restart checks - its bad but needed for backtracking...
                    queue.delete(key)
                    iterator = queue.entries()
                }
            } while (!result.done)

            // cleanup
            console.log(queue)

            cache.regionalDock = false;
            cache.regionalItem.clear();
        }

        setTimeout(() => {
            $('#receiveBadgeModal').modal('hide')
            $('#questStepClearedModal').modal('hide')
        }, 500)
    }
}

const instance = new ACSRQGuide()
module.exports = {
    instance,
    getRegion: instance.getRegion.bind(instance),
}

},{}],5:[function(require,module,exports){
// import our version etc
const package = require('../pokeclicker/package.json');

// pokeclicker-wiki/scripts/game break Requirement completion so we put it back
const oldComplete = Requirement.prototype.isCompleted 

window.Guide = {
    package,
    ...require('./datatables'),
    ...require('./manual'),
    ...require('../pokeclicker-wiki/scripts/game'),
    ...require('./guide'),
    ...require('./navigation'),
}

Requirement.prototype.isCompleted = oldComplete;
},{"../pokeclicker-wiki/scripts/game":1,"../pokeclicker/package.json":2,"./datatables":3,"./guide":4,"./manual":6,"./navigation":7}],6:[function(require,module,exports){
function swap(array, index_a, index_b)
{
    const tmp = array[index_a]
    array[index_a] = array[index_b]
    array[index_b] = tmp
}

//#region Kanto
TownList["Pokémon Tower"].requirements.push(new TemporaryBattleRequirement('Fighting Dojo'))
TemporaryBattleList['Snorlax route 16'].requirements.push(new RouteKillRequirement(GameConstants.ROUTE_KILLS_NEEDED, GameConstants.Region.kanto, 15))
TownList["Fuchsia City"].requirements.push(new RouteKillRequirement(GameConstants.ROUTE_KILLS_NEEDED, GameConstants.Region.kanto, 18))
TownList['Two Island'].requirements.push(new ClearDungeonRequirement(1, GameConstants.getDungeonIndex('Mt. Ember Summit')))
TownList['Three Island'].requirements.push(new RouteKillRequirement(GameConstants.ROUTE_KILLS_NEEDED, GameConstants.Region.kanto, 28))
TownList['Client Island'].requirements.push(new ClearDungeonRequirement(1, GameConstants.getDungeonIndex('Berry Forest')))
Routes.getRoute(GameConstants.Region.kanto, 21).requirements.push(new ClearDungeonRequirement(1, GameConstants.getDungeonIndex('Berry Forest')))
GymList['Viridian City'].requirements.push(new RouteKillRequirement(GameConstants.ROUTE_KILLS_NEEDED, GameConstants.Region.kanto, 21))
//#endregion

//#region Johto
TownList["Cherrygrove City"].requirements.push(new RouteKillRequirement(GameConstants.ROUTE_KILLS_NEEDED, GameConstants.Region.johto, 46))
TemporaryBattleList['Sudowoodo'].requirements.push(new RouteKillRequirement(GameConstants.ROUTE_KILLS_NEEDED, GameConstants.Region.johto, 36))
Routes.getRoute(GameConstants.Region.johto, 42).requirements.push(new RouteKillRequirement(GameConstants.ROUTE_KILLS_NEEDED, GameConstants.Region.johto, 48))
TownList["Mt. Mortar"].requirements.push(new RouteKillRequirement(GameConstants.ROUTE_KILLS_NEEDED, GameConstants.Region.johto, 42))
TownList["Mahogany Town"].requirements.push(new ClearDungeonRequirement(1, GameConstants.getDungeonIndex('Mt. Mortar')))
TownList['Tohjo Falls'].requirements.push(new ClearDungeonRequirement(1, GameConstants.getDungeonIndex('Dark Cave')))
//#endregion

const keyItemsInitialize = KeyItems.prototype.initialize;
KeyItems.prototype.initialize = function() {
    keyItemsInitialize.call(this);

    this.itemList = this.itemList.map(item => {
        switch (item.name) {
            // unlock wailmer pail with route 11 completion
            case KeyItemType.Wailmer_pail:
                item.unlocker.dispose();
                return new KeyItem(item.name, item.description,
                    () => App.game.statistics.routeKills[GameConstants.Region.kanto][11]() >= GameConstants.ROUTE_KILLS_NEEDED,
                    false, item.unlockRewardOnClose, item.displayName, this.unlockRewardOnUnlock);
            case KeyItemType.Mystery_egg:
                item.unlocker.dispose();
                return new KeyItem(item.name, item.description,
                    () => App.game.statistics.routeKills[GameConstants.Region.kanto][5]() >= GameConstants.ROUTE_KILLS_NEEDED,
                    false, item.unlockRewardOnClose, item.displayName, this.unlockRewardOnUnlock);
            default:
                return item;
        }
    });
};

},{}],7:[function(require,module,exports){
const { applyDatatables } = require('./datatables');
const { instance } = require('./guide')

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

  instance.updateRouteInfo();

  const pageElement = $('#wiki-page-content');
  $.get("./pages/region.html", (data) => {
    pageElement.html(data);
    applyBindings(true);
  })
});

},{"./datatables":3,"./guide":4}]},{},[5]);
