<template>
    <div class="min-h-screen flex items-center justify-center bg-[var(--bg-app)] p-4">
        <div class="card bg-[var(--bg-card)] rounded-[32px] p-10 w-full max-w-sm shadow-[0_8px_40px_rgba(0,0,0,0.04)] border border-[var(--color-border)] text-center">
            <div class="w-20 h-20 bg-[var(--bg-card)] border border-[var(--color-border)] rounded-2xl mx-auto mb-8 flex items-center justify-center text-[var(--color-text)] shadow-sm">
                <AppIcon name="balance" :size="40" />
            </div>
            
            <h1 class="text-2xl font-bold text-[var(--color-text)] mb-2 tracking-tight">
                {{ $t('app.title') }}
            </h1>
            <p class="text-[var(--color-secondary)] text-[15px] mb-10 leading-relaxed px-4">
                {{ $t('auth.description') }}
            </p>
            
            <button class="w-full py-3.5 bg-[#0077FF] text-white rounded-xl font-bold text-[15px] flex items-center justify-center gap-3 hover:bg-[#0066DD] transition-all active:scale-[0.98] shadow-sm mb-3" @click="loginWithVK">
                <AppIcon name="vk" :size="20" />
                {{ $t('auth.login_with_vkid') }}
            </button>
            <p class="mt-10 text-[11px] text-[var(--color-secondary)] leading-relaxed uppercase tracking-wider font-semibold opacity-50">
                Productivity & Balance
            </p>
        </div>
    </div>
</template>

<script setup>
import { useBalanceStore } from '../stores/balance';
import AppIcon from './AppIcon.vue';

const store = useBalanceStore();

const loginWithVK = () => {
    window.location.href = store.vkAuthUrl;
};

</script>
