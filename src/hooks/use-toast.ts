"use client"

import * as React from "react"

type ToastType = {
    id: string;
    title?: string;
    description?: string;
    variant?: 'default' | 'destructive' | 'success';
}

type ToastState = {
    toasts: ToastType[];
}

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 5000;

let count = 0;
function genId() { return (++count).toString(); }

const listeners: Array<(state: ToastState) => void> = [];
let memoryState: ToastState = { toasts: [] };

function dispatch(action: { type: 'ADD_TOAST' | 'DISMISS_TOAST' | 'REMOVE_TOAST', toast?: ToastType, toastId?: string }) {
    switch (action.type) {
        case 'ADD_TOAST':
            memoryState = {
                toasts: [action.toast!, ...memoryState.toasts].slice(0, TOAST_LIMIT),
            };
            break;
        case 'DISMISS_TOAST':
        case 'REMOVE_TOAST':
            memoryState = {
                toasts: memoryState.toasts.filter(t => t.id !== action.toastId),
            };
            break;
    }
    listeners.forEach(l => l(memoryState));
}

function toast({ title, description, variant = 'default' }: Omit<ToastType, 'id'>) {
    const id = genId();
    dispatch({ type: 'ADD_TOAST', toast: { id, title, description, variant } });
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', toastId: id }), TOAST_REMOVE_DELAY);
    return id;
}

function useToast() {
    const [state, setState] = React.useState<ToastState>(memoryState);
    React.useEffect(() => {
        listeners.push(setState);
        return () => { const idx = listeners.indexOf(setState); if (idx > -1) listeners.splice(idx, 1); };
    }, []);
    return { ...state, toast };
}

export { useToast, toast };
