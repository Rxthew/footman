const checkCorrespondingPermission = function (element) {
  const checkApplyPoints = function () {
    const applyPointsInput = document.querySelector("#apply_points");
    return applyPointsInput.checked;
  };

  const checkApplyRankings = function () {
    const applyRankingsInput = document.querySelector("#apply_ranking");
    return applyRankingsInput.checked;
  };

  const nameAttribute = element.getAttribute("name");

  switch (nameAttribute) {
    case "points":
      return checkApplyPoints();
    case "rankings":
      return checkApplyRankings();
  }
};

const checkCorrespondingChosenTeam = function (element, disableStatus) {

  const parseReference = function(ref){
    const rawName = ref.split(' ');
    const teamId = rawName.join('');
    return teamId
  }

  const reference = element.dataset.team;
  const chosenTeams = document.querySelectorAll("input[name=chosenTeams]");
  const referencedInput = Array.from(chosenTeams).filter(
    (team) => team.id === parseReference(reference)
  )[0];
  if (referencedInput.checked) {
    element.disabled = disableStatus;
  } else {
    element.disabled = true;
  }
};

const toggleCorrespondingInputs = function (event) {
  if (
    event.target.hasAttribute("name") &&
    event.target.getAttribute("name") === "chosenTeams"
  ) {
    const reference = event.target.id;
    const targets = document.querySelectorAll(`[data-team="${reference}"]`);
    if (event.target.checked) {
      targets.length > 0
        ? targets.forEach((target) =>
            checkCorrespondingPermission(target)
              ? (target.disabled = false)
              : target
          )
        : targets;
    } else {
      targets.length > 0
        ? targets.forEach((target) => (target.disabled = true))
        : targets;
    }
  }
  return;
};

const togglePoints = function (event) {
  if (event.target.id === "apply_points") {
    const points = document.querySelectorAll("input[name=points]");
    if (event.target.checked) {
      points.forEach((point) => checkCorrespondingChosenTeam(point, false));
    } else {
      points.forEach((point) => checkCorrespondingChosenTeam(point, true));
    }
  }
};

const toggleRanking = function (event) {
  if (
    event.target.id === "apply_ranking" ||
    event.target.id === "apply_points"
  ) {
    const ranks = document.querySelectorAll("select[name=rankings]");
    const pointsPermit = document.getElementById("apply_points");
    const ranksPermit = document.getElementById("apply_ranking");
    if (pointsPermit.checked) {
      ranks.forEach((rank) => checkCorrespondingChosenTeam(rank, false));
      ranksPermit.checked = true;
    } else if (ranksPermit.checked) {
      ranks.forEach((rank) => checkCorrespondingChosenTeam(rank, false));
    } else {
      ranks.forEach((rank) => checkCorrespondingChosenTeam(rank, true));
    }
  }
  return;
};

const form = document.querySelector("form");
form.addEventListener("click", toggleRanking);
form.addEventListener("click", togglePoints);
form.addEventListener("click", toggleCorrespondingInputs);
