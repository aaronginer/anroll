import { useEffect, useState } from "react";
import SidebarLabel from "./SidebarLabel";

interface SidebarDropdownMenuProps {
    name: string;
    id_prefix: string;
    initIndex?: number
    keys: string[];
    values: string[];
    setValue: ((value: number | string) => void);
    useStringKeys?: boolean
}

function SidebarDropdownMenu({ name, id_prefix, initIndex = 0, keys, values, setValue, useStringKeys = false }: SidebarDropdownMenuProps) {
    const [selectedIndex, setSelectedIndex] = useState(initIndex);

    useEffect(() => {
        setSelectedIndex(initIndex);
    }, [initIndex]);

    function handleSelectChange(event: React.ChangeEvent<HTMLSelectElement>) {
        const index = Number(event.target.value);
        setSelectedIndex(index);
        setValue(useStringKeys ? keys[index] : index);
    }
    
    return <div style={{ marginBottom: 5 }}>
        <SidebarLabel>
            <strong>{name}</strong>
        </SidebarLabel>
        <select
            className="form-select"
            id={id_prefix + "-select"}
            value={selectedIndex}
            onChange={handleSelectChange}
        >
            {values.map((value, index) => (
                <option key={index} value={index}>
                    {value}
                </option>
            ))}
        </select>
    </div>
}

export default SidebarDropdownMenu;