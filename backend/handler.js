const axios = require("axios");
const cheerio = require("cheerio");

// Function to extract player stats from HTML
function extractPlayerStats(html) {
  const $ = cheerio.load(html);
  const table = $("table").eq(4);
  const headers = [];
  const statsData = [];

  // Extract table headers
  table.find("thead tr th").each((i, el) => {
    headers.push($(el).text().trim());
  });

  // Extract first table row only
  const firstRow = table.find("tbody tr").first();
  const row = {};
  firstRow.find("td").each((j, cell) => {
    row[headers[j]] = $(cell).text().trim();
  });
  statsData.push(row);

  return statsData;
}

// Function to extract player's nameSlug from API response
function getNameSlug(data) {
  const player = data.people[0];
  return player.nameSlug;
}

// Function to extract player's teamId from API response
function getTeamId(data) {
  const player = data.people[0];
  const team = player.currentTeam;
  return team.id;
}

// Function to extract player's name and image from the player's page
function extractPlayerInfo(html) {
  const $ = cheerio.load(html);
  const playerHeader = $(".player-header__container");
  const playerName = playerHeader.find("img").attr("alt");
  const playerImageSrc = playerHeader.find("img").attr("src");

  return {
    playerName,
    playerImageSrc,
  };
}

// Function to extract player's schedule from API response
function extractSchedule(data) {
  const games = data.dates.flatMap((date) =>
    date.games.map((game) => ({
      homeTeam: game.teams.home.team.name,
      awayTeam: game.teams.away.team.name,
      gameDate: game.gameDate,
    }))
  );

  return games;
}

// Function to search for player's data
async function searchPlayer(playerName, numGames, endDate) {
  const searchUrl = `https://statsapi.mlb.com/api/v1/people/search?names=${encodeURIComponent(
    playerName
  )}&sportIds=11,12,13,14,15,5442,16&active=true&hydrate=currentTeam,team`;

  try {
    // Search for the player
    const response = await axios.get(searchUrl);
    const searchData = response.data;

    if (searchData.people.length === 0) {
      throw new Error(`Player "${playerName}" not found`);
    }

    // Extract player's nameSlug
    const nameSlug = getNameSlug(searchData);

    // Get the player's page URL
    const playerUrl = `https://www.milb.com/player/${nameSlug}`;

    // Get player's stats from the player's page
    const playerResponse = await axios.get(playerUrl);
    const playerStats = extractPlayerStats(playerResponse.data);

    // Extract player's name and image
    const playerInfo = extractPlayerInfo(playerResponse.data);
    const { playerName: actualPlayerName, playerImageSrc } = playerInfo;

    // Get player's teamId
    const teamId = getTeamId(searchData);

    // Get player's schedule
    const currentDate = new Date().toISOString().slice(0, 10);
    const scheduleUrl = `https://statsapi.mlb.com/api/v1/schedule?lang=en&sportId=11,12,13,14,15,16,5442,22&hydrate=team(venue(timezone,location)),venue(timezone,location),game(seriesStatus,seriesSummary,tickets,promotions,sponsorships,content(summary,media(epg))),seriesStatus,seriesSummary,decisions,person,linescore,broadcasts(all),tickets,event(tickets),radioBroadcasts&season=2023&startDate=${currentDate}&endDate=${endDate}&teamId=${teamId}&eventTypes=primary&scheduleTypes=games,events,xref`;

    const scheduleResponse = await axios.get(scheduleUrl);
    const scheduleData = scheduleResponse.data;
    const schedule = extractSchedule(scheduleData).slice(0, numGames);

    const playerData = {
      playerName: actualPlayerName,
      playerImageSrc,
      stats: playerStats,
      nextGames: schedule,
    };

    return playerData;
  } catch (error) {
    console.log(error);
    throw new Error("Failed to retrieve player data");
  }
}

// Handler function for AWS Lambda
exports.handler = async (event) => {
  const { playerName, numGames, endDate } = event;

  try {
    const playerData = await searchPlayer(playerName, numGames, endDate);
    return {
      statusCode: 200,
      body: JSON.stringify(playerData),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Failed to retrieve player data" }),
    };
  }
};
