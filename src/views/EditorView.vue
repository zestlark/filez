<template>
    <div class="editorBox">
        <div class="header">
            <input v-model="filename" type="text" placeholder="Untitled file *">
            <div class="actions">
                <button class="cancel-btn" @click="cancelfile">Cancel</button>
                <button class="save-btn" @click="savefile" :disabled="!canSave" :style="{ opacity: canSave ? 1 : 0.5, cursor: canSave ? 'pointer' : 'not-allowed' }">Save</button>
            </div>
        </div>
        <div class="editor-container">
            <codemirror v-model="code" placeholder="Start writing..." :style="{ height: '100%', fontSize: '14px' }"
                :autofocus="true" :indent-with-tab="true" :tab-size="2" :extensions="extensions" @ready="handleReady" />
        </div>


        <div class="loader" v-if="loader">
            <img src="https://i0.wp.com/css-tricks.com/wp-content/uploads/2021/08/s_2A9C470D38F43091CCD122E63014ED4503CAA7508FAF0C6806AE473C2B94B83E_1627522653545_loadinfo.gif?resize=200%2C200&ssl=1"
                alt="">
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Codemirror } from 'vue-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { html } from '@codemirror/lang-html'
import { EditorView } from '@codemirror/view'
import { oneDark } from '@codemirror/theme-one-dark'
import { fetchFileContent, insertdatabasedata, getdatabasedata, supabase } from '../scripts/storage'
import type { FileNode } from '../types';
import { getUserHashSync } from '../scripts/auth';
import { computed } from 'vue';

const router = useRouter()
const route = useRoute()
const urlParam = route.query.url || null
const pathParam = route.query.path || null

const loader = ref(false)

const filename = ref('')
const currentFile = ref<FileNode | null>(null)
const userHash = getUserHashSync()
const isAdmin = computed(() => sessionStorage.getItem('admin') === 'true')

const canSave = computed(() => {
    if (isAdmin.value) return true;
    if (!currentFile.value) return true; // New file
    return currentFile.value.ownerHash === userHash;
})

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
        filename.value = promptfilename || '';
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
const cancelfile = () => {
    if (code.value.length > 0) {
        if (confirm("You have unsaved changes. Are you sure you want to discard them and close the editor?")) {
            router.back();
        }
    } else {
        router.back();
    }
}
const uploadImageAsPromise = async (imageFile: File) => {
    try {
        const bucketName = 'filez';
        const pathSuffix = pathParam ? atob(pathParam as string) : '';
        const filePath = (pathSuffix.startsWith('/') ? pathSuffix.substring(1) : pathSuffix) + '/' + imageFile.name;
        const cleanPath = filePath.replace(/\/+/g, '/');

        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(cleanPath, imageFile, {
                cacheControl: '3600',
                upsert: true
            });

        if (error) {
            console.error('Error uploading to Supabase:', error);
            loader.value = false;
            return;
        }

        const { data: { publicUrl } } = supabase.storage
            .from(bucketName)
            .getPublicUrl(cleanPath);

        const newfile: FileNode = { 
            name: imageFile.name, 
            path: publicUrl, 
            type: 'file',
            ownerHash: currentFile.value?.ownerHash || userHash
        }
        await addfiletodatabase(newfile);
    } catch (error) {
        console.error("Error uploading file:", error);
        loader.value = false;
    }
}

const addfiletodatabase = async (data: FileNode) => {
    try {
        let file = await getdatabasedata('/filez/global')
        const pathSuffix = pathParam ? atob(pathParam as string) : '';
        let pathParts = pathSuffix.split('/').splice(2).map(part => decodeURIComponent(part.replace(/%20/g, ' ')));

        let currentLevel = file as FileNode[];
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
                    console.error('Folder not found when adding file to db:', folderName);
                    loader.value = false;
                    return;
                }
            }
            if (targetFolder && targetFolder.files) {
                targetFolder.files.push(data);
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handleReady = (payload: { view: any }) => { // Codemirror internal typing constraint
    view.value = payload.view
}

const extensions = [
    html(),
    javascript(),
    EditorView.lineWrapping,
    oneDark
]

onMounted(async () => {
    if (urlParam) {
        loader.value = true
        const filestructure = await getdatabasedata('/filez/global')
        // Find the file in the structure to check ownership
        const findFile = (nodes: FileNode[], path: string): FileNode | null => {
            for (const node of nodes) {
                if (node.path === path) return node;
                if (node.files) {
                    const found = findFile(node.files, path);
                    if (found) return found;
                }
            }
            return null;
        }
        currentFile.value = findFile(filestructure as FileNode[], urlParam as string);
        filename.value = currentFile.value?.name || '';
        code.value = await fetchFileContent(urlParam as string) || ''
        loader.value = false
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
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.editor-container {
    flex: 1;
    overflow: hidden;
}

.header {
    padding: 5px 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #1c2435;
    flex-shrink: 0;
}

.actions {
    display: flex;
    gap: 10px;
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

.header button.save-btn {
    padding: 5px 20px;
    background: lightgreen;
    cursor: pointer;
    border-radius: 2px;
    border: none;
    font-weight: bold;
}

.header button.cancel-btn {
    padding: 5px 20px;
    background: transparent;
    color: #ff6b6b;
    border: 1px solid #ff6b6b;
    cursor: pointer;
    border-radius: 2px;
    font-weight: bold;
    transition: all 0.2s;
}

.header button.cancel-btn:hover {
    background: #ff6b6b;
    color: white;
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