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


            <i v-if="role !== 'admin'" @click="adminlogin" style="font-size: 18px;margin-right: 5px;"
                class="ri-admin-line login-btn"></i>
            <i v-if="role == 'admin'" @click="adminlogout" style="font-size: 19px;margin-right: 5px;color: red;"
                class="ri-logout-circle-r-line logout-btn"></i>
        </div>

        <div id="drives" class="sub-sidebar">
            <ul>
                <li class="drivername" style="padding: 0;opacity: 60%;color: white;"><small>Drivers</small></li>

                <li clickable root-path="/global" :class="{ active: path === 'global' }"
                    @click="() => { router.push('/global') }">
                    <img src="../../assets/apps/default/fileManager/assets/cloud.png" alt="" />
                    <p>Global</p>
                </li>
                <li clickable root-path="/private" :class="{ active: path === 'private' }"
                    @click="() => { router.push('/private') }">
                    <img src="../../assets/apps/default/fileManager/assets/private-cloud.png" alt="" srcset="" />
                    <p>Private</p>
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

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref, watch, onMounted } from 'vue';

const props = defineProps(['role'])
const emit = defineEmits(['updaterole'])

const route = useRoute();
const router = useRouter();
const path = ref(route.params.data);

onMounted(() => {
    document.getElementById('close-sidebar').addEventListener('click', () => {
        document.getElementById('sidebar').style.left = '-100vw'
    })
})

const adminlogin = () => {
    let password = prompt("enter your passkey")
    if (password == 'zestlark') {
        emit('updaterole', 'admin');
        sessionStorage.setItem('admin', 'true')
        notification.success('Login successful', 'Filesz', '/favicon.ico')
    } else {
        notification.danger('Login Failed', 'Filesz', '/favicon.ico')
    }
}

const adminlogout = () => {
    sessionStorage.removeItem('admin')
    emit('updaterole', 'user');
    notification.success('Logout successful', 'Filesz', '/favicon.ico')
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
</style>