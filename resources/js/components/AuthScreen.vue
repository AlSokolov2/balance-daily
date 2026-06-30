<template>
    <div class="min-h-screen flex items-center justify-center bg-[var(--bg-app)] p-4">
        <div class="card bg-[var(--bg-card)] rounded-[32px] p-10 w-full max-w-sm shadow-[0_8px_40px_rgba(0,0,0,0.04)] border border-[var(--color-border)] text-center">
            <div class="w-20 h-20 bg-[var(--bg-card)] border border-[var(--color-border)] rounded-2xl mx-auto mb-8 flex items-center justify-center text-[var(--color-text)] shadow-sm">
                <svg
                    class="w-10 h-10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
                    <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
                    <path d="M7 21h10" />
                    <path d="M12 3v18" />
                    <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
                </svg>
            </div>
            
            <h1 class="text-2xl font-bold text-[var(--color-text)] mb-2 tracking-tight">
                {{ $t('app.title') }}
            </h1>
            <p class="text-[var(--color-secondary)] text-[15px] mb-10 leading-relaxed px-4">
                {{ $t('auth.description') }}
            </p>
            
            <button class="w-full py-3.5 bg-[#0077FF] text-white rounded-xl font-bold text-[15px] flex items-center justify-center gap-3 hover:bg-[#0066DD] transition-all active:scale-[0.98] shadow-sm mb-3" @click="loginWithVK">
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21.579 6.855c.14-.465 0-.806-.662-.806h-2.193c-.558 0-.813.295-.953.619 0 0-1.115 2.718-2.695 4.482-.51.513-.743.675-1.021.675-.139 0-.341-.162-.341-.627V6.855c0-.558-.161-.806-.626-.806H9.642c-.348 0-.558.258-.558.504 0 .528.79.65.871 2.138v3.228c0 .707-.127.836-.407.836-.743 0-2.551-2.729-3.624-5.853-.209-.607-.42-.853-.98-.853H2.752c-.627 0-.752.295-.752.619 0 .582.743 3.462 3.461 7.271 1.812 2.601 4.363 4.011 6.683 4.011 1.393 0 1.565-.313 1.565-.852v-1.966c0-.626.133-.752.574-.752.324 0 .882.164 2.183 1.417 1.486 1.486 1.732 2.153 2.567 2.153h2.192c.626 0 .939-.313.759-.931-.197-.615-.904-1.508-1.849-2.566-.511-.604-1.277-1.254-1.509-1.579-.325-.419-.232-.604 0-.976.001.001 2.663-3.75 2.94-5.024z" />
                </svg>
                {{ $t('auth.login_with_vkid') }}
            </button>
            <button class="w-full py-3 bg-transparent border border-[var(--color-border)] text-[var(--color-secondary)] rounded-xl text-[13px] flex items-center justify-center gap-2 hover:bg-[var(--bg-secondary)] transition-all active:scale-[0.98]" @click="loginWithGoogle">
                <svg class="w-4 h-4 opacity-60" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.18 1-.78 1.85-1.63 2.53v2.1h2.64c1.55-1.42 2.43-3.52 2.43-6.64z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-2.64-2.1c-.73.49-1.66.78-2.64.78-2.85 0-5.27-1.92-6.13-4.51H5.17v2.13A11.997 11.997 0 0 0 12 23z" />
                    <path fill="#FBBC05" d="M5.87 14.51c-.22-.66-.35-1.36-.35-2.01s.13-1.35.35-2.01V7.87H3.04C2.37 9.13 2 10.52 2 12s.37 2.87 1.04 4.13l2.83-2.12z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.73 1 4.15 3.13 3.04 6.22l2.83 2.12c.86-2.59 3.28-4.51 6.13-4.51z" />
                </svg>
                {{ $t('auth.login_with_google') }}
            </button>
            
            <p class="mt-10 text-[11px] text-[var(--color-secondary)] leading-relaxed uppercase tracking-wider font-semibold opacity-50">
                Productivity & Balance
            </p>
        </div>
    </div>
</template>

<script setup>
import { useBalanceStore } from '../stores/balance';

const store = useBalanceStore();

const loginWithVK = () => {
    window.location.href = store.vkAuthUrl;
};

const loginWithGoogle = () => {
    window.location.href = store.googleAuthUrl;
};
</script>
