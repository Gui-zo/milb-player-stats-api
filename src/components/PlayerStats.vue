<template>
    <div class="container">
        <h1 class="title">Search Player Stats</h1>
        <form @submit.prevent="searchPlayer" class="form">
            <label for="playerName" class="label">Player Name:</label>
            <input type="text" id="playerName" v-model="searchedPlayerName" class="input" required>
            <label for="numGames" class="label">Number of Games:</label>
            <input type="number" id="numGames" v-model.number="numGames" class="input" required>
            <label for="endDate" class="label">End Date:</label>
            <input type="date" id="endDate" v-model="endDate" class="input" required>
            <button type="submit" class="button">Search</button>
        </form>

        <div v-if="loading" class="loading">Loading...</div>
        <div v-else-if="error" class="error">{{ error }}</div>
        <div v-else-if="playerData" class="player-data">
            <h2 class="player-name">{{ playerName }}</h2>
            <img :src="playerImageSrc" alt="Player Image" class="player-image">

            <h3 class="subtitle">Stats:</h3>
            <table class="stats-table">
                <thead>
                    <tr>
                        <th v-for="(value, key) in playerData" :key="key">{{ key }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td v-for="(value, key) in playerData" :key="key">{{ value }}</td>
                    </tr>
                </tbody>
            </table>
            <h3 class="subtitle">Next Games:</h3>
            <ul class="games-list">
                <li v-for="(game, index) in nextGames" :key="index" class="game-item">
                    {{ game.homeTeam }} vs {{ game.awayTeam }} - {{ game.gameDate }}
                </li>
            </ul>
        </div>
    </div>
</template>
  
  
<style>
.container {
    max-width: 500px;
    margin: 0 auto;
    padding: 20px;
}

.title {
    font-size: 24px;
    margin-bottom: 20px;
    text-align: center;
}

.form {
    display: flex;
    flex-direction: column;
    margin-bottom: 20px;
}

.label {
    font-size: 16px;
    margin-bottom: 5px;
}

.input {
    padding: 8px;
    font-size: 14px;
    margin-bottom: 10px;
}

.button {
    padding: 8px 12px;
    background-color: #007bff;
    color: #fff;
    font-size: 14px;
    border: none;
    cursor: pointer;
}

.loading {
    font-size: 16px;
    text-align: center;
    margin-bottom: 20px;
}

.error {
    font-size: 16px;
    text-align: center;
    color: #ff0000;
    margin-bottom: 20px;
}

.player-data {
    margin-bottom: 20px;
}

.player-name {
    font-size: 20px;
    margin-bottom: 10px;
}

.subtitle {
    font-size: 18px;
    margin-bottom: 10px;
}

.stats-list {
    list-style-type: none;
    padding: 0;
    margin: 0;
}

.stats-item {
    margin-bottom: 5px;
}

.stat-label {
    font-weight: bold;
}

.games-list {
    list-style-type: none;
    padding: 0;
    margin: 0;
}

.game-item {
    margin-bottom: 5px;
}

.stats-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 10px;
}

.stats-table th,
.stats-table td {
    border: 1px solid #ccc;
    padding: 8px;
    text-align: left;
}

.stats-table th {
    font-weight: bold;
}

.player-image {
    max-width: 200px;
    margin-bottom: 10px;
}
</style>
  
  
<script>
export default {
    data() {
        return {
            searchedPlayerName: "",
            numGames: 0,
            endDate: "",
            loading: false,
            error: "",
            playerData: null,
            playerImageSrc: "",
        };
    },
    methods: {
        async searchPlayer() {
            this.loading = true;
            this.error = "";
            this.playerData = null;

            try {
                const response = await fetch(
                    "https://4orwjfl7fk.execute-api.us-east-1.amazonaws.com/prod",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            playerName: this.searchedPlayerName,
                            numGames: this.numGames,
                            endDate: this.endDate,
                        }),
                    }
                );

                if (!response.ok) {
                    throw new Error("Failed to retrieve player data");
                }

                const data = await response.json();
                const playerStats = JSON.parse(data.body);
                this.playerData = playerStats.stats[0];
                this.playerImageSrc = playerStats.playerImageSrc;
                this.playerName = playerStats.playerName;
                this.nextGames = playerStats.nextGames.map((game) => ({
                    ...game,
                    gameDate: new Date(game.gameDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                    }),
                }));

            } catch (error) {
                this.error = "Failed to retrieve player data";
            } finally {
                this.loading = false;
            }
        },
    },
};
</script>
  