<template>
    <div class="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-2 sm:p-4" @click.self="$emit('close')">
        <div class="bg-[var(--bg-card)] rounded-[24px] sm:rounded-[32px] w-full max-w-[560px] h-[80vh] landscape:h-[95vh] flex flex-col overflow-hidden shadow-2xl relative border border-[var(--color-border)]">
            <!-- Header (Fixed) -->
            <div class="p-5 pb-3 shrink-0 landscape:p-3 landscape:pb-1 flex justify-between items-center">
                <h2 class="text-lg font-bold tracking-tight text-[var(--color-text)] landscape:text-sm">
                    {{ $t('settings.title') }}
                </h2>
                <div @click="$emit('close')" class="shrink-0 w-8 h-8 flex items-center justify-center cursor-pointer text-2xl text-[var(--color-secondary)] hover:text-[var(--color-text)] transition-colors">
                    &times;
                </div>
            </div>

            <!-- Tabs Nav (Fixed) -->
            <div class="px-5 mb-2 shrink-0 landscape:px-3 landscape:mb-1">
                <div class="flex gap-1 bg-[var(--bg-secondary)]/50 p-1 rounded-xl border border-[var(--color-border)] landscape:rounded-lg overflow-x-auto scrollbar-hide">
                    <button v-for="t in tabs" :key="t"
                            @click="tab = t"
                            :class="['flex-1 min-w-[70px] flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border-none shadow-none relative landscape:py-1 landscape:text-[8px]', 
                                     tab === t ? 'bg-[var(--bg-card)] text-[var(--color-primary)] shadow-sm' : 'bg-transparent text-[var(--color-secondary)] hover:text-[var(--color-text)]']">
                        <!-- Tab Icons -->
                        <svg v-if="t === 'gen'" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        <svg v-if="t === 'cat'" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                        <svg v-if="t === 'sub'" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                        <svg v-if="t === 'notepad'" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                        <svg v-if="t === 'data'" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path></svg>

                        <span :class="{'hidden sm:block': tab !== t}">{{ $t(`settings.tabs.${t}`) }}</span>
                        <div v-if="tab === t" class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[var(--color-primary)] rounded-full"></div>
                    </button>
                </div>
            </div>

            <!-- Main Content (Scrollable) -->
            <div class="flex-1 overflow-y-auto p-5 pt-2 custom-scrollbar min-h-0 landscape:p-3 landscape:pt-1"
                 @touchstart="handleTouchStart"
                 @touchend="handleTouchEnd">
                
                <!-- Tab: General -->
                <div v-if="tab === 'gen'" class="space-y-6 pb-2">
                    <div>
                        <label class="text-[10px] text-[var(--color-secondary)] uppercase font-black px-1 tracking-widest block mb-3">{{ $t('settings.general.language') }}</label>
                        <div class="grid grid-cols-2 gap-2 bg-[var(--bg-secondary)] p-1 rounded-2xl border border-[var(--color-border)]">
                            <button v-for="l in ['ru', 'en']" :key="l"
                                    @click="changeLanguage(l)"
                                    :class="['py-3 rounded-xl text-xs font-bold transition-all', store.locale === l ? 'bg-[var(--bg-card)] text-[var(--color-text)] shadow-sm border border-[var(--color-border)]' : 'bg-transparent text-[var(--color-secondary)] border border-transparent']">
                                {{ l === 'ru' ? 'Русский' : 'English' }}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label class="text-[10px] text-[var(--color-secondary)] uppercase font-black px-1 tracking-widest block mb-3">{{ $t('settings.general.appearance') }}</label>
                        <div class="grid grid-cols-3 gap-2 bg-[var(--bg-secondary)] p-1 rounded-2xl border border-[var(--color-border)]">
                            <button v-for="m in ['system', 'light', 'dark']" :key="m"
                                    @click="store.setTheme(m)"
                                    :class="['py-3 rounded-xl text-xs font-bold transition-all', store.theme === m ? 'bg-[var(--bg-card)] text-[var(--color-text)] shadow-sm border border-[var(--color-border)]' : 'bg-transparent text-[var(--color-secondary)] border border-transparent']">
                                {{ $t(`settings.general.theme.${m}`) }}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label class="text-[10px] text-[var(--color-secondary)] uppercase font-black px-1 tracking-widest block mb-3">{{ $t('settings.general.pulse_frequency') }}</label>
                        <select :value="store.pulseInterval" 
                                @change="store.setPulseInterval($event.target.value)" 
                                class="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--color-border)] rounded-2xl text-sm text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-border)] transition-all">
                            <option v-for="val in [1, 5, 15, 30, 0]" :key="val" :value="val">
                                {{ $t(`settings.general.pulse_intervals.${val}`) }}
                            </option>
                        </select>
                    </div>

                    <div class="p-4 bg-[var(--bg-secondary)] border border-[var(--color-border)] rounded-2xl flex items-center justify-between">
                        <div class="flex-1">
                            <p class="text-xs font-bold text-[var(--color-text)]">{{ $t('settings.general.notifications') }}</p>
                            <p class="text-[10px] text-[var(--color-secondary)] mt-0.5">{{ $t('settings.general.notifications_desc') }}</p>
                        </div>
                        <button @click="store.toggleNotifications()" 
                                :class="['w-12 h-6 rounded-full relative transition-all duration-300 border-none shadow-inner', 
                                         store.notificationsEnabled ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]']">
                            <div :class="['absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm', 
                                         store.notificationsEnabled ? 'translate-x-6' : 'translate-x-0']"></div>
                        </button>
                    </div>
                </div>

                <!-- Tab: Categories -->
                <div v-if="tab === 'cat'" class="space-y-2 pb-2">
                    <div v-for="(c, slug) in editableCats" :key="slug" 
                         @click="openEditCategory(slug)"
                         class="flex items-center justify-between p-3.5 bg-[var(--bg-secondary)]/30 hover:bg-[var(--bg-card)] rounded-2xl cursor-pointer transition-all border border-transparent hover:border-[var(--color-border)] hover:shadow-sm">
                        <div class="flex items-center gap-3">
                            <div class="w-4 h-4 rounded-full shadow-inner border border-white/20" :style="{ backgroundColor: c.color }"></div>
                            <span class="font-bold text-sm text-[var(--color-text)]">{{ c.name }}</span>
                        </div>
                        <div class="flex items-center gap-3">
                            <span v-if="c.hide_until" class="text-[10px] bg-[var(--bg-secondary)] text-[var(--color-secondary)] px-2.5 py-1 rounded-lg font-bold border border-[var(--color-border)]">
                                {{ $t('settings_modal.categories.hide_until_prefix') }} {{ c.hide_until.substring(0, 10) }}
                            </span>
                            <span class="text-xs font-black text-[var(--color-border)] w-10 text-right">{{ c.weight }}%</span>
                            <svg class="w-4 h-4 text-[var(--color-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                        </div>
                    </div>
                    <div class="flex gap-2 pt-4">
                        <button @click="addCategory" class="flex-1 py-3 bg-[var(--bg-secondary)] text-[var(--color-text)] rounded-xl font-bold text-xs hover:opacity-80 transition-opacity border border-[var(--color-border)]">{{ $t('settings_modal.categories.add_button') }}</button>
                        <button @click="saveCats" class="flex-1 py-3 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] border border-[var(--color-border)] rounded-xl font-bold text-xs">{{ $t('settings_modal.categories.save_button') }}</button>
                    </div>
                </div>

                <!-- Tab: Subcategories -->
                <div v-if="tab === 'sub'" class="space-y-1">
                    <div v-for="(coeff, name) in store.subcatCoeffs" :key="name" class="flex items-center gap-3 py-3 border-b border-[var(--color-border)] last:border-0">
                        <span class="flex-1 text-sm font-medium text-[var(--color-text)]">{{ name }}</span>
                        <input v-model.number="store.subcatCoeffs[name]" type="range" min="0.5" max="4" step="0.1" class="w-24 accent-[var(--color-text)]">
                        <span class="text-xs font-bold text-[var(--color-secondary)] w-8">{{ Number(coeff).toFixed(1) }}</span>
                        <button @click="deleteSubcat(name)" class="p-2 text-[var(--color-secondary)] hover:text-red-500 rounded-lg hover:bg-red-50/10 transition-all border-none shadow-none bg-transparent">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </div>
                    <button @click="saveSubcats" class="w-full py-3.5 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] border border-[var(--color-border)] rounded-2xl font-bold text-sm mt-6 shadow-sm transition-all">{{ $t('settings_modal.subcategories.save_all_button') }}</button>
                </div>

                <!-- Tab: Notepad -->
                <div v-if="tab === 'notepad'" class="h-full flex flex-col">
                    <textarea v-model="localNotepad" 
                              class="flex-1 w-full p-4 border border-[var(--color-border)] rounded-2xl text-sm mb-4 focus:ring-2 focus:ring-[var(--color-border)] outline-none transition-all bg-[var(--bg-secondary)]/30 text-[var(--color-text)] resize-none custom-scrollbar" 
                              :placeholder="$t('settings_modal.notepad.placeholder')"></textarea>
                    <button @click="saveNotepad" class="shrink-0 w-full py-3.5 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] border border-[var(--color-border)] rounded-2xl font-bold text-sm shadow-sm transition-all">{{ $t('settings_modal.notepad.save_button') }}</button>
                </div>

                <!-- Tab: Data -->
                <div v-if="tab === 'data'" class="space-y-4">
                    <div class="p-5 bg-[var(--bg-secondary)] border border-[var(--color-border)] rounded-2xl text-[12px] text-[var(--color-secondary)] leading-relaxed">
                        <p class="font-bold text-[var(--color-text)] mb-1">{{ $t('settings_modal.data.title') }}</p>
                        {{ $t('settings_modal.data.description') }}
                        <br><span class="text-red-500 font-medium">{{ $t('settings_modal.data.warning') }}</span>
                    </div>
                    <div class="grid grid-cols-1 gap-2">
                        <button @click="store.sync(true)" class="w-full py-3.5 bg-[var(--bg-secondary)] text-[var(--color-text)] rounded-2xl font-bold text-sm hover:opacity-80 transition-all flex items-center justify-center gap-3 border border-[var(--color-border)]">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                            {{ $t('settings_modal.data.sync_button') }}
                        </button>
                        <button @click="exportData" class="w-full py-3.5 bg-[var(--bg-card)] border border-[var(--color-border)] text-[var(--color-text)] rounded-2xl font-bold text-sm hover:bg-[var(--bg-secondary)] transition-all flex items-center justify-center gap-3">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                            {{ $t('settings_modal.data.export_button') }}
                        </button>
                        <button @click="$refs.fileInput.click()" class="w-full py-3.5 bg-[var(--bg-card)] border border-[var(--color-border)] text-[var(--color-text)] rounded-2xl font-bold text-sm hover:bg-[var(--bg-secondary)] transition-all flex items-center justify-center gap-3">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                            {{ $t('settings_modal.data.import_button') }}
                        </button>
                    </div>
                    <input type="file" ref="fileInput" @change="handleImport" accept=".json" class="hidden">
                </div>
            </div>

            <!-- Footer (Fixed) -->
            <div class="p-4 sm:p-5 border-t border-[var(--color-border)] flex justify-between items-center opacity-40 landscape:p-2">
                <div class="flex flex-col gap-0.5">
                    <span class="text-[9px] font-black uppercase tracking-widest text-[var(--color-secondary)]">Balance.Daily</span>
                    <span v-if="offlineReady" class="text-[8px] font-bold text-green-500 uppercase tracking-tighter flex items-center gap-1">
                        <svg class="w-2 h-2" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
                        Ready for offline
                    </span>
                </div>
                <span class="text-[9px] font-bold font-mono text-[var(--color-secondary)]">v{{ version }}</span>
            </div>
        </div>

        <EditCategoryModal 
            v-if="editingCategory" 
            :category="editingCategory.data" 
            :slug="editingCategory.slug"
            :isNew="editingCategory.isNew"
            @close="editingCategory = null"
            @save="handleSaveCategory"
            @delete="handleDeleteCategory"
            @weight-changed="syncWeights"
        />
    </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { useBalanceStore } from '../stores/balance';
import EditCategoryModal from './EditCategoryModal.vue';
import axios from 'axios';
import { useI18n } from 'vue-i18n';

const props = defineProps({
    offlineReady: {
        type: Boolean,
        default: false
    }
});

const { locale, t } = useI18n();
const emit = defineEmits(['close']);
const store = useBalanceStore();
const tab = ref('gen');
const tabs = ['gen', 'cat', 'sub', 'notepad', 'data'];

// Swipe logic
const touchStart = ref({ x: 0, y: 0 });
const handleTouchStart = (e) => {
    touchStart.value = { 
        x: e.touches[0].clientX, 
        y: e.touches[0].clientY 
    };
};
const handleTouchEnd = (e) => {
    const touchEnd = { 
        x: e.changedTouches[0].clientX, 
        y: e.changedTouches[0].clientY 
    };
    const dx = touchStart.value.x - touchEnd.x;
    const dy = touchStart.value.y - touchEnd.y;
    const threshold = 60; 
    const verticalThreshold = 40; 

    if (Math.abs(dx) > threshold && Math.abs(dy) < verticalThreshold) {
        const currentIndex = tabs.indexOf(tab.value);
        if (dx > 0 && currentIndex < tabs.length - 1) {
            tab.value = tabs[currentIndex + 1];
        } else if (dx < 0 && currentIndex > 0) {
            tab.value = tabs[currentIndex - 1];
        }
    }
};

const editableCats = reactive({});
const localNotepad = ref('');
const editingCategory = ref(null);
const version = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '2.1.4';

const changeLanguage = (l) => {
    store.setLocale(l);
    locale.value = l;
};

const initData = () => {
    store.categories.filter(c => c.slug !== '__archive__').forEach(c => {
        editableCats[c.slug] = {
            name: c.name,
            weight: Math.round(parseFloat(c.weight) * 100),
            color: c.color,
            hide_until: c.hide_until || ''
        };
    });
    localNotepad.value = store.notepadText;
};

const syncWeights = (slug, w) => {
    const keys = Object.keys(editableCats);
    if (keys.length === 1) {
        editableCats[slug].weight = 100;
        return;
    }
    const others = keys.filter(k => k !== slug);
    const sumO = others.reduce((s, k) => s + editableCats[k].weight, 0);
    const tot = w + sumO;
    
    if (tot > 100) {
        const ex = tot - 100;
        others.forEach(k => {
            editableCats[k].weight = Math.max(1, Math.round(editableCats[k].weight - ex * (editableCats[k].weight / sumO)));
        });
    } else if (tot < 100) {
        const df = 100 - tot;
        others.forEach(k => {
            editableCats[k].weight = Math.round(editableCats[k].weight + df * (editableCats[k].weight / sumO));
        });
    }
    
    // Final check for exactly 100%
    const currentSum = keys.reduce((s, k) => s + editableCats[k].weight, 0);
    if (currentSum !== 100) {
        editableCats[slug].weight += (100 - currentSum);
    }
};

const openEditCategory = (slug) => {
    editingCategory.value = {
        slug,
        data: { ...editableCats[slug] },
        isNew: false
    };
};

const handleSaveCategory = (slug, data) => {
    editableCats[slug] = data;
    syncWeights(slug, data.weight); 
    editingCategory.value = null;
};

const handleDeleteCategory = (slug) => {
    if (Object.keys(editableCats).length <= 1) {
        alert(t('settings_modal.categories.delete_last_error'));
        return;
    }
    delete editableCats[slug];
    const firstRemaining = Object.keys(editableCats)[0];
    syncWeights(firstRemaining, editableCats[firstRemaining].weight);
    editingCategory.value = null;
};

const addCategory = () => {
    const newKey = 'cat_' + Date.now();
    const newData = { name: t('settings_modal.categories.new_category_name'), weight: 10, color: '#8e8e93', hide_until: '' };
    editableCats[newKey] = newData;
    syncWeights(newKey, 10);
    
    editingCategory.value = {
        slug: newKey,
        data: { ...newData },
        isNew: true
    };
};

const saveCats = async () => {
    try {
        await axios.post('import', {
            categories: {
                ...editableCats,
                '__archive__': store.categories.find(c => c.slug === '__archive__')
            },
            tasks: store.tasks, 
            subcatCoeffs: store.subcatCoeffs,
            notepad: store.notepadText
        });
        await store.fetchAll();
        emit('close');
    } catch (e) {
        alert(t('settings_modal.categories.save_error'));
    }
};

const deleteSubcat = (name) => {
    delete store.subcatCoeffs[name];
};

const saveSubcats = async () => {
    await saveCats(); 
};

const saveNotepad = async () => {
    await axios.post('settings', { settings: { notepad_text: localNotepad.value } });
    store.notepadText = localNotepad.value;
    alert(t('settings_modal.notepad.saved_message'));
};

const exportData = async () => {
    const res = await axios.get('export');
    const b = new Blob([JSON.stringify(res.data)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = 'balance_backup_new.json';
    a.click();
};

const handleImport = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = async (ev) => {
        try {
            const d = JSON.parse(ev.target.result);
            await axios.post('import', d);
            window.location.reload();
        } catch (ex) {
            console.error('Import error:', ex);
            const msg = ex.response?.data?.message || ex.message || 'Error';
            alert(t('settings_modal.data.import_error', { msg }));
        }
    };
    r.readAsText(f);
};

onMounted(initData);
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 10px;
}
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}
.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
</style>
