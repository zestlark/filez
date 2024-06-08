<template>
    <div class="filemanager-box">
        <Header :role="role" :filestructure="filestructure" />

        <div id="fileManager">
            <div id="system">
                <ul id="file-list" v-if="path === 'global' && dynamicfilelist.length > 0">
                    <li v-for="(item, index) in dynamicfilelist" :key="item.path" :data-type="item.type"
                        :data-path="item.path">
                        <input type="checkbox" name="select-file" v-if="role === 'admin'" />
                        <span class="file-name" @click="() => handleItemClick(item)">
                            <img :src="item.type === 'folder' ? FolderIcon : FileIcon" alt="" srcset="" />
                            <p>{{ item.name }}</p>
                        </span>
                        <div class="fileaction">
                            <img v-if="item.type === 'file'" title="download" :src="DownloadIcon" alt="" srcset=""
                                @click="(e) => { e.stopPropagation(); downloadFile(item) }" />
                            <img v-if="role === 'admin'" title="rename" class="rename-btn" :src="RenameIcon" alt=""
                                srcset="" @click="renameFile(index, item)" />
                            <img v-if="role === 'admin'" title="delete" class="delete-btn" :src="DeleteIcon" alt=""
                                srcset="" @click="deleteFile(index, item)" />
                        </div>
                    </li>
                </ul>
                <ul v-else-if="path === 'private'" class="undersconstruction">
                    <img src="../assets/underconstruction.svg" alt="" srcset="">
                    <h3>Under Development</h3>
                    <p>We're working hard to bring you this feature.</p>
                    <p>Stay tuned, it will be available soon!</p>
                </ul>
                <ul v-else-if="dynamicfilelist.length === 0 && (path === 'global' || path === 'private')"
                    class="undersconstruction">
                    <ul v-if="!loading">
                        <img src="../assets/empty.svg" alt="" srcset="">
                        <h3>Empty Folder</h3>
                        <p>This folder is currently empty.</p>
                        <p>Check back later or add some files.</p>
                    </ul>
                    <ul v-else>
                        <div class="loader"></div>
                    </ul>
                </ul>
                <ul v-else class="undersconstruction">
                    <img src="../assets/filenotfound.svg" alt="" srcset="">
                    <h3>Oops! File Not Found</h3>
                    <p>It seems like the file you're looking for doesn't exist.</p>
                </ul>
            </div>
        </div>
    </div>
</template>

<script setup>
import Header from '../components/Header.vue'
import FolderIcon from '../assets/apps/default/fileManager/assets/system-folder.png';
import FileIcon from '../assets/apps/default/fileManager/assets/system-file.png';
import DeleteIcon from '../assets/apps/default/fileManager/assets/delete.png';
import RenameIcon from '../assets/apps/default/fileManager/assets/rename.png';
import DownloadIcon from '../assets/apps/default/fileManager/assets/download.png';
import { getdatabasedata, insertdatabasedata, storage, deleteFileByUrl } from '../scripts/firebasecofig.js';

import { useRoute, useRouter } from 'vue-router';
import { ref, watch, onMounted } from 'vue';

const props = defineProps({
    filestructure: {
        type: Array,
        required: true
    },
    role: {
        type: String,
        required: true
    }
});

const dynamicfilelist = ref([]);
const route = useRoute();
const router = useRouter();
const path = ref(route.params.data);
const firstfolder = ref(route.params.firstfolder);
const fullpath = ref(router.currentRoute.value.fullPath);
const loading = ref(true);


function findFilesByPath(pathParts, files) {
    if (pathParts.length === 0) {
        return files;
    }

    const currentPart = pathParts.shift();
    const folder = files.find(item => item.name === currentPart && item.type === 'folder');

    if (folder && folder.files) {
        return findFilesByPath(pathParts, folder.files);
    }

    return null;
}

function dynamicfilefunction() {
    const pathParts = fullpath.value.split('/').splice(2).map(part => part.split('%20').join(' '));
    loading.value = true;
    console.log(props.filestructure);
    setTimeout(() => {  // Simulating asynchronous fetching
        const files = findFilesByPath([...pathParts], props.filestructure);
        dynamicfilelist.value = files || [];
        loading.value = false;
    }, 2000);  // Timeout for simulation, remove this in actual implementation
}

onMounted(() => {
    dynamicfilefunction();
});

watch(route, (to, from) => {
    path.value = to.params.data;
    firstfolder.value = to.params.firstfolder;
    fullpath.value = router.currentRoute.value.fullPath;
    dynamicfilefunction();
});

watch(() => props.filestructure, (newValue, oldValue) => {
    dynamicfilefunction();
});

const handleItemClick = (item) => {
    if (item.type === 'folder') {
        router.push(fullpath.value + '/' + item.name);
    } else {
        window.open(item.path, '_blank');
    }
};

const downloadFile = async (item) => {
    if (item.type === 'file') {
        try {
            const response = await fetch(item.path, {
                mode: 'no-cors'
            });
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = item.name; // Set the download attribute with the file name
            document.body.appendChild(a); // Append the anchor to the body
            a.click(); // Programmatically click the anchor
            document.body.removeChild(a); // Remove the anchor from the body
            window.URL.revokeObjectURL(url); // Clean up the URL object
        } catch (error) {
            console.error('Error downloading the file:', error);
        }
    }
};

const renameFile = async (index, item) => {

    const newName = prompt('Enter the new name:', item.name);
    if (newName !== null) {
        dynamicfilelist.value[index].name = newName;

        const updatedFileStructure = JSON.parse(JSON.stringify(props.filestructure));

        let currentLevel = updatedFileStructure;
        const pathParts = fullpath.value.split('/').splice(2).map(part => part.split('%20').join(' '));
        pathParts.forEach((folderName, folderIndex) => {
            const foundFolder = currentLevel.find(folder => folder.name === folderName && folder.type === 'folder');
            if (foundFolder) {
                currentLevel = foundFolder.files;
            } else {
                notification.danger('File/Folder not Found', 'Filez', '/favicon.ico')
                return;
            }
        });
        currentLevel.splice(0, currentLevel.length, ...dynamicfilelist.value);
        await insertdatabasedata('/filez/global', updatedFileStructure);
        console.log(updatedFileStructure);
        notification.success('File renamed successfully', 'Filez', '/favicon.ico')
    }
};


const deleteFile = async (index, item) => {
    if (item.type === 'folder') {
        if (item?.files?.length > 0) {
            alert('Sorry we cannot delete this folder because there are files available in this folder')
            console.log(item);
            return
        }
    }


    let confirmDelete = false

    const sessionmultidelete = sessionStorage.getItem('multidelete')
    if (sessionmultidelete !== 'true') {
        confirmDelete = confirm(`Do you want to delete this file: "${dynamicfilelist.value[index].name}"?`);
    } else {
        confirmDelete = true
    }

    if (confirmDelete || sessionmultidelete == 'true') {
        if (item.type !== 'folder') {
            await deleteFileByUrl(item.path)
        }
        // Remove the file from dynamicfilelist
        dynamicfilelist.value.splice(index, 1);

        // Create a deep copy of the filestructure to update it
        const updatedFileStructure = JSON.parse(JSON.stringify(props.filestructure));

        const pathParts = fullpath.value.split('/').splice(2).map(part => decodeURIComponent(part.replace(/%20/g, ' ')));

        let currentLevel = updatedFileStructure;
        for (const folderName of pathParts) {
            const foundFolder = currentLevel.find(folder => folder.name === folderName && folder.type === 'folder');
            if (foundFolder) {
                currentLevel = foundFolder.files;
            } else {
                notification.danger('File/Folder not Found', 'Filez', '/favicon.ico')
                return;
            }
        }

        currentLevel.splice(0, currentLevel.length, ...dynamicfilelist.value);
        console.log(updatedFileStructure);
        await insertdatabasedata('/filez/global', updatedFileStructure);
        notification.success('File Deleted successfully', 'Filez', '/favicon.ico')
    }
};

</script>

<style scoped lang="scss">
.filemanager-box {
    width: 100%;
}

.undersconstruction {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    height: 100%;
    text-align: center;

    img {
        width: 400px;
        max-width: 90%;
    }

    h3 {
        margin-bottom: 10px;
    }
}

.loader {
    background: transparent;
    border: 5px solid #69628a;
    border-bottom: 5px solid transparent;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    animation: 2s loader infinite;
}

@keyframes loader {
    to {
        transform: rotate(360deg);
        /* Rotate the loader 360 degrees */
    }
}
</style>
