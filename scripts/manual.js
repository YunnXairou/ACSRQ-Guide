function swap(array, index_a, index_b)
{
    const tmp = array[index_a]
    array[index_a] = array[index_b]
    array[index_b] = tmp
}

TemporaryBattleList['Snorlax route 16'].requirements.push(new RouteKillRequirement(10, GameConstants.Region.kanto, 15)) // unlock Snorlax 16 with route 15 completion
TownList["Fuchsia City"].requirements.push(new RouteKillRequirement(10, 0, 18))

swap(GameConstants.TemporaryBattles, 6, 7) // exchange Snorlax 16 and Blue 5
swap(GameConstants.TemporaryBattles, 5, 6) // exchange Snorlax 12 and Blue 5

const keyItemsInitialize = KeyItems.prototype.initialize;
KeyItems.prototype.initialize = function() {
    keyItemsInitialize.call(this);

    this.itemList = this.itemList.map(item => {
        switch (item.id) {
            // unlock wailmer pail with route 11 completion
            case KeyItemType.Wailmer_pail:
                item.unlocker.dispose();
                return new KeyItem(item.id, item.description,
                    () => App.game.statistics.routeKills[GameConstants.Region.kanto][11]() >= GameConstants.ROUTE_KILLS_NEEDED,
                    false, item.unlockRewardOnClose, item.displayName, this.unlockRewardOnUnlock);
            case KeyItemType.Mystery_egg:
                item.unlocker.dispose();
                return new KeyItem(item.id, item.description,
                    () => App.game.statistics.routeKills[GameConstants.Region.kanto][5]() >= GameConstants.ROUTE_KILLS_NEEDED,
                    false, item.unlockRewardOnClose, item.displayName, this.unlockRewardOnUnlock);
            default:
                return item;
        }
    });
};
