/**
 * Suppress hydration warnings caused by browser extensions
 * This is a workaround for extensions like Bitwarden that inject attributes
 */

if (typeof window !== 'undefined') {
    // Store the original console.error
    const originalError = console.error;

    // Override console.error to filter out hydration warnings
    console.error = (...args) => {
        // Check if this is a hydration warning
        const isHydrationWarning = args.some(
            (arg) =>
                typeof arg === 'string' &&
                (arg.includes('Hydration failed') ||
                    arg.includes('error occurred during hydration') ||
                    arg.includes('did not match') ||
                    arg.includes('bis_skin_checked'))
        );

        // If it's not a hydration warning, log it normally
        if (!isHydrationWarning) {
            originalError(...args);
        }
    };
}

export { };
