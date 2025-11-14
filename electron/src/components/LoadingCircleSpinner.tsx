// https://examples.motion.dev/react/loading-circle-spinner

"use client"

import { motion } from "motion/react"

interface LoadingCircleSpinnerProps
{
    width?: number;
    height?: number;
}

function LoadingCircleSpinner({ width = 40, height = 40 }: LoadingCircleSpinnerProps) {
    const style: React.CSSProperties = {
        width: width,
        height: height,
        display: "block",
        borderRadius: "50%",
        border: "4px solid #606060",
        borderTopColor:"rgb(4, 0, 233)",
        willChange: "transform"
    };
    
    return (
        <motion.div
            className="spinner"
            animate={{ rotate: 360 }}
            transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "linear",
            }}
            
            style={style}>
        </motion.div>
    )
}

export default LoadingCircleSpinner
