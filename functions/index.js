// Required Packages
const functions = require('firebase-functions');
const express = require('express');

// Util Packages
const { admin, db } = require('./util/admin');
const FBAuth = require('./util/fbAuth');

// Routes Packages
const {
    getAllScreams,
    postOneScream,
    getScream,
    commentOnScream,
    unlikeScream,
    likeScream,
    deleteScream
} = require("./handlers/screams");
const {
    login,
    signup,
    uploadImage,
    addUserDetails,
    getAuthenticatedUser
} = require('./handlers/users');

// Express Variables
const app = express();

// App Routes
app.get('/screams', getAllScreams);
app.post('/scream', FBAuth, postOneScream);
app.get('/scream/:screamId', getScream);
app.delete('/scream/:screamId', FBAuth, deleteScream);
app.get('/scream/:screamId/unlike', FBAuth, unlikeScream);
app.get('/scream/:screamId/like', FBAuth, likeScream);
app.post('/scream/:screamId/comment', FBAuth, commentOnScream);

// User Routes
app.post('/signup', signup);
app.post('/login', login);
app.post("/user/image", FBAuth, uploadImage);
app.post("/user", FBAuth, addUserDetails);
app.get("/user", FBAuth, getAuthenticatedUser);

exports.api = functions.https.onRequest(app);