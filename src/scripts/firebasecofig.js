import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, set } from 'firebase/database';
import { getStorage, ref as refStr, getDownloadURL, deleteObject } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyC4L9SAnN_JYlifBsK3HCq-YWOHJ9KiFkM",
    authDomain: "qfm-00.firebaseapp.com",
    projectId: "qfm-00",
    storageBucket: "qfm-00.appspot.com",
    messagingSenderId: "494546183200",
    appId: "1:494546183200:web:874f68bfb5c1c2d7b14845",
    measurementId: "G-DXKZDMSVNJ"
};

const firebaseApp = initializeApp(firebaseConfig);

const database = getDatabase(firebaseApp);
const storage = getStorage(firebaseApp);

async function getdatabasedata(path) {
    try {
        const dbRef = ref(database, path);
        const snapshot = await get(dbRef);
        if (snapshot.exists()) {
            return snapshot.val();
        } else {
            console.log("No data available");
            return null;
        }
    } catch (error) {
        console.error("Error getting data:", error);
        throw error;
    }
}

async function insertdatabasedata(path, newData) {
    try {
        const dbRef = ref(database, path);
        console.log(path);
        await set(dbRef, newData);
        console.log("Data inserted successfully!");
    } catch (error) {
        console.error("Error inserting data:", error);
        throw error;
    }
}

async function fetchFileContent(url) {
    try {
        // const proxyServerUrl = `http://localhost:3000/proxy?url=${encodeURIComponent(url)}`;
        // const response = await fetch(proxyServerUrl, { mode: 'cors' });

        // if (!response.ok) {
        //     throw new Error(`Error fetching file content: ${response.statusText}`);
        // }

        // const fileContent = await response.text();
        // console.log(fileContent);
        return 'write something...';
    } catch (error) {
        console.error('Error fetching file content:', error);
    }
}


async function deleteFileByUrl(fileUrl) {
    try {
        const fileRef = refStr(storage, fileUrl);
        await deleteObject(fileRef);
        console.log(`File at ${fileUrl} deleted successfully from Firebase Storage.`);
    } catch (error) {
        console.error('Error deleting file:', error);
    }
}



export { database, storage, getdatabasedata, insertdatabasedata, fetchFileContent, firebaseApp, deleteFileByUrl };