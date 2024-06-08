<template>
    <div id="header">
        <div class="logo">
            <div id="hamburger">
                <i class="ri-menu-4-line"></i>
            </div>
            <b>Filez</b>
        </div>

        <!-- actions -->
        <div id="actions">
            <div @click="openfolderform" id="createFolder" class="action" :style="{
                opacity: (firstfolder != undefined && secondfolder == undefined || role == 'admin' && secondfolder == undefined) ? '100%' : '50%',
                pointerEvents: (firstfolder != undefined && secondfolder == undefined || role == 'admin' && secondfolder == undefined) ? 'auto' : 'none'
            }">
                <img src="../assets/apps/default/fileManager/assets/folder.png" alt="" srcset="" />
            </div>

            <div @click="openeditor" id="createFile" class="action" :style="{
                opacity: (firstfolder != undefined) ? '100%' : '50%',
                pointerEvents: (firstfolder != undefined) ? 'auto' : 'none'
            }">
                <img src="../assets/apps/default/fileManager/assets/file.png" alt="" srcset="" />
            </div>
            <div id="renameFile" class="action" v-if="role == 'admin'" @click="multiRename">
                <img src="../assets/apps/default/fileManager/assets/rename.png" alt="" srcset="" />
            </div>
            <div id="select" class="action" v-show="false">
                <img src="../assets/apps/default/fileManager/assets/select.png" alt="" srcset="" />
            </div>
            <div id="uploadFile" class="action" :style="{
                opacity: (firstfolder != undefined) ? '100%' : '50%',
                pointerEvents: (firstfolder != undefined) ? 'auto' : 'none'
            }">
                <img @click="selectfile" src="../assets/apps/default/fileManager/assets/upload.png" alt="" srcset="" />
                <input style="display: none;" multiple type="file" ref="fileButton" v-on:change="handleFileSelection"
                    id="uploadinput">
            </div>
            <div id="deleteFile" class="action" v-if="role == 'admin'" @click="multiDelete">
                <img src="../assets/apps/default/fileManager/assets/delete.png" alt="" srcset="" />
            </div>
        </div>

        <!-- header paths -->
        <div id="navigator">
            <div id="path" class="active">
                <span style="text-transform: capitalize;" @click="() => {
                    router.push('/' + path)
                }">{{ path }}</span>
                <img v-if="firstfolder != undefined" src="../assets/apps/default/fileManager/assets/forward.png"
                    alt="" />
                <span v-if="firstfolder != undefined" @click="() => {
                    router.push('/' + path + '/' + firstfolder)
                }">{{
                    firstfolder }}</span>
                <img v-if="secondfolder != undefined" src="../assets/apps/default/fileManager/assets/forward.png"
                    alt="" />
                <span v-if="secondfolder != undefined" @click="() => {
                    router.push('/' + path + '/' + firstfolder + '/' + secondfolder)
                }">{{ secondfolder }}</span>
            </div>
            <div id="pathInput" class="">
                <input type="text" name="" id="" placeholder="Enter directory path" />
            </div>
        </div>
        <!-- search bar -->
        <!-- <div id="searchBar">
            <input type="text" placeholder="Enter file or folder name" />
        </div> -->

        <div class="uploadingscreen" v-if="uploadProgress > 0">
            <div class="progress">
                <div class="bar" :style="{ width: uploadProgress + '%' }"></div>
            </div>
        </div>

    </div>
</template>

<script setup>
import { onMounted, watch, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { getdatabasedata, insertdatabasedata, firebaseApp } from '../scripts/firebasecofig.js'
import { ref as refFb, getStorage, uploadBytesResumable, getDownloadURL } from "firebase/storage";

const props = defineProps({
    filestructure: {
        type: Array,
        required: true
    }, role: {
        type: String,
        required: true
    }
});

const router = useRouter()
const route = useRoute()
const path = ref(route.params.data)
const firstfolder = ref(route.params.firstfolder)
const secondfolder = ref(route.params.secondfolder)
const fullpath = ref(router.currentRoute.value.fullPath)

const uploadProgress = ref(0)

const selectfile = () => {
    document.getElementById('uploadinput').click()
}

//nee file
const openeditor = () => {
    router.push('/editor?path=' + btoa(fullpath.value))
}

const handleFileSelection = (e) => {
    for (let i = 0; i < e.target.files.length; i++) {
        const imageFile = e.target.files[i];

        if (fileExistsInFolder(imageFile.name)) {
            notification.notify('"' + imageFile.name + '" already exist', 'Uploading failed !', '/favicon.ico');
            e.target.value = null;
            continue;
        }
        uploadImageAsPromise(imageFile);
    }
}

const fileExistsInFolder = (fileName) => {
    let fileStructure = props.filestructure;
    let pathParts = fullpath.value.split('/').splice(2).map(part => part.split('%20').join(' '));

    if (pathParts.length === 1) {
        const folder = fileStructure.find(item => item.name === pathParts[0] && item.type === 'folder');

        if (folder && folder.files) {
            return folder.files.some(file => file.name === fileName);
        }
    } else if (pathParts.length === 2) {
        const folder = fileStructure.find(item => item.name === pathParts[0] && item.type === 'folder');

        if (folder && folder.files) {
            const subFolder = folder.files.find(item => item.name === pathParts[1] && item.type === 'folder');

            if (subFolder && subFolder.files) {
                return subFolder.files.some(file => file.name === fileName);
            }
        }
    }

    return false;
}

const uploadImageAsPromise = (imageFile) => {
    try {
        uploadProgress.value = 5;
        const storage = getStorage(firebaseApp)
        const storageRef = refFb(storage, '/filez' + fullpath.value + '/' + imageFile.name);

        const uploadTask = uploadBytesResumable(storageRef, imageFile);

        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                uploadProgress.value = progress;
                console.log('Upload Progress:', progress); // Log progress
            },
            (error) => {
                console.error(error);
            },
            () => {
                getDownloadURL(storageRef)
                    .then((url) => {
                        const newfile = { name: imageFile.name, path: url, type: 'file' }
                        addfiletodatabase(newfile);
                        uploadProgress.value = 0;

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
        let file = props.filestructure;
        let pathParts = fullpath.value.split('/').splice(2).map(part => part.split('%20').join(' '));

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
    } catch (error) {
        console.error("Error adding file to database:", error);
    }
}

watch(route, (to, from) => {
    path.value = to.params.data;
    firstfolder.value = to.params.firstfolder;
    secondfolder.value = to.params.secondfolder;
    fullpath.value = router.currentRoute.value.fullPath;
});

const openfolderform = () => {
    document.getElementById('addfolderform').style.display = 'flex'
}

// actions
const multiRename = () => {
    const multilist = []
    const fileList = document.querySelector('#file-list')
    const list = fileList.querySelectorAll('li')
    list.forEach(li => {
        let inputCheck = li.querySelector('input')
        if (inputCheck.checked) {
            multilist.push(li)
        }
    })
    multilist.forEach(li => {
        li.querySelector('.fileaction').querySelector('.rename-btn').click();
    })
    console.log(multilist);
}

const multiDelete = () => {
    const multilist = []
    const fileList = document.querySelector('#file-list')
    const list = fileList.querySelectorAll('li')
    list.forEach(li => {
        let inputCheck = li.querySelector('input')
        if (inputCheck.checked) {
            multilist.push(li)
        }
    })

    if (confirm("Are you sure you want to delete this files")) {
        sessionStorage.setItem('multidelete', 'true')
        multilist.forEach(li => {
            li.querySelector('input').checked = false
            li.querySelector('.fileaction').querySelector('.delete-btn').click();
        })
        console.log(multilist);
        sessionStorage.removeItem('multidelete')
    }
}


onMounted(() => {
    document.getElementById('hamburger').addEventListener('click', () => {
        document.getElementById('sidebar').style.left = 0
    })
})
</script>

<style>
.uploadingscreen {
    position: fixed;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    z-index: 9999;
    background-color: rgba(0, 0, 0, 0.69);
    /* Semi-transparent background */
    display: flex;
    justify-content: center;
    align-items: center;
}

.uploadingscreen .progress {
    width: 300px;
    background: rgba(255, 255, 255, 0.389);
    border-radius: 10px;
    height: 10px;
}

.uploadingscreen .progress .bar {
    height: 100%;
    background-color: #f8ceec;
    background-image: linear-gradient(315deg, #f8ceec 0%, #a88beb 74%);
    border-radius: 10px;
    transition: 0.5s all;
}
</style>
