// Mission system
class MissionManager {
    constructor() {
        this.missions = [];
        this.currentLevel = 1;
    }

    initializeLevel(level, levelData) {
        this.currentLevel = level;
        this.missions = this.buildMissions(levelData);
    }

    buildMissions(levelData) {
        if (!levelData) return [];
        const missionType = levelData.missionType || 'defuse_bombs';
        const missions = [];

        if (missionType === 'steal_secrets') {
            const assets = levelData.interactiveObjects.filter(obj => obj.type === 'secret_asset');
            assets.forEach((asset, index) => {
                missions.push({
                    id: `steal-${asset.id}`,
                    description: asset.displayName || `Steal secret file #${index + 1}`,
                    targetType: 'secret_asset',
                    targetId: asset.id,
                    completed: false
                });
            });
        } else {
            const bombs = levelData.interactiveObjects.filter(obj => obj.type === 'bomb');
            bombs.forEach((bomb, index) => {
                missions.push({
                    id: `disarm-${bomb.id}`,
                    description: `Disarm bomb #${index + 1}`,
                    targetType: 'bomb',
                    targetId: bomb.id,
                    completed: false
                });
            });

            const intelTargets = levelData.interactiveObjects.filter(obj => obj.type === 'loot');
            intelTargets.forEach((loot, index) => {
                missions.push({
                    id: `intel-${loot.id}`,
                    description: intelTargets.length === 1 ? 'Collect the intel briefcase' : `Collect intel briefcase #${index + 1}`,
                    targetType: 'loot',
                    targetId: loot.id,
                    completed: false
                });
            });
        }

        return missions.length ? missions : [{
            id: 'explore-base',
            description: 'Explore the facility',
            targetType: 'none',
            targetId: 'none',
            completed: false
        }];
    }

    completeMission(targetType, targetId) {
        const mission = this.missions.find(m => 
            m.targetType === targetType && 
            m.targetId === targetId && 
            !m.completed
        );

        if (mission) {
            mission.completed = true;
            return true;
        }
        return false;
    }

    areAllMissionsComplete() {
        return this.missions.length > 0 && 
               this.missions.every(m => m.completed);
    }

    getCompletedCount() {
        return this.missions.filter(m => m.completed).length;
    }

    getTotalCount() {
        return this.missions.length;
    }

    getSaveData() {
        return this.missions.map(mission => ({
            id: mission.id,
            completed: mission.completed
        }));
    }

    loadFromData(savedMissions) {
        if (!Array.isArray(savedMissions)) return;
        savedMissions.forEach(saved => {
            const mission = this.missions.find(m => m.id === saved.id);
            if (mission) {
                mission.completed = !!saved.completed;
            }
        });
    }
}

export default MissionManager;
