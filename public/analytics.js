// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAnalytics, logEvent } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-analytics.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBA4xvv5d-iTzdCB6nrCflgi8ITKkK2xzM",
    authDomain: "desypher-6245f.firebaseapp.com",
    projectId: "desypher-6245f",
    storageBucket: "desypher-6245f.appspot.com",
    messagingSenderId: "610547791990",
    appId: "1:610547791990:web:f6589b7e073f0d02338757",
    measurementId: "G-VSQK0FQSSB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

logEvent(analytics, 'page_view', {
    page_path: window.location.pathname
});