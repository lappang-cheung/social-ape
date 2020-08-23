// Required Packages
const firebase = require('firebase');
// Util packages
const { admin, db } = require("../util/admin");
const { validateSignupData, validateLoginData, reduceUserDetails } = require("../util/validators");
// Firebase Config
const firebaseConfig = require("../config/webkey.json");

// Firebase Variables
firebase.initializeApp(firebaseConfig);

// Signup User
exports.signup = async (req, res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle,
    };
    
    const { valid, errors } = validateSignupData(newUser);

    if(!valid) return res.status(400).json(errors)
    
    const noImage = 'avatar.jpg'

    let token, userId;

    db.doc(`/users/${newUser.handle}`)
        .get()
        .then((doc) => {
        if (doc.exists) {
            return res.status(400).json({ handle: "This handle is already token" });
        } else {
            firebase
            .auth()
            .createUserWithEmailAndPassword(newUser.email, newUser.password)
            .then((data) => {
                userId = data.user.uid;
                return data.user.getIdToken();
            })
            .then((idToken) => {
                token = idToken;
                const userCredentials = {
                    handle: newUser.handle,
                    email: newUser.email,
                    createdAt: new Date().toISOString(),
                    imageUrl: `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${noImage}?alt=media`,
                    userId,
                };
                return db.doc(`/users/${newUser.handle}`).set(userCredentials);
            })
            .then(() => {
                return res.status(201).json({ token });
            })
            .catch((err) => {
                console.error(err);
                if (err.code === "auth/email-already-in-use") {
                return res.status(400).json({ email: "Email is alrady in use" });
                } else {
                return res.status(500).json({ error: err.code });
                }
            });
        }
    }); 
};

// Login User
exports.login = (req, res) => {
    const user = {
        email: req.body.email,
        password: req.body.password,
    };
    
    const { valid, errors } = validateLoginData(user);

    if (!valid) return res.status(400).json(errors);


    firebase
        .auth()
        .signInWithEmailAndPassword(user.email, user.password)
        .then((data) => {
        return data.user.getIdToken();
        })
        .then((token) => {
        return res.json({ token });
        })
        .catch((err) => {
        console.error(err);
        if (err.code === "auth/wrong-password") {
            return res
                .status(403)
                .json({ general: "Wrong credentials, please try again" });
            } else {
                return res.status(500).json({ error: err.code });
            }
        });
};

// Add user details
exports.addUserDetails = (req, res) => {
    let userDetails = reduceUserDetails(req.body);

    db.doc(`/users/${req.user.handle}`).update(userDetails)
        .then(() => {
            return res.json({ message: 'Details added successfully'})
        })
        .catch(err => {
            console.error(err)
            return res.status(500).json({ error: err.code })
        })
}

// Get own user details
exports.getAuthenticatedUser = (req, res) => {
    let userData = {}
    db.doc(`/users/${req.user.handle}`)
        .get()
        .then(doc => {
            if (doc.exists) {
                userData.credentials = doc.data()
                return db.collection('likes').where('userHandle', '==', req.user.handle).get()
            }
        })
        .then(data => {
            userData.likes = []
            data.forEach(doc => {
                userData.likes.push(doc.data());
            });
            return res.json(userData);
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({ error: err.code })
        })
}

// Upload image for profile
exports.uploadImage = (req, res) => {
    const BusBoy = require('busboy');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');

    const busboy = new BusBoy({ headers: req.headers });

    let imageFileName, imageToBeUploaded = {};

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        if (
            mimetype !== "image/jpeg" &&
            mimetype !== "image/jpg" &&
            mimetype !== "image/png"
        ) {
            return res.status(400).json({ error: "Wrong file type submitted" });
        }
        const imageExtension = filename.split('.')[filename.split('.').length - 1];
        imageFileName = `${Math.round(Math.random() * 1000000000000)}.${imageExtension}`;
        const filepath = path.join(os.tmpdir(), imageFileName);
        imageToBeUploaded = { filepath, mimetype }
        file.pipe(fs.createWriteStream(filepath));
    })

    busboy.on('finish', () => {
        admin
            .storage()
            .bucket(firebaseConfig.storageBucket)
            .upload(imageToBeUploaded.filepath, {
                resumable: false,
                metadata: {
                metadata: {
                    contentType: imageToBeUploaded.mimetype,
                },
                },
            })
            .then(() => {
                const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${imageFileName}?alt=media`;
                return db.doc(`/users/${req.user.handle}`).update({ imageUrl });
            })
            .then(() => {
                return res.json({ message: "image uploaded successfully" });
            })
            .catch((err) => {
                console.error(err);
                return res.status(500).json({ error: "something went wrong" });
            });
    });

    busboy.end(req.rawBody);
}