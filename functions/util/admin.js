// Required Packages
const admin = require("firebase-admin");
// Service Account
const serviceAccount = require("../config/serviceAccountKey.json");
// Initial App
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://social-ape-4bdae.firebaseio.com"
});
// Database for Firebase
const db = admin.firestore();

module.exports = { admin, db }