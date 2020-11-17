const express = require('express');
const connectDB = require('./config/db');
var cors = require("cors");
const app = express();
var allowedOrigins = [
    "http://localhost:3000",
    "https://v2.egoras.com",
    "https://egoras.org",
    "https://www.egoras.org",
    "http://www.egoras.org",
    "http://www.egoras.org",
    "http://www.ella.finance",
    "https://ella.finance",
    "https://www.ella.finance",
    "http://ella.finance",
    "https://www.app.ellaswap.com",
    "https://app.ellaswap.com",
    "http://www.app.ellaswap.com",
    "http://app.ellaswap.com",
    
  ];
  app.use(
    cors({
      origin: function (origin, callback) {
        // allow requests with no origin
        // (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
          var msg =
            "The CORS policy for this site does not " +
            "allow access from the specified Origin.";
          return callback(new Error(msg), false);
        }
        return callback(null, true);
      },
    })
  );
// Connect Database
// connectDB();

// Init Middleware
app.use(
  express.json({
    extended: false,
    limit: "50mb",
  })
);
app.use(
  express.urlencoded({ limit: "50mb", extended: false, parameterLimit: 50000 })
);

app.get('/', (req, res) => res.send('API Running'));

// Define Routes
app.use('/api/trade', require('./routes/api/trade'));
app.use('/api/market', require('./routes/api/markets'));
app.use('/api/exchange', require('./routes/api/exchangeCronjobs'));


const PORT = process.env.PORT || 9803;

app.listen(PORT, () => console.log(`Server started on ${PORT}`));
