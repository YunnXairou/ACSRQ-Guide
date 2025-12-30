
const regionGuide = [];
const done = {
    pokemon: new Set(),
    route: new Set(),
    items: new Set(),
    dungeon: new Set(),
    gym: new Set(),
}

/* overrides */ {
    KeyItemController.showGainModal = function () { };

    RouteKillRequirement.prototype.isCompleted = function () {
        return done.route.has(`${this.region}-${this.route}`)
    }

    ClearDungeonRequirement.prototype.isCompleted = function() {
        return done.dungeon.has(this.dungeonIndex)
    }

    GymBadgeRequirement.prototype.isCompleted = function() {
        return done.gym.has(this.badge)
    }
}

/* calculator */ {
    const region = GameConstants.Region.kanto;
    const datas = regionGuide[region] = [];

    const towns = Object.values(TownList).filter(t => t.region === region)
    const routes = Routes.getRoutesByRegion(region)
    const dungeons = GameConstants.RegionDungeons[region]
    const gyms = GameConstants.RegionGyms[region]

    while (1) {
        const data = {
            region: SubRegions.getSubRegionById(region, 0).name,
            area: '',
            pokemon: [],
            shops: [],
            needed: []
        }

        // town
        const t = towns[0];
        if (t.isUnlocked()) {
            data.region = SubRegions.getSubRegionById(t.region, t.subRegion || 0).name
            data.area = t.name

            t.content.forEach(c => {

                // find new items to buy
                if (c.constructor.name === "Shop") {
                    c.items.forEach((i) => {

                        switch(i.constructor.name) {
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
                }
            });

            towns.shift();
            datas.push(data);
            continue;
        }

        // route
        const r = routes[0]
        if (r.isUnlocked()) {
            data.region = SubRegions.getSubRegionById(r.region, r.subRegion || 0).name
            data.area = r.routeName

            // find new pokemon
            r.pokemon.land.forEach(p => {
                if (!done.pokemon.has(p)) {
                    data.pokemon.push(p)
                    done.pokemon.add(p)
                }
            })

            // unlock RouteRequirements
            done.route.add(`${r.region}-${r.number}`)

            routes.shift();
            datas.push(data);
            continue;
        }

        // dungeon
        const d = dungeonList[dungeons[0]];
        if (d.isUnlocked()) {
            data.area = d.name;

            // find new pokemon as encounter
            d.enemyList.forEach(e => {
                if (e.constructor.name === "Object" && !done.pokemon.has(e.pokemon)) {
                    data.pokemon.push(e.pokemon)
                    done.pokemon.add(e.pokemon)
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
            done.dungeon.add(GameConstants.RegionDungeons.flat().findIndex(_=>_ === d.name));

            dungeons.shift();
            datas.push(data);
            continue;
        }

        // gym
        const g = GymList[gyms[0]];
        if (g.isUnlocked()) {
            data.area = `${g.town}'s gym`

            done.gym.add(g.badgeReward)

            gyms.shift()
            datas.push(data);
            continue;
        }

        break;
    }
}

module.exports = {
    getRegion: (r) => regionGuide[r]
}
