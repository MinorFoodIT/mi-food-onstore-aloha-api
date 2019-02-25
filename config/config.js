require('dotenv').config({silent: true});

const config = {
    country: process.env.country,
    siteid: process.env.siteid
}
module.exports = config;