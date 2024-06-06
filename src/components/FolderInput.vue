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

<script setup>
import { ref, onMounted, defineEmits } from 'vue';
import { getdatabasedata, insertdatabasedata } from '../scripts/firebasecofig.js'
import { useRouter, useRoute } from 'vue-router'

const emit = defineEmits(['folderCreated'])

const router = useRouter()
const route = useRoute()
const firstfolder = ref(route.params.firstfolder)

const filelist = ref([])

const inputfoldername = ref('')

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
    document.getElementById('addfolderform').style.display = 'none'
}

const checkfolderexist = async () => {
    if (inputfoldername.value == '') {
        errormsg.value = '* Please Enter Folder Name'
        return
    }
    for (const myitem of filelist.value) {
        if (myitem.name == firstfolder.value) {
            let folderexist = false;
            if (myitem.files) {
                for (const myfiles of myitem.files) {
                    if (myfiles.name == inputfoldername.value) {
                        errormsg.value = '* Folder Already Exist'
                        folderexist = true
                        break;
                    }
                }
            } else {
                myitem.files = []
            }
            console.log('file list', filelist.value);

            if (!folderexist) {
                errormsg.value = ''
                myitem.files.push({ name: inputfoldername.value, path: firstfolder, type: 'folder' })
                await insertdatabasedata('/filez/global', filelist.value)
                emit('folderCreated');
                closefolderform()
                break;
            }
        } else {
            if (firstfolder.value == undefined)
                if (sessionStorage.getItem('admin') == 'true') {
                    console.log(filelist.value);
                    filelist.value.push({ name: inputfoldername.value, path: 'global', type: 'folder' })
                    await insertdatabasedata('/filez/global', filelist.value)
                    emit('folderCreated');
                    closefolderform()
                    break;
                }
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