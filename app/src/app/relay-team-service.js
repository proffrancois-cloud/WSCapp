(function () {
  function createRelayTeamService(options = {}) {
    const constants = options.constants || {};
    const helpers = options.helpers || {};
    const gameConfig = constants.GAME_CONFIG || {};
    const relayKeyLayouts = constants.RELAY_KEY_LAYOUTS || {};
    const getThemedTeamLabel = helpers.getThemedTeamLabel || ((index) => `Team ${index + 1}`);

    function createRelayTeams(count = gameConfig.relayDefaultTeams) {
      const bindings = relayKeyLayouts[count];
      return bindings.map((binding, index) => ({
        id: `relay-team-${index + 1}`,
        label: getThemedTeamLabel(index),
        key: binding.key,
        keyLabel: binding.label,
        score: 0,
        correct: 0,
        wrong: 0
      }));
    }

    function syncRelayTeamBindings(experience) {
      const bindings = relayKeyLayouts[experience.teams.length];
      experience.teams = experience.teams.map((team, index) => ({
        ...team,
        label: `Team ${index + 1}`,
        key: bindings[index].key,
        keyLabel: bindings[index].label
      }));
    }

    return {
      createRelayTeams,
      syncRelayTeamBindings
    };
  }

  window.WSC_CREATE_RELAY_TEAM_SERVICE = createRelayTeamService;
}());
