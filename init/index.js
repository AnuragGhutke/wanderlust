require('dotenv').config();
const mongoose = require('mongoose');
const { data } = require('./data.js');
const Listing = require('../models/Listing.js');

mongoose.connect(process.env.ATLAS_URL)
    .then(() => console.log('Connected to DB..'))
    .catch(err => console.log('DB connection error:', err));

const initDB = async () => {
    try {
        await Listing.deleteMany({});
        console.log("Old listings deleted");

        const finalData = data.map(obj => ({
            ...obj,
            owner: "68da5a0dde30e18d8b224cd7"
        }));

        console.log("First record to insert:", finalData[0]);

        await Listing.insertMany(finalData);
        console.log("New listings inserted");

    } catch (err) {
        console.log("Insert error:", err);
    } finally {
        mongoose.connection.close();
    }
};

initDB();
