const queue = new Map()

/* overrides */ {
    KeyItemController.showGainModal = function () { };
    ClientRequirement.prototype.isCompleted = function () { return true }
    SpecialEventRequirement.prototype.isCompleted = function () { return false }
}

//#region Data classes
class Data {
    constructor(town, area)
    {
        this.region = town ? SubRegions.getSubRegionById(town.region, town.subRegion || 0).name : ''
        this.area = area
    }

    getMinimalData()
    {
        return {
            region: this.region,
            area: this.area,
            pokemon: [],
            key: [],
            shops: []
        }
    }
}

class TownData extends Data {
    static add(town) {
        queue.set(`t.${town.name}`, new this(town))

        town.content.forEach(content => {
            switch (content.constructor.name) {
                case 'Gym': {
                    GymData.add(content)
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
}
class GymData extends Data  {
    static add(gym) {
        const town = TownList[gym.town];
        queue.set(`g.${gym.town}`, new this(gym, town))
    }

    constructor(gym, town) {
        super(town, town ? `${gym.town}'s gym` : gym.town)
        this._ref = gym;
        this._refTown = town;
    }

    complete() {
        if (!this._ref.isUnlocked() || !this._refTown?.isUnlocked()) {
            return false
        }

        GameHelper.incrementObservable(App.game.statistics.gymsDefeated[GameConstants.getGymIndex(this._ref.town)]);
        App.game.badgeCase.gainBadge(this._ref.badgeReward);
        this._ref.rewardFunction();

        return true
    }
}
class BattleData extends Data  {
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
}

class QuestlineData {
    static add(quest) {
        queue.set(`q.${quest.name}`, new this(quest))
    }

    constructor(quest) {
        this._ref = quest
    }

    complete() {
        if (this._ref.state() === QuestLineState.started) {
            const current = this._ref.curQuestObject()
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
                    current.npc.talkedTo(true)
                    break;
                }
                default:
                    console.log(current)
            }
        }
        return this._ref.state() === QuestLineState.ended
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

        for (let region = GameConstants.Region.kanto; region <= GameConstants.Region.kanto; region++) {
            this.regionsData[region] = []

            // collect TownData
            for (const town of Object.values(TownList).filter(town => town.region === region && town.constructor.name === "Town")) {
                TownData.add(town)
            }

            for (const battle of Object.values(TemporaryBattleList).filter(battle => TownList[battle.optionalArgs.returnTown || battle.parent.name].region === region)) {
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
                        this.regionsData[region].push(data.getMinimalData())

                    // restart checks - its bad but needed for backtracking...
                    queue.delete(key)
                    iterator = queue.entries()
                }
            } while (!result.done)

            console.log(queue, this.regionsData)
                
            setTimeout(() => {
                $('#receiveBadgeModal').modal('hide')
                $('#questStepClearedModal').modal('hide')
            },500)
        }
    }
}

const instance = new ACSRQGuide()
module.exports = {
    instance,
    getRegion: instance.getRegion.bind(instance),
}

