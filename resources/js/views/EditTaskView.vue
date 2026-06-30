<template>
    <div class="fixed inset-0 z-[200] bg-[var(--bg-app)] flex flex-col overflow-hidden">
        <EditTaskModal
            v-if="task"
            :task="task"
            :is-new="isNew"
            @close="router.push('/')"
            @saved="router.push('/')"
        />
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useBalanceStore } from '../stores/balance';
import EditTaskModal from '../components/EditTaskModal.vue';

const route = useRoute();
const router = useRouter();
const store = useBalanceStore();

const isNew = computed(() => route.params.id === 'new');

const task = computed(() => {
    if (isNew.value) {
        const presetTitle = (route.query.title || '').trim();
        return {
            title: presetTitle, category_slug: 'chor', importance: 2, repeat_type: 'none',
            repeat_interval: 1, repeat_days: [], deadline: null, postpone_until: null,
            ha: false, force_active: false, notes: '', isNew: true
        };
    }
    return store.tasks.find(t => t.id === parseInt(route.params.id));
});
</script>

<style scoped>
@keyframes scale-up {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
}
</style>
