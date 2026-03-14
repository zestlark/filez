<template>
    <div class="box" id="addfolderform">
        <div class="foldernameinput">
            <input v-model="inputfoldername" type="text">
            <small class="error">{{ errormsg }}</small>
            <div class="btns">
                <button @click="closefolderform">Cancel</button>
                <button @click="checkfolderexist">Create</button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { getdatabasedata, insertdatabasedata } from '../scripts/storage'
import { useRouter, useRoute } from 'vue-router'
import { ref, onMounted } from 'vue';
import type { FileNode } from '../types';
import { getUserHashSync } from '../scripts/auth';

const emit = defineEmits(['folderCreated'])

const router = useRouter()
const route = useRoute()
const filelist = ref<FileNode[]>([])

const inputfoldername = ref('')
const userHash = getUserHashSync()

onMounted(async () => {
    // Fetch data only when needed
    await fetchData();
})

const fetchData = async () => {
    filelist.value = await getdatabasedata('filez/global');
}

const errormsg = ref('')

const closefolderform = () => {
    inputfoldername.value = ''
    const form = document.getElementById('addfolderform')
    if (form) form.style.display = 'none'
}

const checkfolderexist = async () => {
    if (inputfoldername.value == '') {
        errormsg.value = '* Please Enter Folder Name'
        return
    }

    let pathParts = router.currentRoute.value.fullPath.split('/').splice(2).filter(x => x !== "").map((part: string) => decodeURIComponent(part.replace(/%20/g, ' ')));
    
    // Enforcement of 3-level nesting limit
    if (pathParts.length >= 3) {
        errormsg.value = '* Maximum folder depth reached (max 3 levels)'
        return;
    }

    // We are at the root level (/global or /private)
    if (pathParts.length === 0) {
        // Allow folder creation at root for admins OR in the global drive
        if (sessionStorage.getItem('admin') == 'true' || route.params.data === 'global') {
            const folderExists = filelist.value.some(f => f.name === inputfoldername.value && f.type === 'folder');
            if (folderExists) {
                errormsg.value = '* Folder Already Exist'
                return;
            }
            errormsg.value = ''
            filelist.value.push({ name: inputfoldername.value, path: 'global', type: 'folder', ownerHash: userHash, files: [] })
            await insertdatabasedata('/filez/global', filelist.value)
            emit('folderCreated');
            closefolderform()
        }
        return;
    }

    // Traverse the structure to locate the currently open folder
    let currentLevel = filelist.value;
    let targetFolder: FileNode | null = null;

    for (const folderName of pathParts) {
        if (!currentLevel) break;
        targetFolder = currentLevel.find((folder: FileNode) => folder.name === folderName && folder.type === 'folder') || null;
        if (targetFolder) {
            if (!targetFolder.files) {
                 targetFolder.files = [];
            }
            currentLevel = targetFolder.files;
        } else {
            console.error('Target folder not found in structure:', folderName);
            break;
        }
    }

    if (targetFolder) {
        // Check if the folder already exists in the target folder's files array
        const folderexist = targetFolder.files?.some((file: FileNode) => file.name === inputfoldername.value && file.type === 'folder');
        
        if (folderexist) {
             errormsg.value = '* Folder Already Exist'
        } else if (targetFolder.files) {
             errormsg.value = ''
             targetFolder.files.push({ name: inputfoldername.value, path: 'global', type: 'folder', ownerHash: userHash, files: [] })
             await insertdatabasedata('/filez/global', filelist.value)
             emit('folderCreated');
             closefolderform()
        }
    }
}

</script>


<style lang="scss">
.box {
    background: rgba(0, 0, 0, 0.81);
    backdrop-filter: blur(100px);
    z-index: 9;
    position: fixed;
    width: 100vw;
    height: 100vh;
    top: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    display: none;

    .foldernameinput {
        background: rgb(33, 33, 33);
        width: 300px;
        padding: 10px;

        .error {
            font-size: 12px;
            color: rgb(226, 0, 0);
        }

        input {
            padding: 10px;
            width: 100%;
            border: 0;
            background: rgba(78, 78, 78, 0.87);
            color: white;
            margin-bottom: 5px;
        }

        .btns {
            display: flex;
            justify-self: center;
            align-items: center;
            margin-top: 10px;
            gap: 5px;

            button:first-child {
                background: transparent;
                border: 1px solid rgba(255, 255, 255, 0.429);
                color: rgba(255, 255, 255, 0.668);
            }

            button {
                background: #69628a;
                width: 100%;
                padding: 10px;
                border: 1px solid #69628a;
                color: rgba(255, 255, 255, 0.668);
            }
        }
    }
}
</style>