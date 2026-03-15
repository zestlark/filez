<template>
    <!-- sidebar starts -->

    <div id="sidebar">
        <!-- header controls -->
        <div id="controls">
            <div id="left" @click="router.back()">
                <img src="../../assets/apps/default/fileManager/assets/left.png" alt="" srcset="" />
            </div>
            <div id="right" @click="router.forward()">
                <img src="../../assets/apps/default/fileManager/assets/right.png" alt="" srcset="" />
            </div>
            <div id="reload" @click="reloadPage">
                <img src="../../assets/apps/default/fileManager/assets/reload.png" alt="" srcset="" />
            </div>


            <i v-if="role !== 'admin'" @click.stop="showAdminModal = true" style="font-size: 18px;margin-right: 5px;"
                class="ri-admin-line login-btn"></i>
            <i v-if="role == 'admin'" @click.stop="adminlogout" style="font-size: 19px;margin-right: 5px;color: red;"
                class="ri-logout-circle-r-line logout-btn"></i>
        </div>

        <!-- Custom Admin Login Modal -->
        <ModernModal 
            :show="showAdminModal" 
            :hasButtons="true"
            confirmText="Login"
            @close="showAdminModal = false"
            @confirm="handleAdminLogin"
        >
            <div class="admin-auth-form">
                <h3 style="margin: 0; color: white;">Admin Auth</h3>
                <p style="margin: 0 0 10px 0; color: rgba(255, 255, 255, 0.6); font-size: 0.9rem;">
                    Enter passkey to access admin features
                </p>
                <input 
                    v-model="adminPasskey" 
                    type="password" 
                    placeholder="Passkey" 
                    @keyup.enter="handleAdminLogin"
                    class="modern-input"
                    autofocus
                >
            </div>
        </ModernModal>

        <div id="drives" class="sub-sidebar">
            <ul>
                <li class="drivername" style="padding: 0;opacity: 60%;color: white;"><small>Drivers</small></li>

                <li clickable root-path="/global" :class="{ active: path === 'global' }"
                    @click="() => { router.push('/global') }">
                    <img :src="CloudIcon" alt="" />
                    <p>Global</p>
                </li>
                <li clickable root-path="/private" :class="{ active: path === 'private' }"
                    @click="() => { router.push('/private') }">
                    <img :src="PrivateCloudIcon" alt="" srcset="" />
                    <p>My Files</p>
                </li>
            </ul>
        </div>

        <div id="filters" class="sub-sidebar">
            <ul>
                <li class="drivername" style="padding: 0;opacity: 60%;color: white;"><small>Filters</small></li>
                <li clickable :class="{ active: route.name === 'fileFilter' && route.params.type === 'images' }"
                    @click="() => { router.push('/filter/images') }">
                    <img :src="ImageIcon" alt="" />
                    <p>Images</p>
                </li>
                <li clickable :class="{ active: route.name === 'fileFilter' && route.params.type === 'videos' }"
                    @click="() => { router.push('/filter/videos') }">
                    <img :src="VideoIcon" alt="" />
                    <p>Videos</p>
                </li>
                <li clickable :class="{ active: route.name === 'fileFilter' && route.params.type === 'documents' }"
                    @click="() => { router.push('/filter/documents') }">
                    <img :src="DocumentIcon" alt="" />
                    <p>Documents</p>
                </li>
            </ul>
        </div>

        <div id="banner" class="sub-sidebar">
            <ul class="banner">
                <img src="../../assets/apps/default/fileManager/assets/bannerposter.png" alt="" />
                <span>
                    <h3>Sync your files</h3>
                    <p>Lorem ipsum dolor sit amet.</p>
                </span>
            </ul>
        </div>

        <div class="otherApps">
            <ul>
                <a href="https://zestlark-0.web.app/s" target="_blank">
                    <li>
                        <small>Sleekpad</small>
                        <i class="ri-arrow-right-line"></i>
                    </li>
                </a>
                <a href="https://zestlark-0.web.app/zb" target="_blank">
                    <li>
                        <small>z-blogs</small>
                        <i class="ri-arrow-right-line"></i>
                    </li>
                </a>
                <a href="https://zestlark-0.web.app/" target="_blank">
                    <li>
                        <small>Zestlark</small>
                        <i class="ri-arrow-right-line"></i>
                    </li>
                </a>
            </ul>
        </div>

        <i id="close-sidebar" class="ri-close-line"></i>

    </div>
    <!-- sidebar ends -->
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { ref, watch, onMounted, computed } from 'vue';
import ModernModal from '../ModernModal.vue';

const props = defineProps(['role'])
const emit = defineEmits(['updaterole'])

const route = useRoute();
const router = useRouter();
const path = computed(() => route.params.data);

import CloudIcon from '../../assets/apps/default/fileManager/assets/cloud.png';
import PrivateCloudIcon from '../../assets/apps/default/fileManager/assets/private-cloud.png';
import ImageIcon from '../../assets/apps/default/fileManager/assets/image.png';
import VideoIcon from '../../assets/apps/default/fileManager/assets/video.png';
import DocumentIcon from '../../assets/apps/default/fileManager/assets/system-file.png';

onMounted(() => {
    const closeSidebarBtn = document.getElementById('close-sidebar');
    const sidebar = document.getElementById('sidebar');
    
    if (closeSidebarBtn && sidebar) {
        closeSidebarBtn.addEventListener('click', () => {
            sidebar.style.left = '-100vw'
        })
    }
})

const reloadPage = () => {
    window.location.reload();
};

const showAdminModal = ref(false);
const adminPasskey = ref('');

const handleAdminLogin = () => {
    console.log('Validating admin passkey...');
    if (adminPasskey.value.trim() === 'zestlark') {
        console.log('Authentication SUCCESS');
        emit('updaterole', 'admin');
        sessionStorage.setItem('admin', 'true');
        showAdminModal.value = false;
        adminPasskey.value = '';
        const notify = (window as any).notification;
        if (notify) {
            notify.success('Welcome Admin!', 'Filez', '/favicon.ico');
        }
    } else {
        console.log('Authentication FAILED');
        const notify = (window as any).notification;
        if (notify) {
            notify.danger('Incorrect Passkey', 'Access Denied', '/favicon.ico');
        }
    }
}

const adminlogout = () => {
    console.log('Admin logout requested.');
    sessionStorage.removeItem('admin');
    emit('updaterole', 'user');
    const notify = (window as any).notification;
    if (notify) {
        notify.success('Logout successful', 'Filez', '/favicon.ico');
    }
}

</script>

<style>
#sidebar .sub-sidebar ul li {
    display: none;
}

.otherApps li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    margin-bottom: 5px;
    opacity: 70%;
    background: rgba(255, 255, 255, 0.063);
    cursor: pointer;
}

.otherApps ul a {
    color: white;
}

.otherApps li i {
    transition: 0.5s all;
}

.otherApps li:hover {
    opacity: 1;
}

.otherApps li:hover i {
    margin-right: -10px;
}

@media (width<450px) {
    #sidebar .sub-sidebar ul li {
        display: block;
    }

}

.admin-auth-form {
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 10px;
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