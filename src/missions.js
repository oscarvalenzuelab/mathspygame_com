// Mission system
class MissionManager {
    constructor() {
        this.missions = [];
        this.currentLevel = 1;
    }

    initializeLevel(level) {
        this.currentLevel = level;
        this.missions = this.getMissionsForLevel(level);
    }

    getMissionsForLevel(level) {
        // Define missions for each level
        const levelMissions = {
            1: [
                {
                    id: "disarm-main-bomb",
                    description: "Disarm the main bomb",
                    targetType: "bomb",
                    targetId: "bomb-1",
                    completed: false
                },
                {
                    id: "steal-intel",
                    description: "Collect the secret intel briefcase",
                    targetType: "loot",
                    targetId: "intel-1",
                    completed: false
                }
            ],
            2: [
                {
                    id: "disarm-bomb-1",
                    description: "Disarm the first bomb",
                    targetType: "bomb",
                    targetId: "bomb-1",
                    completed: false
                },
                {
                    id: "disarm-bomb-2",
                    description: "Disarm the second bomb",
                    targetType: "bomb",
                    targetId: "bomb-2",
                    completed: false
                },
                {
                    id: "steal-intel",
                    description: "Collect the secret intel",
                    targetType: "loot",
                    targetId: "intel-1",
                    completed: false
                }
            ],
            3: [
                {
                    id: "disarm-bomb-1",
                    description: "Disarm bomb #1",
                    targetType: "bomb",
                    targetId: "bomb-1",
                    completed: false
                },
                {
                    id: "disarm-bomb-2",
                    description: "Disarm bomb #2",
                    targetType: "bomb",
                    targetId: "bomb-2",
                    completed: false
                },
                {
                    id: "disarm-bomb-3",
                    description: "Disarm bomb #3",
                    targetType: "bomb",
                    targetId: "bomb-3",
                    completed: false
                },
                {
                    id: "steal-intel",
                    description: "Collect the final intel",
                    targetType: "loot",
                    targetId: "intel-1",
                    completed: false
                }
            ]
        };

        return levelMissions[level] || levelMissions[1];
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
