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
                opacity: canCreateInFolder ? '100%' : '50%',
                pointerEvents: canCreateInFolder ? 'auto' : 'none'
            }">
                <img src="../assets/apps/default/fileManager/assets/folder.png" alt="" srcset="" />
            </div>

            <div @click="openeditor" id="createFile" class="action" :style="{
                opacity: canCreateInFolder ? '100%' : '50%',
                pointerEvents: canCreateInFolder ? 'auto' : 'none'
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
                opacity: canCreateInFolder ? '100%' : '50%',
                pointerEvents: canCreateInFolder ? 'auto' : 'none'
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
                <template v-for="(crumb, index) in breadcrumbs" :key="index">
                    <img v-if="index > 0" src="../assets/apps/default/fileManager/assets/forward.png" alt="" />
                    <span :style="{ textTransform: index === 0 ? 'capitalize' : 'none' }" 
                          @click="() => router.push(crumb.url)">
                        {{ crumb.name }}
                    </span>
                </template>
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

<script setup lang="ts">
import { fetchFileContent, insertdatabasedata, getdatabasedata, supabase } from '../scripts/storage';
import { useRoute, useRouter } from 'vue-router';
import { ref, watch, onMounted, computed } from 'vue';
import type { FileNode } from '../types';
import { getUserHashSync } from '../scripts/auth';

const props = defineProps({
    filestructure: {
        type: Array as () => FileNode[],
        required: true
    }, role: {
        type: String,
        required: true
    }
});

const router = useRouter()
const route = useRoute()

const breadcrumbs = computed(() => {
    const parts = route.fullPath.split('/').filter(p => p !== '');
    const crumbs = [];
    let currentUrl = '';
    for (let i = 0; i < parts.length; i++) {
        currentUrl += '/' + parts[i];
        let name = decodeURIComponent(parts[i].replace(/%20/g, ' '));
        if (name.toLowerCase() === 'private') name = 'My Files';
        crumbs.push({
            name: name,
            url: currentUrl
        });
    }
    return crumbs;
});

const canCreateInFolder = computed(() => {
    const parts = route.fullPath.split('/').filter(p => p !== '');
    // Allow creation if we are at root level (only if admin OR in global) or in any nested folder
    if (parts.length === 1) {
        return props.role === 'admin' || parts[0] === 'global';
    }
    // Limit to 3 levels of folders. 
    // parts[0] is 'global' or 'private', so parts.length < 4 means we can create subfolders inside levels 1 and 2.
    // Level 1: global/F1 (length 2) -> can create F2
    // Level 2: global/F1/F2 (length 3) -> can create F3
    // Level 3: global/F1/F2/F3 (length 4) -> CANNOT create F4
    return parts.length > 1 && parts.length < 4;
});

const uploadProgress = ref(0)
const userHash = getUserHashSync()
const fullpath = computed(() => route.fullPath)

const selectfile = () => {
    const uploadInput = document.getElementById('uploadinput');
    if (uploadInput) uploadInput.click();
}

//nee file
const openeditor = () => {
    router.push('/editor?path=' + btoa(fullpath.value))
}

const handleFileSelection = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (!target.files) return;

    for (let i = 0; i < target.files.length; i++) {
        const imageFile = target.files[i];

        if (fileExistsInFolder(imageFile.name)) {
            notification.warning('"' + imageFile.name + '" already exist', 'Uploading failed !', '/favicon.ico');
            target.value = '';
            continue;
        }
        uploadImageAsPromise(imageFile);
    }
}

const fileExistsInFolder = (fileName: string) => {
    let fileStructure = props.filestructure;
    let pathParts = fullpath.value.split('/').splice(2).filter(x => x !== "").map((part: string) => decodeURIComponent(part.replace(/%20/g, ' ')));

    let currentLevel = fileStructure;
    let targetFolder: FileNode | null = null;

    if (pathParts.length === 0) {
        return currentLevel.some((file: FileNode) => file.name === fileName);
    }

    for (const folderName of pathParts) {
        targetFolder = currentLevel.find((folder: FileNode) => folder.name === folderName && folder.type === 'folder') || null;
        if (targetFolder) {
            if (!targetFolder.files) {
                 targetFolder.files = [];
            }
            currentLevel = targetFolder.files;
        } else {
            return false; // Path doesn't exist
        }
    }

    if (targetFolder && targetFolder.files) {
        return targetFolder.files.some((file: FileNode) => file.name === fileName);
    }

    return false;
}

const uploadImageAsPromise = async (imageFile: File) => {
    try {
        uploadProgress.value = 5;
        const bucketName = 'filez';
        const filePath = (fullpath.value.startsWith('/') ? fullpath.value.substring(1) : fullpath.value) + '/' + imageFile.name;
        
        // Ensure path is cleaned of double slashes
        const cleanPath = filePath.replace(/\/+/g, '/');

        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(cleanPath, imageFile, {
                cacheControl: '3600',
                upsert: true
            });

        if (error) {

            const notify = (window as any).notification;
            if (notify) {
                notify.danger('Upload Failed', 'Filez', '/favicon.ico');
            }
            return;
        }

        const { data: { publicUrl } } = supabase.storage
            .from(bucketName)
            .getPublicUrl(cleanPath);

        const newfile: FileNode = { 
            name: imageFile.name, 
            path: publicUrl, 
            type: 'file', 
            ownerHash: userHash 
        };

        
        await addfiletodatabase(newfile);
        uploadProgress.value = 0;
        const notify = (window as any).notification;
        if (notify) {
            notify.success('File uploaded successfully', 'Filez', '/favicon.ico');
        }

    } catch (error) {

    }
}

const addfiletodatabase = async (data: FileNode) => {
    try {
        let file = props.filestructure;
        let pathParts = fullpath.value.split('/').splice(2).map((part: string) => decodeURIComponent(part.replace(/%20/g, ' ')));

        let currentLevel = file;
        let targetFolder: FileNode | null = null;

        if (pathParts.length === 0) {
            currentLevel.push(data);
        } else {
            for (const folderName of pathParts) {
                targetFolder = currentLevel.find((folder: FileNode) => folder.name === folderName && folder.type === 'folder') || null;
                if (targetFolder) {
                    if (!targetFolder.files) {
                        targetFolder.files = [];
                    }
                    currentLevel = targetFolder.files;
                } else {

                    return;
                }
            }
            if (targetFolder && targetFolder.files) {
                targetFolder.files.push(data);
            }
        }

        await insertdatabasedata('/filez/global', file);
    } catch (error) {

    }
}



const openfolderform = () => {
    window.dispatchEvent(new CustomEvent('open-folder-modal'));
}

// actions
const multiRename = () => {
    const multilist: HTMLLIElement[] = []
    const fileList = document.querySelector('#file-list')
    if (!fileList) return;
    
    const list = fileList.querySelectorAll('li')
    list.forEach(li => {
        let inputCheck = li.querySelector('input') as HTMLInputElement | null;
        if (inputCheck && inputCheck.checked) {
            multilist.push(li)
        }
    })
    multilist.forEach(li => {
        const actionDiv = li.querySelector('.fileaction');
        if (actionDiv) {
            const renameBtn = actionDiv.querySelector('.rename-btn') as HTMLElement | null;
            if (renameBtn) renameBtn.click();
        }
    })

}

const multiDelete = () => {
    const multilist: HTMLLIElement[] = []
    const fileList = document.querySelector('#file-list')
    if (!fileList) return;

    const list = fileList.querySelectorAll('li')
    list.forEach(li => {
        let inputCheck = li.querySelector('input') as HTMLInputElement | null;
        if (inputCheck && inputCheck.checked) {
            multilist.push(li)
        }
    })

    if (confirm("Are you sure you want to delete this files")) {
        sessionStorage.setItem('multidelete', 'true')
        multilist.forEach(li => {
            const inputCheck = li.querySelector('input') as HTMLInputElement | null;
            if (inputCheck) inputCheck.checked = false;
            
            const actionDiv = li.querySelector('.fileaction');
            if (actionDiv) {
                const deleteBtn = actionDiv.querySelector('.delete-btn') as HTMLElement | null;
                if (deleteBtn) deleteBtn.click();
            }
        })

        sessionStorage.removeItem('multidelete')
    }
}


onMounted(() => {
    const hamburger = document.getElementById('hamburger');
    const sidebar = document.getElementById('sidebar');
    
    if (hamburger && sidebar) {
        hamburger.addEventListener('click', () => {
            sidebar.style.left = '0';
        })
    }
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
