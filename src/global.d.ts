declare const notification: {
    success: (message: string, title?: string, icon?: string) => void;
    danger: (message: string, title?: string, icon?: string) => void;
    info: (message: string, title?: string, icon?: string) => void;
    warning: (message: string, title?: string, icon?: string) => void;
};
