import { mountPricingSimulator } from './screens/pricing-simulator-screen.js';
import { mountWhoWeSellTo } from './screens/who-we-sell-to.js';

const root = document.getElementById('app');
const navigate = (screen) => {
  if (screen === 'pricing') mountPricingSimulator(root, navigate);
  else mountWhoWeSellTo(root, navigate);
};

navigate('who');
