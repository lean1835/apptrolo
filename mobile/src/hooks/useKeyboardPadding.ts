import { useState, useEffect } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * Hook that tracks keyboard height on Android and auto-scrolls a ScrollView
 * to keep the focused input visible.
 * 
 * @param scrollRef - ref to the ScrollView component
 * @returns keyboardHeight - current keyboard height (0 when hidden)
 */
export const useKeyboardPadding = (scrollRef: any) => {
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    useEffect(() => {
        if (Platform.OS !== 'android') return;

        const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
            const kbH = e.endCoordinates.height;
            setKeyboardHeight(kbH);
            // Wait for layout to update with new padding, then scroll to end
            if (scrollRef?.current) {
                setTimeout(() => {
                    scrollRef.current?.scrollToEnd({ animated: true });
                }, 100);
            }
        });
        const hideSub = Keyboard.addListener('keyboardDidHide', () => {
            setKeyboardHeight(0);
        });

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, [scrollRef]);

    return keyboardHeight;
};
