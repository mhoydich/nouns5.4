const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const integer = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

const compactMoney = (value) => {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return money.format(value);
};

const inputs = {
  organizers: document.querySelector("#organizers"),
  games: document.querySelector("#games-per-organizer"),
  volume: document.querySelector("#volume-per-game"),
  takeRate: document.querySelector("#take-rate"),
  paidStudios: document.querySelector("#paid-studios"),
  studioArpa: document.querySelector("#studio-arpa"),
  enterpriseAccounts: document.querySelector("#enterprise-accounts"),
  enterpriseAcv: document.querySelector("#enterprise-acv"),
  multiple: document.querySelector("#revenue-multiple"),
};

const outputs = {
  organizers: document.querySelector("#organizers-value"),
  games: document.querySelector("#games-value"),
  volume: document.querySelector("#volume-value"),
  takeRate: document.querySelector("#take-rate-value"),
  paidStudios: document.querySelector("#studios-value"),
  studioArpa: document.querySelector("#studio-arpa-value"),
  enterpriseAccounts: document.querySelector("#enterprise-value"),
  enterpriseAcv: document.querySelector("#enterprise-acv-value"),
  multiple: document.querySelector("#multiple-value"),
  gmv: document.querySelector("#gmv-output"),
  gamesCount: document.querySelector("#moves-output"),
  revenue: document.querySelector("#revenue-output"),
  value: document.querySelector("#value-output"),
  fees: document.querySelector("#fees-output"),
  software: document.querySelector("#software-output"),
  enterprise: document.querySelector("#enterprise-output"),
  feesBar: document.querySelector("#fees-bar"),
  softwareBar: document.querySelector("#software-bar"),
  enterpriseBar: document.querySelector("#enterprise-bar"),
};

const updateModel = () => {
  const organizers = Number(inputs.organizers.value);
  const gamesPerOrganizer = Number(inputs.games.value);
  const volumePerGame = Number(inputs.volume.value);
  const takeRate = Number(inputs.takeRate.value) / 100;
  const paidStudios = Number(inputs.paidStudios.value);
  const studioArpa = Number(inputs.studioArpa.value);
  const enterpriseAccounts = Number(inputs.enterpriseAccounts.value);
  const enterpriseAcv = Number(inputs.enterpriseAcv.value);
  const multiple = Number(inputs.multiple.value);

  const annualGames = organizers * gamesPerOrganizer;
  const gmv = annualGames * volumePerGame;
  const fees = gmv * takeRate;
  const software = paidStudios * studioArpa;
  const enterprise = enterpriseAccounts * enterpriseAcv;
  const revenue = fees + software + enterprise;
  const impliedValue = revenue * multiple;
  const largestLine = Math.max(fees, software, enterprise, 1);

  outputs.organizers.value = integer.format(organizers);
  outputs.games.value = integer.format(gamesPerOrganizer);
  outputs.volume.value = money.format(volumePerGame);
  outputs.takeRate.value = `${(takeRate * 100).toFixed(1)}%`;
  outputs.paidStudios.value = integer.format(paidStudios);
  outputs.studioArpa.value = money.format(studioArpa);
  outputs.enterpriseAccounts.value = integer.format(enterpriseAccounts);
  outputs.enterpriseAcv.value = money.format(enterpriseAcv);
  outputs.multiple.value = `${multiple.toFixed(1)}×`;
  outputs.gmv.textContent = compactMoney(gmv);
  outputs.gamesCount.textContent = `${integer.format(annualGames)} games per year`;
  outputs.revenue.textContent = compactMoney(revenue);
  outputs.value.textContent = compactMoney(impliedValue);
  outputs.fees.textContent = compactMoney(fees);
  outputs.software.textContent = compactMoney(software);
  outputs.enterprise.textContent = compactMoney(enterprise);
  outputs.feesBar.style.width = `${(fees / largestLine) * 100}%`;
  outputs.softwareBar.style.width = `${(software / largestLine) * 100}%`;
  outputs.enterpriseBar.style.width = `${(enterprise / largestLine) * 100}%`;
};

Object.values(inputs).forEach((input) => input.addEventListener("input", updateModel));
updateModel();

const grid = document.querySelector("#window-grid");
const previewButton = document.querySelector("#preview-move");
const windowCount = document.querySelector("#window-count");
const windowMessage = document.querySelector("#window-message");
const colors = ["amber", "mint", "orange", "blue"];
let litWindows = 17;

for (let index = 0; index < 100; index += 1) {
  const windowElement = document.createElement("span");
  windowElement.className = "ccg-window";
  windowElement.setAttribute("aria-hidden", "true");
  if (index < litWindows) {
    windowElement.classList.add("is-lit", `is-${colors[index % colors.length]}`);
  }
  grid.append(windowElement);
}

previewButton.addEventListener("click", () => {
  if (litWindows >= 100) return;
  const nextWindow = grid.children[litWindows];
  nextWindow.classList.add("is-lit", `is-${colors[litWindows % colors.length]}`);
  nextWindow.animate(
    [
      { transform: "scale(0.72)", filter: "brightness(3)" },
      { transform: "scale(1)", filter: "brightness(1)" },
    ],
    { duration: 600, easing: "cubic-bezier(.2,.85,.2,1)" },
  );
  litWindows += 1;
  windowCount.textContent = String(litWindows);
  windowMessage.textContent = `${100 - litWindows} moves until the building wakes up.`;
  if (litWindows === 100) {
    windowMessage.textContent = "The building is awake. The show begins.";
    previewButton.disabled = true;
    previewButton.textContent = "THE BUILDING IS AWAKE";
  }
});
