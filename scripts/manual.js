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