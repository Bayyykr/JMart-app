import React, { useEffect, useState } from 'react';

const TopLoadingBar = ({ isLoading }) => {
    const [progress, setProgress] = useState(0);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        let interval;
        if (isLoading) {
            setVisible(true);
            setProgress(15);
            interval = setInterval(() => {
                setProgress((prev) => {
                    if (prev < 85) return prev + Math.random() * 15;
                    return prev;
                });
            }, 300);
        } else {
            setProgress(100);
            setTimeout(() => {
                setVisible(false);
                setProgress(0);
            }, 400); // fade out duration
        }

        return () => clearInterval(interval);
    }, [isLoading]);

    if (!visible) return null;

    return (
        <div className="fixed top-0 left-0 w-full z-50 pointer-events-none">
            <div
                className="h-1 bg-brand-green shadow-[0_0_10px_#2ebd59] transition-all duration-300 ease-out"
                style={{ width: `${progress}%`, opacity: progress === 100 ? 0 : 1 }}
            />
        </div>
    );
};

export default TopLoadingBar;
