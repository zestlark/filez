<template>
    <div class="filemanager-box">
        <Header :role="role" :filestructure="filestructure" />

        <div id="fileManager">
            <div id="system">
                <ul id="file-list" v-if="dynamicfilelist.length > 0">
                    <li v-for="(item, index) in dynamicfilelist" :key="item.path + item.name" :data-type="item.type"
                        :data-path="item.path">
                        <input type="checkbox" name="select-file" v-if="role === 'admin'" />
                        <span class="file-name" @click="() => handleItemClick(item)">
                            <img :src="getIcon(item)" alt="" srcset="" />
                            <div class="name-container">
                                <p>{{ item.name }}</p>
                                <small v-if="route.name === 'fileFilter' && (item as any).locationName" class="location-tag">
                                    {{ (item as any).locationName }}
                                </small>
                            </div>
                        </span>
                        <div class="fileaction">
                            <img v-if="item.type === 'file'" title="download" :src="DownloadIcon" alt="" srcset=""
                                @click="(e) => { e.stopPropagation(); downloadFile(item) }" />
                            <img v-if="canModify(item)" title="rename" class="rename-btn" :src="RenameIcon" alt=""
                                srcset="" @click="renameFile(index, item)" />
                            <img v-if="canModify(item)" title="delete" class="delete-btn" :src="DeleteIcon" alt=""
                                srcset="" @click="deleteFile(index, item)" />
                        </div>
                    </li>
                </ul>
                <ul v-else-if="loading || isLoading" class="undersconstruction">
                    <div class="loader"></div>
                </ul>
                <ul v-else-if="dynamicfilelist.length === 0" class="undersconstruction">
                    <img src="../assets/empty.svg" alt="" srcset="">
                    <h3>Empty Folder</h3>
                    <p>This folder is currently empty.</p>
                    <p>Check back later or add some files.</p>
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

<script setup lang="ts">
import Header from '../components/Header.vue'
import FolderIcon from '../assets/apps/default/fileManager/assets/system-folder.png';
import FileIcon from '../assets/apps/default/fileManager/assets/system-file.png';
import ImageIcon from '../assets/apps/default/fileManager/assets/image.png';
import VideoIcon from '../assets/apps/default/fileManager/assets/video.png';
import DeleteIcon from '../assets/apps/default/fileManager/assets/delete.png';
import RenameIcon from '../assets/apps/default/fileManager/assets/rename.png';
import DownloadIcon from '../assets/apps/default/fileManager/assets/download.png';
import { getdatabasedata, insertdatabasedata, deleteFileByUrl } from '../scripts/storage';
import { useRoute, useRouter } from 'vue-router';
import { ref, watch, onMounted, computed } from 'vue';
import type { FileNode } from '../types';
import { getUserHashSync } from '../scripts/auth';

const getIcon = (item: FileNode) => {
    if (item.type === 'folder') return FolderIcon;
    const name = item.name.toLowerCase();
    if (name.match(/\.(jpg|jpeg|png|gif|svg|webp)$/)) return ImageIcon;
    if (name.match(/\.(mp4|webm|ogg|mov)$/)) return VideoIcon;
    return FileIcon;
};

const props = defineProps<{
    filestructure: FileNode[];
    role: string;
    isLoading: boolean;
}>();

const dynamicfilelist = ref<FileNode[]>([]);
const route = useRoute();
const router = useRouter();
const userHash = getUserHashSync();
const isAdmin = computed(() => props.role === 'admin');

const canModify = (item: FileNode) => {

    if (isAdmin.value) return true;
    return item.ownerHash === userHash;
};
const emit = defineEmits(['dataChanged']);
const path = ref(route.params.data);
const firstfolder = ref(route.params.firstfolder);
const fullpath = ref(router.currentRoute.value.fullPath);
const loading = ref(true);

const hasUserOwnedDescendant = (node: FileNode): boolean => {
    if (node.ownerHash === userHash) return true;
    if (node.files && node.files.length > 0) {
        return node.files.some(f => hasUserOwnedDescendant(f));
    }
    return false;
};

interface IndexedFile extends FileNode {
    locationName?: string;
}

const flattenFiles = (nodes: FileNode[], parentPathName = ''): IndexedFile[] => {
    let flat: IndexedFile[] = [];
    for (const node of nodes) {
        if (node.type === 'file') {
            flat.push({ ...node, locationName: parentPathName || 'Root' });
        }
        if (node.files && node.files.length > 0) {
            flat = flat.concat(flattenFiles(node.files, (parentPathName ? parentPathName + ' > ' : '') + node.name));
        }
    }
    return flat;
};


function findFilesByPath(pathParts: string[], files: FileNode[]): FileNode[] | null {
    if (pathParts.length === 0) {
        return files;
    }

    const currentPart = pathParts.shift();
    if (!files) return null;
    const folder = files.find(item => item.name === currentPart && item.type === 'folder');

    if (folder && folder.files) {
        return findFilesByPath(pathParts, folder.files);
    }

    return null;
}

function dynamicfilefunction() {
    loading.value = true;
    
    if (route.name === 'fileFilter') {
        const type = route.params.type as string;
        const allFiles = flattenFiles(props.filestructure);
        
        if (type === 'images') {
            dynamicfilelist.value = allFiles.filter(f => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f.name));
        } else if (type === 'videos') {
            dynamicfilelist.value = allFiles.filter(f => /\.(mp4|webm|ogg|mov)$/i.test(f.name));
        } else if (type === 'documents') {
            dynamicfilelist.value = allFiles.filter(f => /\.(pdf|doc|docx|txt|md|js|ts|html|css|json)$/i.test(f.name));
        } else {
            dynamicfilelist.value = [];
        }
    } else {
        const pathParts = fullpath.value.split('/').splice(2).map((part: string) => decodeURIComponent(part.replace(/%20/g, ' ')));
        const files = findFilesByPath([...pathParts], props.filestructure);
        
        if (path.value === 'private') {
            dynamicfilelist.value = (files || []).filter(item => hasUserOwnedDescendant(item));
        } else {
            dynamicfilelist.value = files || [];
        }
    }
    
    loading.value = false;
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

const handleItemClick = (item: FileNode) => {
    if (item.type === 'folder') {
        const currentPath = router.currentRoute.value.fullPath;
        const targetPath = currentPath.endsWith('/') ? currentPath + item.name : currentPath + '/' + item.name;
        router.push(targetPath);
    } else {
        window.open(item.path, '_blank');
    }
};

const downloadFile = async (item: FileNode) => {
    if (item.type === 'file') {
        try {
            const response = await fetch(item.path);
            if (!response.ok) throw new Error("Network response was not ok");
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

        }
    }
};

const renameFile = async (index: number, item: FileNode) => {
    if (!canModify(item)) {
        const notify = (window as any).notification;
        if (notify) {
            notify.warning('You do not have permission to rename this file/folder.', 'Permission Denied', '/favicon.ico');
        }
        return;
    }

    const newName = prompt('Enter new name:', item.name);
    if (newName && newName !== item.name) {
        const updatedFileStructure = JSON.parse(JSON.stringify(props.filestructure));
        
        // Helper to find and rename in clone
        const findAndRename = (nodes: FileNode[]): boolean => {
            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i];
                if (node.name === item.name && node.type === item.type && node.ownerHash === item.ownerHash && node.path === item.path) {
                    node.name = newName;
                    return true;
                }
                if (node.files && findAndRename(node.files)) return true;
            }
            return false;
        };

        if (findAndRename(updatedFileStructure)) {
            await insertdatabasedata('/filez/global', updatedFileStructure);
            emit('dataChanged');
            const notify = (window as any).notification;
            if (notify) {
                notify.success('Item renamed successfully', 'Filez', '/favicon.ico');
            }
        } else {

        }
    }
};


const deleteFile = async (index: number, item: FileNode) => {
    if (!canModify(item)) {
        const notify = (window as any).notification;
        if (notify) {
            notify.warning('You do not have permission to delete this file/folder.', 'Permission Denied', '/favicon.ico');
        }
        return;
    }
    if (item.type === 'folder') {
        if (item.files && item.files.length > 0) {
            alert('Sorry we cannot delete this folder because there are files available in this folder')

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

        const updatedFileStructure = JSON.parse(JSON.stringify(props.filestructure));
        
        // Helper to find and remove in clone
        const findAndRemove = (nodes: FileNode[]): boolean => {
            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i];
                if (node.name === item.name && node.type === item.type && node.ownerHash === item.ownerHash && node.path === item.path) {
                    nodes.splice(i, 1);
                    return true;
                }
                if (node.files && findAndRemove(node.files)) return true;
            }
            return false;
        };

        if (findAndRemove(updatedFileStructure)) {
            await insertdatabasedata('/filez/global', updatedFileStructure);
            emit('dataChanged');
            notification.success('Item Deleted successfully', 'Filez', '/favicon.ico')
        } else {

            notification.danger('Could not find item to delete', 'Error', '/favicon.ico')
        }
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
