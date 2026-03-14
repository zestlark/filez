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
        <Transition name="fade">
            <div v-if="showAdminModal" class="admin-modal-overlay" @click.self="showAdminModal = false">
                <div class="admin-modal">
                    <h3>Admin Auth</h3>
                    <p>Enter passkey to access admin features</p>
                    <input 
                        v-model="adminPasskey" 
                        type="password" 
                        placeholder="Passkey" 
                        @keyup.enter="handleAdminLogin"
                        autofocus
                    >
                    <div class="modal-btns">
                        <button class="cancel" @click="showAdminModal = false">Cancel</button>
                        <button class="confirm" @click="handleAdminLogin">Login</button>
                    </div>
                </div>
            </div>
        </Transition>

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
                    <p>My Files</p>
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

const props = defineProps(['role'])
const emit = defineEmits(['updaterole'])

const route = useRoute();
const router = useRouter();
const path = computed(() => route.params.data);

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

/* Admin Modal Styles */
.admin-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(8px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
}

.admin-modal {
    background: #1a1a1a;
    padding: 30px;
    border-radius: 16px;
    width: 90%;
    max-width: 400px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
    text-align: center;
}

.admin-modal h3 {
    margin: 0 0 10px 0;
    color: white;
    font-size: 1.5rem;
}

.admin-modal p {
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 25px;
    font-size: 0.9rem;
}

.admin-modal input {
    width: 100%;
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: white;
    font-size: 1rem;
    margin-bottom: 25px;
    outline: none;
    transition: all 0.3s;
}

.admin-modal input:focus {
    border-color: #3b82f6;
    background: rgba(255, 255, 255, 0.1);
}

.modal-btns {
    display: flex;
    gap: 12px;
}

.modal-btns button {
    flex: 1;
    padding: 12px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.3s;
}

.modal-btns .cancel {
    background: rgba(255, 255, 255, 0.05);
    color: white;
}

.modal-btns .confirm {
    background: #3b82f6;
    color: white;
}

.modal-btns button:hover {
    transform: translateY(-2px);
    filter: brightness(1.1);
}

.fade-enter-active, .fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
    opacity: 0;
}
</style>