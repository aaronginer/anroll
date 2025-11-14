import type { ReactNode } from "react";
import { useState } from "react";

interface DropdownMenuProps {
    title: string,
    active?: boolean,
    children: ReactNode,
}

function DropdownMenu({ title, active=true, children }: DropdownMenuProps) {
    const [isOpen, setIsOpen] = useState(active);

    return <div className="text-center border rounded-3 border-3 dropdown" data-bs-theme="dark">
        <button className="btn btn-secondary w-100 rounded-0" onClick={() => setIsOpen(!isOpen)}>
            <strong>
                {title}
            </strong>
        </button>
        <div className={(!isOpen ? "visually-hidden" : "")}>
            <div className="container dropdown-content">
                {children} 
            </div>
        </div>
    </div>
}

export default DropdownMenu;