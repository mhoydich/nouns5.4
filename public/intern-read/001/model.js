const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const compactMoney = (value) => {
  const sign = value < 0 ? "−" : "";
  const absolute = Math.abs(value);
  if (absolute >= 1_000_000) return `${sign}$${(absolute / 1_000_000).toFixed(2)}M`;
  if (absolute >= 1_000) return `${sign}$${(absolute / 1_000).toFixed(1)}K`;
  return `${sign}${money.format(absolute)}`;
};

const inputs = {
  salary: document.querySelector("#salary"),
  takeHome: document.querySelector("#take-home"),
  essentials: document.querySelector("#essentials"),
  debt: document.querySelector("#debt"),
  cash: document.querySelector("#cash"),
  personal: document.querySelector("#personal"),
  match: document.querySelector("#match"),
  growth: document.querySelector("#growth"),
  annualReturn: document.querySelector("#return"),
};

const labels = {
  salary: document.querySelector("#salary-value"),
  takeHome: document.querySelector("#take-home-value"),
  essentials: document.querySelector("#essentials-value"),
  debt: document.querySelector("#debt-value"),
  cash: document.querySelector("#cash-value"),
  personal: document.querySelector("#personal-value"),
  match: document.querySelector("#match-value"),
  growth: document.querySelector("#growth-value"),
  annualReturn: document.querySelector("#return-value"),
};

const outputs = {
  margin: document.querySelector("#margin-output"),
  marginMessage: document.querySelector("#margin-message"),
  runway: document.querySelector("#runway-output"),
  balance: document.querySelector("#balance-output"),
  personal: document.querySelector("#personal-output"),
  match: document.querySelector("#match-output"),
  returns: document.querySelector("#returns-output"),
  personalBar: document.querySelector("#personal-bar"),
  matchBar: document.querySelector("#match-bar"),
  returnsBar: document.querySelector("#returns-bar"),
};

const updateModel = () => {
  const salary = Number(inputs.salary.value);
  const takeHomeShare = Number(inputs.takeHome.value) / 100;
  const essentials = Number(inputs.essentials.value);
  const debt = Number(inputs.debt.value);
  const cash = Number(inputs.cash.value);
  const personalStart = Number(inputs.personal.value);
  const matchStart = Number(inputs.match.value);
  const contributionGrowth = Number(inputs.growth.value) / 100;
  const annualReturn = Number(inputs.annualReturn.value) / 100;

  const monthlyTakeHome = (salary * takeHomeShare) / 12;
  const monthlyMargin = monthlyTakeHome - essentials - debt - personalStart;
  const runway = essentials > 0 ? cash / essentials : 0;
  const monthlyReturn = (1 + annualReturn) ** (1 / 12) - 1;

  let balance = 0;
  let personalDeposits = 0;
  let employerDeposits = 0;

  for (let month = 0; month < 120; month += 1) {
    const year = Math.floor(month / 12);
    const growthFactor = (1 + contributionGrowth) ** year;
    const personalDeposit = personalStart * growthFactor;
    const employerDeposit = matchStart * growthFactor;

    balance *= 1 + monthlyReturn;
    balance += personalDeposit + employerDeposit;
    personalDeposits += personalDeposit;
    employerDeposits += employerDeposit;
  }

  const modeledReturns = balance - personalDeposits - employerDeposits;
  const stackTotal = Math.max(balance, 1);

  labels.salary.value = money.format(salary);
  labels.takeHome.value = `${Math.round(takeHomeShare * 100)}%`;
  labels.essentials.value = money.format(essentials);
  labels.debt.value = money.format(debt);
  labels.cash.value = money.format(cash);
  labels.personal.value = money.format(personalStart);
  labels.match.value = money.format(matchStart);
  labels.growth.value = `${(contributionGrowth * 100).toFixed(1)}%`;
  labels.annualReturn.value = `${(annualReturn * 100).toFixed(1)}%`;

  outputs.margin.textContent = compactMoney(monthlyMargin);
  outputs.runway.textContent = `${runway.toFixed(1)} months`;
  outputs.balance.textContent = compactMoney(balance);
  outputs.personal.textContent = compactMoney(personalDeposits);
  outputs.match.textContent = compactMoney(employerDeposits);
  outputs.returns.textContent = compactMoney(modeledReturns);
  outputs.personalBar.style.width = `${(personalDeposits / stackTotal) * 100}%`;
  outputs.matchBar.style.width = `${(employerDeposits / stackTotal) * 100}%`;
  outputs.returnsBar.style.width = `${Math.max(0, (modeledReturns / stackTotal) * 100)}%`;

  if (monthlyMargin < 0) {
    outputs.marginMessage.textContent = "The inputs overdraw the month. Change the plan before asking it to compound.";
  } else if (monthlyMargin < 250) {
    outputs.marginMessage.textContent = "The month clears, but there is little room for error.";
  } else if (runway < 1) {
    outputs.marginMessage.textContent = "The month clears. Reachable cash is still the fragile point.";
  } else {
    outputs.marginMessage.textContent = "The plan clears the month and leaves room to build range.";
  }
};

Object.values(inputs).forEach((input) => input.addEventListener("input", updateModel));
updateModel();

document.querySelector("#print-sheet").addEventListener("click", () => window.print());
