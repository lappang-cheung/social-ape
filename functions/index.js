// Required Packages
const functions = require('firebase-functions');
const express = require('express');

// Util Packages
const { db } = require('./util/admin');
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

exports.createNotificationOnLike = functions
  .firestore.document("likes/{id}")
  .onCreate((snapshot) => {
    return db
      .doc(`/screams/${snapshot.data().screamId}`)
      .get()
      .then((doc) => {
        if (
          doc.exists &&
          doc.data().userHandle !== snapshot.data().userHandle
        ) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            type: "like",
            read: false,
            screamId: doc.id,
          });
        }
      })
      .catch((err) => console.error(err));
  });

exports.deleteNotificationOnUnLike = functions
    .firestore.document("likes/{id}")
    .onDelete((snapshot) => {
        return db
        .doc(`/notifications/${snapshot.id}`)
        .delete()
        .catch((err) => {
            console.error(err);
            return;
        });
    });

exports.createNotificationOnComment = functions
    .firestore.document("comments/{id}")
    .onCreate((snapshot) => {
        return db
        .doc(`/screams/${snapshot.data().screamId}`)
        .get()
        .then((doc) => {
            if (
            doc.exists &&
            doc.data().userHandle !== snapshot.data().userHandle
            ) {
            return db.doc(`/notifications/${snapshot.id}`).set({
                createdAt: new Date().toISOString(),
                recipient: doc.data().userHandle,
                sender: snapshot.data().userHandle,
                type: "comment",
                read: false,
                screamId: doc.id,
            });
            }
    })
    .catch((err) => {
        console.error(err);
        return;
    });
});