import { useEffect, useState } from "react";

interface SidebarTextInputProps {
    id: string;
    value: string
    placeholder: string;
    setValue: (value: string) => void;
}

function SidebarTextInput({ id, value, placeholder, setValue }: SidebarTextInputProps) {    
    const [valueDisplay, setValueDisplay] = useState("");
        
        useEffect(() => {
            setValueDisplay(value);
        }, [value]);
    
    return <input id={id} className="text-input-simple form-control text-center" type="text" value={valueDisplay} placeholder={placeholder}
        onChange={(e) => setValueDisplay(e.target.value)}
        onBlur={(e) => {
            setValue(e.target.value);
            setValueDisplay(e.target.value);
        }}
    />
}

export default SidebarTextInput;