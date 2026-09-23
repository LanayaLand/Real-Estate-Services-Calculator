const propertyPrice = document.querySelector('#propertyPrice');
const markupRate = document.querySelector('#markupRate');
const commissionRate = document.querySelector('#commissionRate');
const brokerRate = document.querySelector('#brokerRate');
const salespersonRate = document.querySelector('#salespersonRate');
const referralRate = document.querySelector('#referralRate');
const fixedCompanyRate = 10;
const minBrokerRate = 20;
const maxBrokerRate = 40;
const minReferralRate = 0;
const maxReferralRate = 40;
const minSalespersonRate = 45;
const maxSalespersonRate = 75;
const formatter = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 });

const money = value => formatter.format(Math.max(0, Number(value) || 0));
const number = element => Math.max(0, Number(element.value) || 0);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function balancePair(first, second, target, firstMin, firstMax, secondMin, secondMax) {
  let balancedFirst = clamp(first, firstMin, firstMax);
  let balancedSecond = clamp(second, secondMin, secondMax);
  let difference = target - balancedFirst - balancedSecond;

  if (difference > 0) {
    const firstIncrease = Math.min(difference, firstMax - balancedFirst);
    balancedFirst += firstIncrease;
    difference -= firstIncrease;
    balancedSecond += Math.min(difference, secondMax - balancedSecond);
  } else if (difference < 0) {
    const firstDecrease = Math.min(-difference, balancedFirst - firstMin);
    balancedFirst -= firstDecrease;
    difference += firstDecrease;
    balancedSecond -= Math.min(-difference, balancedSecond - secondMin);
  }

  return [balancedFirst, balancedSecond];
}

function getRateValues() {
  return {
    broker: number(brokerRate),
    salesperson: number(salespersonRate),
    referral: number(referralRate),
  };
}

function setRateValues({ broker, salesperson, referral }) {
  brokerRate.value = Number(broker).toFixed(1);
  salespersonRate.value = Number(salesperson).toFixed(1);
  referralRate.value = Number(referral).toFixed(1);
}

function updateDisplay() {
  const price = number(propertyPrice);
  const markup = number(markupRate);
  const poolPercent = number(commissionRate);
  const serviceFee = price * markup / 100;
  const pool = price * poolPercent / 100;
  const rates = getRateValues();
  const companyShareOfPool = fixedCompanyRate;
  const allocationPercent = rates.broker + rates.salesperson + rates.referral + companyShareOfPool;
  const difference = 100 - allocationPercent;
  const companyAmount = pool * companyShareOfPool / 100;

  document.querySelector('#serviceFee').textContent = money(serviceFee);
  document.querySelector('#serviceFeeCaption').textContent = `${markup}% on ${money(price)} (commission + other fees included)`;
  document.querySelector('#propertyPriceResult').textContent = money(price);
  document.querySelector('#sellingPriceResult').textContent = money(price + serviceFee);
  document.querySelector('#markupResult').textContent = `${markup}%`;
  document.querySelector('#poolResult').textContent = money(pool);
  document.querySelector('#poolDisplay').textContent = money(pool);
  document.querySelector('#poolPercentDisplay').textContent = `${poolPercent}% of property price`;
  document.querySelector('#brokerAmount').textContent = money(pool * rates.broker / 100);
  document.querySelector('#salespersonAmount').textContent = money(pool * rates.salesperson / 100);
  document.querySelector('#referralAmount').textContent = money(pool * rates.referral / 100);
  document.querySelector('#companyAmount').textContent = money(companyAmount);
  document.querySelector('#allocationTotal').textContent = money(pool * allocationPercent / 100);

  const status = document.querySelector('#allocationStatus');
  const message = document.querySelector('#validationMessage');
  const isValid = Math.abs(difference) < 0.001;

  status.textContent = isValid ? '✓ Fully allocated' : '• Needs rebalancing';
  status.classList.toggle('invalid', !isValid);
  message.textContent = isValid ? '' : `Allocation is ${money(pool * Math.abs(difference) / 100)} ${difference > 0 ? 'short' : 'over'} the full commission pool.`;
}

function rebalance(changedLevel) {
  const current = getRateValues();
  const companyShare = fixedCompanyRate;
  const workingPool = 100 - companyShare;

  let broker = clamp(current.broker, minBrokerRate, maxBrokerRate);
  let salesperson = clamp(current.salesperson, minSalespersonRate, maxSalespersonRate);
  let referral = clamp(current.referral, minReferralRate, maxReferralRate);

  if (changedLevel === 'broker') {
    const targetBroker = clamp(number(brokerRate), minBrokerRate, maxBrokerRate);
    const delta = targetBroker - current.broker;
    broker = targetBroker;
    [salesperson, referral] = balancePair(
      current.salesperson - delta / 2,
      current.referral - delta / 2,
      workingPool - broker,
      minSalespersonRate,
      maxSalespersonRate,
      minReferralRate,
      maxReferralRate,
    );
  } else if (changedLevel === 'salesperson') {
    const targetSalesperson = clamp(number(salespersonRate), minSalespersonRate, maxSalespersonRate);
    const delta = targetSalesperson - current.salesperson;
    salesperson = targetSalesperson;
    broker = clamp(current.broker - delta, minBrokerRate, maxBrokerRate);
  } else if (changedLevel === 'referral') {
    const targetReferral = clamp(number(referralRate), minReferralRate, maxReferralRate);
    const delta = targetReferral - current.referral;
    referral = targetReferral;
    salesperson = clamp(current.salesperson - delta, minSalespersonRate, maxSalespersonRate);
  } else if (changedLevel === 'pool') {
    const targetBroker = clamp(current.broker, minBrokerRate, maxBrokerRate);
    const targetSalesperson = clamp(current.salesperson, minSalespersonRate, maxSalespersonRate);
    const targetReferral = clamp(current.referral, minReferralRate, maxReferralRate);
    const total = targetBroker + targetSalesperson + targetReferral;
    const delta = total - workingPool;
    salesperson = clamp(targetSalesperson - delta / 2, minSalespersonRate, maxSalespersonRate);
    referral = clamp(targetReferral - delta / 2, minReferralRate, maxReferralRate);
    broker = clamp(targetBroker, minBrokerRate, maxBrokerRate);
  }

  const total = broker + salesperson + referral;
  if (Math.abs(total - workingPool) > 0.001) {
    const difference = workingPool - total;
    if (changedLevel === 'referral') {
      salesperson = clamp(salesperson + difference, minSalespersonRate, maxSalespersonRate);
    } else if (changedLevel === 'salesperson') {
      broker = clamp(broker + difference, minBrokerRate, maxBrokerRate);
    } else {
      salesperson = clamp(salesperson + difference / 2, minSalespersonRate, maxSalespersonRate);
      referral = clamp(referral + difference / 2, minReferralRate, maxReferralRate);
    }
  }

  setRateValues({ broker, salesperson, referral });
  updateDisplay();
}

[propertyPrice, markupRate].forEach(element => element.addEventListener('input', updateDisplay));
commissionRate.addEventListener('input', () => rebalance('pool'));
brokerRate.addEventListener('input', () => rebalance('broker'));
salespersonRate.addEventListener('input', () => rebalance('salesperson'));
referralRate.addEventListener('input', () => rebalance('referral'));

document.querySelector('#resetButton').addEventListener('click', () => {
  propertyPrice.value = 5000000;
  markupRate.value = 21;
  commissionRate.value = 5;
  brokerRate.value = 35;
  salespersonRate.value = 55;
  referralRate.value = 0;
  updateDisplay();
});

updateDisplay();