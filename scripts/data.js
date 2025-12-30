
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
