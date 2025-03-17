const mongoose = require("mongoose");
require("dotenv").config();

console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("DB_URL:", process.env.DB_URL);
console.log("DB_URL_TEST:", process.env.DB_URL_TEST);
mongoose.Promise = global.Promise;

const connect = (opts = {}) => {
  let url;
  switch (process.env.NODE_ENV) {
    case "test":
      url = process.env.DB_URL_TEST;
      break;
    default:
      url = process.env.DB_URL;
  }
  
  
  return mongoose.connect(url, {
    ...opts,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  });
};

const close = () => {
  return mongoose.connection.close();
};

const getConnection = () => {
  return mongoose.connection;
};

module.exports = { connect, close, getConnection };
