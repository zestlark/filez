<template>
    <div class="editorBox">
        <div class="header">
            <input v-model="filename" type="text" placeholder="Untitled file *">
            <button @click="savefile">Save</button>
        </div>
        <codemirror v-model="code" placeholder="Start writing..." :style="{ height: '100vh', fontSize: '14px' }"
            :autofocus="true" :indent-with-tab="true" :tab-size="2" :extensions="extensions" @ready="handleReady" />

        <div class="loader" v-if="loader">
            <img src="https://i0.wp.com/css-tricks.com/wp-content/uploads/2021/08/s_2A9C470D38F43091CCD122E63014ED4503CAA7508FAF0C6806AE473C2B94B83E_1627522653545_loadinfo.gif?resize=200%2C200&ssl=1"
                alt="">
        </div>
    </div>
</template>

<script setup>
import { ref, shallowRef, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Codemirror } from 'vue-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { html } from '@codemirror/lang-html'
import { EditorView } from '@codemirror/view'
import { oneDark } from '@codemirror/theme-one-dark'
import { fetchFileContent, firebaseApp, insertdatabasedata, getdatabasedata } from '../scripts/firebasecofig'
import { ref as refFb, getStorage, uploadBytesResumable, getDownloadURL } from "firebase/storage"

const router = useRouter()
const route = useRoute()
const urlParam = route.query.url || null
const pathParam = route.query.path || null

const loader = ref(false)

const filename = ref('')

// editor
const code = ref(``)
const view = shallowRef()

const savefile = () => {
    if (filename.value.length > 0) {
        const name = filename.value
        if (!name.includes('.')) {
            alert('Please add an extension to the file name');
            loader.value = false
            return
        }
        loader.value = true
        const file = new File([code.value], filename.value, { type: 'text/plain' });
        uploadImageAsPromise(file);
    } else {
        let promptfilename = prompt("Enter file name ");
        filename.value = promptfilename;
        if (filename.value.length > 0) {
            if (!filename.value.includes('.')) {
                alert('Please add an extension to the file name');
                loader.value = false
                return
            }
            loader.value = true
            const file = new File([code.value], filename.value, { type: 'text/plain' });
            uploadImageAsPromise(file);
        }
    }
}

const uploadImageAsPromise = (imageFile) => {
    try {
        const storage = getStorage(firebaseApp)
        const storageRef = refFb(storage, '/filez' + atob(pathParam) + '/' + imageFile.name);

        const uploadTask = uploadBytesResumable(storageRef, imageFile);

        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log('Upload Progress:', progress);
            },
            (error) => {
                console.error(error);
            },
            () => {
                getDownloadURL(storageRef)
                    .then((url) => {
                        const newfile = { name: imageFile.name, path: url, type: 'file' }
                        addfiletodatabase(newfile);

                    })
                    .catch((error) => {
                        console.error('Error getting download URL:', error);
                    });
            }
        );
    } catch (error) {
        console.error("Error uploading file:", error);
    }
}

const addfiletodatabase = async (data) => {
    try {
        let file = await getdatabasedata('/filez/global')
        let pathParts = atob(pathParam).split('/').splice(2).map(part => part.split('%20').join(' '));

        if (pathParts.length === 1) {
            const folder = file.find(item => item.name === pathParts[0] && item.type === 'folder');

            if (folder) {
                if (!folder.files) {
                    folder.files = [];
                }
                folder.files.push(data);
            }
        } else if (pathParts.length === 2) {
            const folder = file.find(item => item.name === pathParts[0] && item.type === 'folder');

            if (folder && folder.files) {
                const subFolder = folder.files.find(item => item.name === pathParts[1] && item.type === 'folder');

                if (subFolder) {
                    if (!subFolder.files) {
                        subFolder.files = [];
                    }
                    subFolder.files.push(data);
                }
            }
        }

        await insertdatabasedata('/filez/global', file);
        loader.value = false
        router.back()

    } catch (error) {
        loader.value = false
        console.error("Error adding file to database:", error);
    }
}

const handleReady = (payload) => {
    view.value = payload.view
}

const extensions = [
    html(),
    javascript(),
    EditorView.lineWrapping,
    oneDark
]

// const getCodemirrorStates = () => {
//     const state = view.value.state
//     const ranges = state.selection.ranges
//     const selected = ranges.reduce((r, range) => r + range.to - range.from, 0)
//     const cursor = ranges[0].anchor
//     const length = state.doc.length
//     const lines = state.doc.lines
//     // more state info ...
//     // return ...
// }


onMounted(async () => {
    if (urlParam) {
        code.value = await fetchFileContent(urlParam)
    }
    if (!pathParam) {
        router.back()
    }

})

</script>
<style scoped>
.editorBox {
    background: grey;
    height: 100vh;
}

.header {
    padding: 5px 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #1c2435;
}

.header input {
    padding: 5px 30px;
    background: #282c34;
    color: white;
    margin-bottom: -5px;
    clip-path: polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%);
    font-weight: 100;
    letter-spacing: 0.5px;
    font-size: 13px;
}

.header button {
    padding: 5px 20px;
    background: lightgreen;
    cursor: pointer;
    border-radius: 2px;
}

.loader {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.488);
    display: flex;
    justify-content: center;
    align-items: center;
    backdrop-filter: blur(5px);
}

.loader img {
    width: 40px;
    height: 40px;
}

@media(width<450px) {
    .header input{
        width: 200px;
    }
}
</style>