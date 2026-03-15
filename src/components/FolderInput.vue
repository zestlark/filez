<template>
    <ModernModal 
        :show="showFolderForm" 
        :hasButtons="true"
        confirmText="Create"
        @close="closefolderform"
        @confirm="checkfolderexist"
    >
        <div class="folder-input-form">
            <h3 style="margin: 0; color: white;">New Folder</h3>
            <p style="margin: 0 0 5px 0; color: rgba(255, 255, 255, 0.6); font-size: 0.85rem;">Enter folder name</p>
            <input v-model="inputfoldername" type="text" placeholder="Folder Name" class="modern-input" @keyup.enter="checkfolderexist">
            <small class="error" v-if="errormsg">{{ errormsg }}</small>
        </div>
    </ModernModal>
</template>

<script setup lang="ts">
import { getdatabasedata, insertdatabasedata } from '../scripts/storage'
import { useRouter, useRoute } from 'vue-router'
import { ref, onMounted } from 'vue';
import type { FileNode } from '../types';
import { getUserHashSync } from '../scripts/auth';
import ModernModal from './ModernModal.vue';

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
const showFolderForm = ref(false);

const closefolderform = () => {
    inputfoldername.value = ''
    errormsg.value = ''
    showFolderForm.value = false;
}

onMounted(() => {
    // We can't use document.getElementById since we are using ref now, 
    // but the parent still tries to show it by setting style.display.
    // Let's shim it or change the parent.
    const form = document.getElementById('addfolderform');
    if (form) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    if (form.style.display === 'flex') {
                        showFolderForm.value = true;
                        form.style.display = 'none'; // reset it
                    }
                }
            });
        });
        observer.observe(form, { attributes: true });
    }
})

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
            const newFolderPath = route.params.data === 'global' ? `global/${inputfoldername.value}` : `private/${inputfoldername.value}`;
            filelist.value.push({ name: inputfoldername.value, path: newFolderPath, type: 'folder', ownerHash: userHash, files: [] })
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
             const newFolderPath = targetFolder.path.endsWith('/') ? `${targetFolder.path}${inputfoldername.value}` : `${targetFolder.path}/${inputfoldername.value}`;
             targetFolder.files.push({ name: inputfoldername.value, path: newFolderPath, type: 'folder', ownerHash: userHash, files: [] })
             await insertdatabasedata('/filez/global', filelist.value)
             emit('folderCreated');
             closefolderform()
        }
    }
}

</script>


<style lang="scss">
.folder-input-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.error {
    font-size: 11px;
    color: #ff5555;
    margin-top: -5px;
}

.modern-input {
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    color: white;
    font-size: 1rem;
    outline: none;
    transition: all 0.3s;
    width: 100%;

    &:focus {
        border-color: #69628a;
        background: rgba(255, 255, 255, 0.1);
    }
}
</style>