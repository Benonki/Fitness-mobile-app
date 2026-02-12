require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');
const { initializeData } = require('./data/initialData');

const PORT = process.env.PORT;

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
      console.log('Połączono z MongoDB');

      return initializeData();
    })
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Serwer działa na porcie ${PORT}`);
      });
    })
    .catch(err => {
      console.error('Błąd krytyczny przy uruchamianiu serwera:', err);
      process.exit(1);
    });