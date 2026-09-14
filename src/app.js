import { mountPricingSimulator } from './screens/pricing-simulator-screen.js';
import { mountWhoWeSellTo } from './screens/who-we-sell-to.js';
import { mountDataDisagreements } from './screens/data-disagreements.js';

const root = document.getElementById('app');
const navigate = (screen) => {
  if (screen === 'pricing') mountPricingSimulator(root, navigate);
  else if (screen === 'disagreements') mountDataDisagreements(root, navigate);
  else mountWhoWeSellTo(root, navigate);
};

navigate('who');
