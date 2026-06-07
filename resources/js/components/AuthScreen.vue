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
            
            <button class="w-full py-3.5 bg-[var(--bg-card)] border border-[var(--color-border)] text-[var(--color-text)] rounded-xl font-bold text-[15px] flex items-center justify-center gap-3 hover:bg-[var(--bg-secondary)] transition-all active:scale-[0.98] shadow-sm" @click="loginWithGoogle">
                <svg class="w-5 h-5" viewBox="0 0 24 24">
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

const loginWithGoogle = () => {
    window.location.href = store.googleAuthUrl;
};
</script>
