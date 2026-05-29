<template>
    <div class="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4" @click.self="$emit('close')">
        <div class="bg-[var(--bg-card)] rounded-2xl p-4 sm:p-5 w-full max-w-[560px] max-h-[90vh] overflow-y-auto overflow-x-hidden shadow-2xl relative border border-[var(--color-border)]">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-lg font-bold tracking-tight text-[var(--color-text)]">Настройки</h2>
                <span @click="$emit('close')" class="cursor-pointer text-2xl text-[var(--color-secondary)] hover:text-[var(--color-text)] transition-colors">&times;</span>
            </div>

            <div class="flex flex-wrap gap-1 mb-6 bg-[var(--bg-secondary)]/50 p-1 rounded-xl border border-[var(--color-border)]">
                <div v-for="t in ['gen', 'cat', 'sub', 'notepad', 'data']" :key="t"
                     @click="tab = t"
                     :class="['flex-1 text-center py-2 rounded-lg cursor-pointer text-[11px] font-bold uppercase tracking-wider transition-all', tab === t ? 'bg-[var(--bg-card)] text-[var(--color-text)] shadow-sm' : 'text-[var(--color-secondary)] hover:text-[var(--color-text)]']">
                    {{ tabNames[t] }}
                </div>
            </div>

            <!-- Общие (Тема) -->
            <div v-if="tab === 'gen'" class="space-y-6 pb-2">
                <div>
                    <label class="text-[10px] text-[var(--color-secondary)] uppercase font-black px-1 tracking-widest block mb-3">Оформление системы</label>
                    <div class="grid grid-cols-3 gap-2 bg-[var(--bg-secondary)] p-1 rounded-2xl border border-[var(--color-border)]">
                        <button v-for="m in ['system', 'light', 'dark']" :key="m"
                                @click="store.setTheme(m)"
                                :class="['py-3 rounded-xl text-xs font-bold transition-all', store.theme === m ? 'bg-[var(--bg-card)] text-[var(--color-text)] shadow-sm border border-[var(--color-border)]' : 'bg-transparent text-[var(--color-secondary)] border border-transparent']">
                            {{ m === 'system' ? 'Система' : (m === 'light' ? 'Светлая' : 'Тёмная') }}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Категории -->
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
                            До {{ c.hide_until.substring(0, 10) }}
                        </span>
                        <span class="text-xs font-black text-[var(--color-border)] w-10 text-right">{{ c.weight }}%</span>
                        <svg class="w-4 h-4 text-[var(--color-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                    </div>
                </div>
                <div class="flex gap-2 pt-4">
                    <button @click="addCategory" class="flex-1 py-3 bg-[var(--bg-secondary)] text-[var(--color-text)] rounded-xl font-bold text-xs hover:opacity-80 transition-opacity border border-[var(--color-border)]">+ Добавить</button>
                    <button @click="saveCats" class="flex-1 py-3 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] border border-[var(--color-border)] rounded-xl font-bold text-xs">Сохранить</button>
                </div>
            </div>

            <!-- Подкатегории -->
            <div v-if="tab === 'sub'" class="space-y-1">
                <div v-for="(coeff, name) in store.subcatCoeffs" :key="name" class="flex items-center gap-3 py-3 border-b border-[var(--color-border)] last:border-0">
                    <span class="flex-1 text-sm font-medium text-[var(--color-text)]">{{ name }}</span>
                    <input v-model.number="store.subcatCoeffs[name]" type="range" min="0.5" max="4" step="0.1" class="w-24 accent-[var(--color-text)]">
                    <span class="text-xs font-bold text-[var(--color-secondary)] w-8">{{ Number(coeff).toFixed(1) }}</span>
                    <button @click="deleteSubcat(name)" class="p-2 text-[var(--color-secondary)] hover:text-red-500 rounded-lg hover:bg-red-50/10 transition-all border-none shadow-none bg-transparent">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>
                <button @click="saveSubcats" class="w-full py-3.5 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] border border-[var(--color-border)] rounded-2xl font-bold text-sm mt-6 shadow-sm transition-all">Сохранить всё</button>
            </div>

            <!-- Блокнот -->
            <div v-if="tab === 'notepad'">
                <textarea v-model="localNotepad" class="w-full h-72 p-4 border border-[var(--color-border)] rounded-2xl text-sm mb-4 focus:ring-2 focus:ring-[var(--color-border)] outline-none transition-all bg-[var(--bg-secondary)]/30 text-[var(--color-text)]" placeholder="Заметки..."></textarea>
                <button @click="saveNotepad" class="w-full py-3.5 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] border border-[var(--color-border)] rounded-2xl font-bold text-sm shadow-sm transition-all">Сохранить</button>
            </div>

            <!-- Данные -->
            <div v-if="tab === 'data'" class="space-y-4">
                <div class="p-5 bg-[var(--bg-secondary)] border border-[var(--color-border)] rounded-2xl text-[12px] text-[var(--color-secondary)] leading-relaxed">
                    <p class="font-bold text-[var(--color-text)] mb-1">Управление данными</p>
                    Вы можете экспортировать свои данные в JSON-файл или импортировать бэкап. 
                    <br><span class="text-red-500 font-medium">Внимание:</span> Импорт полностью заменит текущие задачи и настройки!
                </div>
                <div class="grid grid-cols-1 gap-2">
                    <button @click="store.fetchAll()" class="w-full py-3.5 bg-[var(--bg-secondary)] text-[var(--color-text)] rounded-2xl font-bold text-sm hover:opacity-80 transition-all flex items-center justify-center gap-3 border border-[var(--color-border)]">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                        Принудительная синхронизация
                    </button>
                    <button @click="exportData" class="w-full py-3.5 bg-[var(--bg-card)] border border-[var(--color-border)] text-[var(--color-text)] rounded-2xl font-bold text-sm hover:bg-[var(--bg-secondary)] transition-all flex items-center justify-center gap-3">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                        Экспорт (JSON)
                    </button>
                    <button @click="$refs.fileInput.click()" class="w-full py-3.5 bg-[var(--bg-card)] border border-[var(--color-border)] text-[var(--color-text)] rounded-2xl font-bold text-sm hover:bg-[var(--bg-secondary)] transition-all flex items-center justify-center gap-3">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                        Импорт (JSON)
                    </button>
                </div>
                <input type="file" ref="fileInput" @change="handleImport" accept=".json" class="hidden">
            </div>

            <!-- Footer / Version -->
            <div class="mt-8 pt-4 border-t border-[var(--color-border)] flex justify-between items-center opacity-40">
                <span class="text-[9px] font-black uppercase tracking-widest text-[var(--color-secondary)]">Balance.Daily</span>
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

const emit = defineEmits(['close']);
const store = useBalanceStore();
const tab = ref('gen');
const tabNames = { gen: 'Общие', cat: 'Категории', sub: 'Подкатегории', notepad: 'Блокнот', data: 'Данные' };

const editableCats = reactive({});
const localNotepad = ref('');
const editingCategory = ref(null);
const version = __APP_VERSION__;

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
    syncWeights(slug, data.weight); // Ensure weights are balanced after save
    editingCategory.value = null;
};

const handleDeleteCategory = (slug) => {
    if (Object.keys(editableCats).length <= 1) {
        alert('Нельзя удалить последнюю категорию');
        return;
    }
    delete editableCats[slug];
    const firstRemaining = Object.keys(editableCats)[0];
    syncWeights(firstRemaining, editableCats[firstRemaining].weight);
    editingCategory.value = null;
};

const addCategory = () => {
    const newKey = 'cat_' + Date.now();
    const newData = { name: 'Новая', weight: 10, color: '#8e8e93', hide_until: '' };
    editableCats[newKey] = newData;
    syncWeights(newKey, 10);
    
    editingCategory.value = {
        slug: newKey,
        data: { ...newData },
        isNew: true
    };
};

const deleteCategory = (slug) => {
    if (Object.keys(editableCats).length <= 1) return;
    delete editableCats[slug];
    const firstRemaining = Object.keys(editableCats)[0];
    syncWeights(firstRemaining, editableCats[firstRemaining].weight);
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
        alert('Ошибка при сохранении категорий');
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
    alert('Блокнот сохранен');
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
            const msg = ex.response?.data?.message || ex.message || 'Неверный формат JSON или ошибка сервера';
            alert('Ошибка при импорте: ' + msg);
        }
    };
    r.readAsText(f);
};

onMounted(initData);
</script>
