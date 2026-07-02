import { ref } from 'vue';

const message = ref(null);
const visible = ref(false);
let timer = null;

/**
 * Global toast notification composable.
 * Shared state — importing in any component reads the same reactive refs.
 */
export function useToast() {
    /**
     * Show a toast message. Auto-hides after `duration` ms.
     * Calling show() again resets the timer.
     *
     * @param {string} msg  Text to display
     * @param {number} [duration=2000]  Auto-hide delay in ms
     */
    function show(msg, duration = 2000) {
        clearTimeout(timer);
        message.value = msg;
        visible.value = true;
        timer = setTimeout(() => {
            visible.value = false;
            message.value = null;
        }, duration);
    }

    return { message, visible, show };
}
