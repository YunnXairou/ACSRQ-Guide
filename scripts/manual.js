function swap(array, index_a, index_b)
{
    const tmp = array[index_a]
    array[index_a] = array[index_b]
    array[index_b] = tmp
}

//#region Kanto
TemporaryBattleList['Snorlax route 16'].requirements.push(new RouteKillRequirement(GameConstants.ROUTE_KILLS_NEEDED, GameConstants.Region.kanto, 15))
TownList["Fuchsia City"].requirements.push(new RouteKillRequirement(GameConstants.ROUTE_KILLS_NEEDED, GameConstants.Region.kanto, 18))
TownList['Two Island'].requirements.push(new ClearDungeonRequirement(1, GameConstants.getDungeonIndex('Mt. Ember Summit')))
TownList['Three Island'].requirements.push(new RouteKillRequirement(GameConstants.ROUTE_KILLS_NEEDED, GameConstants.Region.kanto, 28))
TownList['Client Island'].requirements.push(new ClearDungeonRequirement(1, GameConstants.getDungeonIndex('Berry Forest')))
Routes.getRoute(GameConstants.Region.kanto, 21).requirements.push(new ClearDungeonRequirement(1, GameConstants.getDungeonIndex('Berry Forest')))
GymList['Viridian City'].requirements.push(new RouteKillRequirement(GameConstants.ROUTE_KILLS_NEEDED, GameConstants.Region.kanto, 21))
//#endregion

swap(GameConstants.TemporaryBattles, 6, 7) // exchange Snorlax 16 and Blue 5
swap(GameConstants.TemporaryBattles, 5, 6) // exchange Snorlax 12 and Blue 5

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
