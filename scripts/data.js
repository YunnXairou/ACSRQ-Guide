
const regionGuide = [];
const done = {
    pokemon: new Set(),
    items: new Set(),
    battle: new Set(),
    dungeon: new Set()
}

/* overrides */ {
    KeyItemController.showGainModal = function () { };
    SpecialEventRequirement.prototype.isCompleted = function () { return false }
}

function updateRouteInfo() {
    const region = GameConstants.Region.kanto;
    const datas = regionGuide[region] = [];
    let canFish = canHatch = false;

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
    function getEggsPokemon(region, type) {
        if (type != GameConstants.EggItemType.Mystery_egg)
            return App.game.breeding.hatchList[type][region]
        else
            return Object.values(App.game.breeding.hatchList).flatMap(_ => _[region])
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
                                    data.shops.push("Shop Mon");
                                    data.pokemon.push(i.name);
                                    done.pokemon.add(i.name)
                                }
                                break
                            }
                            case "EggItem": {
                                if (canHatch) {
                                    getEggsPokemon(t.region, i.type).forEach((p) => {
                                        if (!done.pokemon.has(p)) {
                                            data.pokemon.push(p)
                                            done.pokemon.add(p)
                                        }
                                    })
                                } else {
                                    data.shops.push(i._displayName);
                                }
                                break;
                            }
                            case "BuyKeyItem": {
                                i.gain(1);
                                data.key.push(i._displayName);
                                done.items.add(i.name)
                                done.items.add(i._displayName)
                                break;
                            }
                            default: {
                                if (!done.items.has(i.name)) {
                                    i.gain(1);
                                    done.items.add(i.name)
                                    data.shops.push(i._displayName);
                                }
                            }
                        }
                    })
                    data.shops = [... new Set(data.shops)]
                }
                case 'Gym': {
                    checkGym(t.name, newData())
                    break
                }
                case 'TemporaryBattle': {
                    checkBattle(c.name, newData())
                    break
                }
                case 'MoveToDungeon': {
                    checkDungeon(c.dungeon.name, newData())
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

        if (canFish) {
            r.pokemon.water.forEach(p => {
                if (!done.pokemon.has(p)) {
                    data.pokemon.push(p)
                    done.pokemon.add(p)
                }
            })
        }

        App.game.statistics.routeKills[r.region][r.number](100)
        return true
    }
    function checkDungeon(index, data) {
        const d = dungeonList[index];
        if (!d || !d.isUnlocked()) {
            return false
        } if (done.dungeon.has(index)) {
            return true
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
        done.dungeon.add(index);
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
        switch (current.constructor.name) {
            case 'DefeatDungeonQuest': {
                const dungeon_index = GameConstants.RegionDungeons.flat().indexOf(current.dungeon);
                const current_clear = App.game.statistics.dungeonsCleared[dungeon_index]()

                if (current_clear > 0) {
                    App.game.statistics.dungeonsCleared[dungeon_index](current_clear + 1)
                }
                break;
            }
            case 'DefeatGymQuest': {
                const gym_index = GameConstants.getGymIndex(current.gymTown)
                const current_clear = App.game.statistics.gymsDefeated[gym_index]()

                if (current_clear > 0) {
                    App.game.statistics.gymsDefeated[gym_index](current_clear + 1);
                }
                break;
            }
            case 'TalkToNPCQuest': {
                current.npc.talkedTo(true)
                console.log(current)
                break;
            }
        }
        return questLine.state() === QuestLineState.ended
    }

    function unlockKeyItems(itemId) {
        switch (itemId) {
            case KeyItemType.Super_rod: {
                canFish = true;

                // check route 12
                {
                    const data = datas[datas.length - 1]
                    const r = routes[rdx - 1];

                    r.pokemon.water.forEach(p => {
                        if (!done.pokemon.has(p)) {
                            data.pokemon.push(p)
                            done.pokemon.add(p)
                        }
                    })
                }

                // backtrack
                let backtrack = 0;
                for (let i = 0; i < rdx; i++) {
                    const r = routes[i];
                    const data = newData();

                    r.pokemon.water.forEach(p => {
                        if (!done.pokemon.has(p)) {
                            data.pokemon.push(p)
                            done.pokemon.add(p)
                        }
                    })

                    if (data.pokemon.length > 0) {
                        data.region = SubRegions.getSubRegionById(r.region, r.subRegion || 0).name
                        data.area = r.routeName.replace(`${data.region} Route`, "") + ' (fishing rod)'
                        datas.push(data)
                        backtrack++;
                    }
                }

                return backtrack;
            }
            case KeyItemType.Mystery_egg: {
                canHatch = true;

                const data = newData();
                data.region = SubRegions.getSubRegionById(region, 0).name;
                data.area = "Day Care";

                getEggsPokemon(region, GameConstants.EggItemType.Mystery_egg).forEach((p) => {
                    if (!done.pokemon.has(p)) {
                        data.pokemon.push(p)
                        done.pokemon.add(p)
                        isUsefull = true
                    }
                })

                App.game.breeding.hatchList[region].flat().forEach((p) => {
                    if (!done.pokemon.has(p)) {
                        data.pokemon.push(p)
                        done.pokemon.add(p)
                    }
                })

                datas.push(data)
                return 1;
            }
        }
        return 0;
    }
    //#endregion

    const towns = Object.values(TownList).filter(t => t.region === region)
    const routes = Routes.getRoutesByRegion(region)
    const dungeons = GameConstants.RegionDungeons[region]
    const gyms = GameConstants.RegionGyms[region]
    const battles = GameConstants.TemporaryBattles
    const keys = new Set(App.game.keyItems.itemList.slice(3))

    let idx = tdx = rdx = ddx = gdx = bdx = 0, qdx = 1;

    do {

        App.game.quests.questLines().forEach((q) => {
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
                    datas[datas.length - 1].key.push(k.displayName);
                    done.items.add(k.displayName);
                }
                idx += unlockKeyItems(k.id);
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
