import { createApp } from 'vue';
import Plinth from '@plinth/ui';
import App from './App.vue';
import { installUi } from './ui';

const app = createApp(App);
installUi(app);
app.use(Plinth);
app.mount('#app');
