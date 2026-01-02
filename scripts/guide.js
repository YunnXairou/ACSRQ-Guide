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

                if(!cache.regionalDock && PokemonHelper.calcNativeRegion(evo.basePokemon) < instance.regionsData.length - 1) {
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
                        if(current.npc.options.requirement.isCompleted())
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

        for (let region = GameConstants.Region.kanto; region < GameConstants.Region.final; region++) {
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
