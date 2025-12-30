
const regionGuide = [];
const done = {
    pokemon: new Set(),
    route: new Set(),
    items: new Set(),
    dungeon: new Set(),
    gym: new Set(),
    battle: new Set(),
}

/* overrides */ {
    KeyItemController.showGainModal = function () { };

    RouteKillRequirement.prototype.isCompleted = function () {
        return done.route.has(`${this.region}-${this.route}`)
    }

    ClearDungeonRequirement.prototype.isCompleted = function () {
        return done.dungeon.has(this.dungeonIndex)
    }

    GymBadgeRequirement.prototype.isCompleted = function () {
        if (this.option === GameConstants.AchievementOption.less) {
            return !done.gym.has(this.badge)
        } else {
            return done.gym.has(this.badge)
        }
    }

    TemporaryBattleRequirement.prototype.isCompleted = function () {
        return done.battle.has(this.battleName)
    }
}


/* manual fixes */ {
    TownList['Route 4 Pokémon Center'].name = 'Route 3 Pokémon Center'
    TownList["Bill's House"].requirements.push(new RouteKillRequirement(10, 0, 5))
    TownList["Vermilion City"].requirements.push(new TemporaryBattleRequirement("Blue 3"))
    TownList["Saffron City"].requirements.push(new ClearDungeonRequirement(1, GameConstants.RegionDungeons.flat().indexOf('Rocket Game Corner')))
    TemporaryBattleList['Snorlax route 16'].requirements.push(new RouteKillRequirement(10, 0, 15))
    TownList["Fuchsia City"].requirements.push(new RouteKillRequirement(10, 0, 18))
}

/* calculator */ {
    const region = GameConstants.Region.kanto;
    const datas = regionGuide[region] = [];

    function newData() {
        return {
            region: SubRegions.getSubRegionById(region, 0).name,
            area: '',
            pokemon: [],
            shops: [],
            needed: []
        }
    }

    const towns = Object.values(TownList).filter(t => t.region === region)
    const routes = Routes.getRoutesByRegion(region)
    const dungeons = GameConstants.RegionDungeons[region]
    const gyms = GameConstants.RegionGyms[region]
    const battles = GameConstants.TemporaryBattles

    //#region Calculators
    function checkBattle(index, data) {
        const b = TemporaryBattleList[index]
        if (!b.isUnlocked()) {
            return false
        } else if (done.battle.has(b.name)) {
            return true
        }

        data.area = b.optionalArgs.displayName || b.name
        datas.push(data)

        done.battle.add(b.name)
        return true
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
                                return
                            case "PokemonItem":
                                if (!done.pokemon.has(i.name)) {
                                    done.pokemon.add(i.name)
                                    data.shops.push(i.name);
                                }
                            default:
                                if (!done.items.has(i.name)) {
                                    i.gain(1);
                                    done.items.add(i.name)
                                    data.shops.push(i._displayName);
                                }
                        }

                        if (i.constructor.name !== "BattleItem" && !done.items.has(i.name)) {
                            i.gain(1);
                            done.items.add(i.name)
                            data.shops.push(i._displayName || i.name);
                        }
                    })
                    break;
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

        // unlock RouteRequirements
        done.route.add(`${r.region}-${r.number}`)
        return true
    }
    function checkDungeon(index, data) {
        const d = dungeonList[index];
        if (!d.isUnlocked()) {
            return false
        }

        console.log(d)

        data.area = d.name;
        datas.push(data)

        // find new pokemon as encounter
        d.enemyList.forEach(e => {
            switch (e.constructor.name) {
                case "Object": {
                    if (!done.pokemon.has(e.pokemon)) {
                        data.pokemon.push(e.pokemon)
                        done.pokemon.add(e.pokemon)
                    }
                    break
                }
                case "String": {
                    if (!done.pokemon.has(e)) {
                        data.pokemon.push(e)
                        done.pokemon.add(e)
                    }
                    break
                }
            }
        })
        // find new pokemon as boss (wihtout events)
        d.bossList.forEach(e => {
            if (e.constructor.name === "DungeonBossPokemon" && e.options?.requirement == null && !done.pokemon.has(e.name)) {
                data.pokemon.push(e.name)
                done.pokemon.add(e.name)
            }
        })

        // unlock DungeonRequirements
        done.dungeon.add(GameConstants.RegionDungeons.flat().indexOf(d.name));
        return true;
    }
    function checkGym(index, data) {
        const g = GymList[index];
        if (!g.isUnlocked() || !g.parent.isUnlocked()) {
            return false;
        } else if (done.gym.has(g.badgeReward)) {
            return true
        }

        data.area = `${g.town}'s gym`
        datas.push(data)

        done.gym.add(g.badgeReward)
        return true
    }
    //#endregion

    let tdx = rdx = ddx = gdx = bdx = 0;
    let data = {}

    for (let i = -1; i < datas.length; i++) {

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
    }

    console.log(gyms[gdx], battles[bdx], dungeons[ddx])
}

module.exports = {
    getRegion: (r) => regionGuide[r]
}
