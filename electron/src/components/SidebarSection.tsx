import type { ReactNode } from "react";
import { useState } from "react";

interface SidebarSectionProps {
    title: string,
    active?: boolean,
    children: ReactNode,
    buttonBackgroundColor?: string,
    borderColor?: string,
    resetButton?: boolean,
    resetButtonCallback?: () => void;
}

function SidebarSection({ title, active = false, children, buttonBackgroundColor = "", borderColor = "#0033ff", resetButton = true, resetButtonCallback = () => {}}: SidebarSectionProps) {
    const [isOpen, setIsOpen] = useState(active);

    return <div id={"sidebar-section-" + title} className="sidebar-section text-center rounded-3" data-bs-theme="dark" style={{border: "3px solid " + borderColor}}>
        {resetButton && 
            <div style={{position: "relative"}}>
                <button className="reset-button" onClick={resetButtonCallback}></button>
            </div>
        }
        <button className="btn btn-primary w-100 border-0 rounded-0" onClick={() => setIsOpen(!isOpen)} style={{backgroundColor: buttonBackgroundColor}}>
            <strong>
                {title}
            </strong>
        </button>
        <div id={"sidebar-section-" + title + "-content"} className={(!isOpen ? "visually-hidden" : "")}>
            <div className="container sidebar-section-content">
                {children} 
            </div>
        </div>
    </div>
}

export default SidebarSection;