import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const useEscapeNavigate = (targetPage, shouldConfirm = false, onConfirm = null, enabled = true) => {
    const navigate = useNavigate()

    useEffect(() => {
        // If hook is disabled, do nothing
        if (!enabled) return;

        const handleEscNavigate = (event) => {
            // Don't trigger if user is typing in form elements
            if (event.target.tagName === 'INPUT' || 
                event.target.tagName === 'TEXTAREA' || 
                event.target.tagName === 'SELECT' ||
                event.target.isContentEditable) {
                return;
            }

            if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();

                if (shouldConfirm && onConfirm) {
                    // Trigger confirmation dialog
                    onConfirm();
                } else {
                    // Navigate directly
                    navigate(targetPage, { replace: true });
                }
            }
        };

        window.addEventListener('keyup', handleEscNavigate);

        // Cleanup the event listener on unmount or when dependencies change
        return () => {
            window.removeEventListener('keyup', handleEscNavigate);
        };
    }, [navigate, targetPage, shouldConfirm, onConfirm, enabled]);
};

export default useEscapeNavigate