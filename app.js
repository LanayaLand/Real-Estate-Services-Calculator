const propertyPrice = document.querySelector('#propertyPrice');
const markupRate = document.querySelector('#markupRate');
const commissionRate = document.querySelector('#commissionRate');
const brokerRate = document.querySelector('#brokerRate');
const salespersonRate = document.querySelector('#salespersonRate');
const referralRate = document.querySelector('#referralRate');
const fixedCompanyRate = 10;
const minBrokerRate = 10;
const minReferralRate = 20;
const maxReferralRate = 40;
const minSalespersonRate = 50;
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
  const remainingPercent = 100 - fixedCompanyRate;

  if (changedLevel === 'referral') {
    const referral = clamp(rates.referral, minReferralRate, maxReferralRate);
    const salesperson = clamp(Math.min(maxSalespersonRate, remainingPercent - referral), minSalespersonRate, maxSalespersonRate);
    const broker = Math.max(minBrokerRate, remainingPercent - referral - salesperson);
    setRateValues({ broker, salesperson, referral });
  } else if (changedLevel === 'salesperson') {
    const salesperson = clamp(rates.salesperson, minSalespersonRate, maxSalespersonRate);
    const referral = clamp(Math.max(minReferralRate, remainingPercent - salesperson), minReferralRate, maxReferralRate);
    const broker = Math.max(minBrokerRate, remainingPercent - referral - salesperson);
    setRateValues({ broker, salesperson, referral });
  } else if (changedLevel === 'broker') {
    const broker = Math.max(minBrokerRate, rates.broker);
    const salesperson = clamp(Math.max(minSalespersonRate, Math.min(maxSalespersonRate, remainingPercent - broker - rates.referral)), minSalespersonRate, maxSalespersonRate);
    const referral = clamp(Math.max(minReferralRate, remainingPercent - broker - salesperson), minReferralRate, maxReferralRate);
    setRateValues({ broker, salesperson, referral });
  } else if (changedLevel === 'pool') {
    const referral = clamp(rates.referral, minReferralRate, maxReferralRate);
    const salesperson = clamp(Math.max(minSalespersonRate, Math.min(maxSalespersonRate, remainingPercent - referral)), minSalespersonRate, maxSalespersonRate);
    const broker = Math.max(minBrokerRate, remainingPercent - referral - salesperson);
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
  brokerRate.value = 0;
  salespersonRate.value = 60;
  referralRate.value = 30;
  updateDisplay();
});

updateDisplay();