import { Quasar, QBtn, QImg } from 'quasar';
import 'quasar/dist/quasar.css';
import '@quasar/extras/roboto-font/roboto-font.css';

export default (app) => {
  app.use(Quasar, {
    config: { dark: true },
    components: { QBtn, QImg }
  });
};
