const propertyPrice = document.querySelector('#propertyPrice');
const markupRate = document.querySelector('#markupRate');
const commissionRate = document.querySelector('#commissionRate');
const brokerRate = document.querySelector('#brokerRate');
const salespersonRate = document.querySelector('#salespersonRate');
const referralRate = document.querySelector('#referralRate');
const fixedCompanyRate = 0.5;
const formatter = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 });

const money = value => formatter.format(Math.max(0, Number(value) || 0));
const number = element => Math.max(0, Number(element.value) || 0);

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
  const company = fixedCompanyRate;
  const allocationPercent = rates.broker + rates.salesperson + rates.referral + company;
  const difference = poolPercent - allocationPercent;

  document.querySelector('#serviceFee').textContent = money(serviceFee);
  document.querySelector('#serviceFeeCaption').textContent = `${markup}% of ${money(price)}`;
  document.querySelector('#propertyPriceResult').textContent = money(price);
  document.querySelector('#markupResult').textContent = `${markup}%`;
  document.querySelector('#poolResult').textContent = money(pool);
  document.querySelector('#poolDisplay').textContent = money(pool);
  document.querySelector('#poolPercentDisplay').textContent = `${poolPercent}% of property price`;
  document.querySelector('#brokerAmount').textContent = money(price * rates.broker / 100);
  document.querySelector('#salespersonAmount').textContent = money(price * rates.salesperson / 100);
  document.querySelector('#referralAmount').textContent = money(price * rates.referral / 100);
  document.querySelector('#companyAmount').textContent = money(price * company / 100);
  document.querySelector('#allocationTotal').textContent = money(price * allocationPercent / 100);

  const status = document.querySelector('#allocationStatus');
  const message = document.querySelector('#validationMessage');
  const isValid = Math.abs(difference) < 0.001 && poolPercent >= fixedCompanyRate;

  status.textContent = isValid ? '✓ Fully allocated' : '• Needs rebalancing';
  status.classList.toggle('invalid', !isValid);
  message.textContent = isValid ? '' : `Allocation is ${money(price * Math.abs(difference) / 100)} ${difference > 0 ? 'short' : 'over'} the ${poolPercent}% commission pool.`;
}

function rebalance(changedLevel) {
  const poolPercent = number(commissionRate);
  const editablePercent = Math.max(0, poolPercent - fixedCompanyRate);
  const rates = getRateValues();

  if (changedLevel === 'broker') {
    const broker = Math.min(rates.broker, editablePercent);
    const salesperson = Math.max(0, editablePercent - broker - rates.referral);
    const referral = Math.max(0, editablePercent - broker - salesperson);
    setRateValues({ broker, salesperson, referral });
  } else if (changedLevel === 'salesperson') {
    const salesperson = Math.min(rates.salesperson, editablePercent);
    const broker = Math.max(0, editablePercent - salesperson - rates.referral);
    const referral = Math.max(0, editablePercent - broker - salesperson);
    setRateValues({ broker, salesperson, referral });
  } else if (changedLevel === 'referral') {
    const referral = Math.min(rates.referral, editablePercent);
    const salesperson = Math.max(0, editablePercent - rates.broker - referral);
    const broker = Math.max(0, editablePercent - salesperson - referral);
    setRateValues({ broker, salesperson, referral });
  } else if (changedLevel === 'pool') {
    const broker = rates.broker;
    const salesperson = Math.min(rates.salesperson, Math.max(0, editablePercent - broker));
    const referral = Math.max(0, editablePercent - broker - salesperson);
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
  brokerRate.value = 1;
  salespersonRate.value = 2.5;
  referralRate.value = 1;
  updateDisplay();
});

updateDisplay();