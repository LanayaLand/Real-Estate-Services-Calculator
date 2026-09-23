const propertyPrice = document.querySelector('#propertyPrice');
const markupRate = document.querySelector('#markupRate');
const commissionRate = document.querySelector('#commissionRate');
const brokerRate = document.querySelector('#brokerRate');
const salespersonRate = document.querySelector('#salespersonRate');
const referralRate = document.querySelector('#referralRate');
const fixedCompanyRate = 10;
const minBrokerRate = 20;
const minReferralRate = 0;
const maxReferralRate = 40;
const minSalespersonRate = 30;
const maxSalespersonRate = 70;
const formatter = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 });

const money = value => formatter.format(Math.max(0, Number(value) || 0));
const number = element => Math.max(0, Number(element.value) || 0);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

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
  const rates = getRateValues();
  const companyShare = fixedCompanyRate;
  const workingPool = 100 - companyShare;

  if (changedLevel === 'broker') {
    let broker = clamp(rates.broker, minBrokerRate, 100 - companyShare);
    let salesperson = clamp(rates.salesperson, minSalespersonRate, maxSalespersonRate);
    let referral = clamp(rates.referral, minReferralRate, maxReferralRate);

    const currentTotal = broker + salesperson + referral;
    const delta = currentTotal - workingPool;

    if (delta > 0) {
      const split = delta / 2;
      salesperson = clamp(salesperson - split, minSalespersonRate, maxSalespersonRate);
      referral = clamp(referral - split, minReferralRate, maxReferralRate);
    }

    const remaining = workingPool - broker - salesperson - referral;
    if (remaining > 0) {
      const extra = Math.min(remaining, maxReferralRate - referral);
      referral = clamp(referral + extra, minReferralRate, maxReferralRate);
    }

    setRateValues({ broker, salesperson, referral });
  } else if (changedLevel === 'salesperson') {
    let broker = clamp(rates.broker, minBrokerRate, 100 - companyShare);
    let salesperson = clamp(rates.salesperson, minSalespersonRate, maxSalespersonRate);
    let referral = clamp(rates.referral, minReferralRate, maxReferralRate);

    const currentTotal = broker + salesperson + referral;
    const delta = currentTotal - workingPool;

    if (delta > 0) {
      broker = clamp(broker - delta, minBrokerRate, 100 - companyShare);
    }

    setRateValues({ broker, salesperson, referral });
  } else if (changedLevel === 'referral') {
    let broker = clamp(rates.broker, minBrokerRate, 100 - companyShare);
    let salesperson = clamp(rates.salesperson, minSalespersonRate, maxSalespersonRate);
    let referral = clamp(rates.referral, minReferralRate, maxReferralRate);

    const currentTotal = broker + salesperson + referral;
    const delta = currentTotal - workingPool;

    if (delta > 0) {
      salesperson = clamp(salesperson - delta, minSalespersonRate, maxSalespersonRate);
    }

    setRateValues({ broker, salesperson, referral });
  } else if (changedLevel === 'pool') {
    let broker = clamp(rates.broker, minBrokerRate, 100 - companyShare);
    let salesperson = clamp(rates.salesperson, minSalespersonRate, maxSalespersonRate);
    let referral = clamp(rates.referral, minReferralRate, maxReferralRate);

    const currentTotal = broker + salesperson + referral;
    const delta = currentTotal - workingPool;

    if (delta > 0) {
      const split = delta / 2;
      salesperson = clamp(salesperson - split, minSalespersonRate, maxSalespersonRate);
      referral = clamp(referral - split, minReferralRate, maxReferralRate);
    }

    setRateValues({ broker, salesperson, referral });
  }

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
  salespersonRate.value = 65;
  referralRate.value = 0;
  updateDisplay();
});

updateDisplay();