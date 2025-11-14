import { useEffect, useState } from "react";

interface SidebarSliderControlProps {
    name: string;
    id_prefix: string;
    value: number;
    min_value: number;
    max_value: number;
    min_slider_value: number;
    max_slider_value: number;
    step_size: number;
    disabled?: boolean;
    setValue: (value: number) => void;
}

function SidebarSliderControl({ name, id_prefix, value, min_value, max_value, min_slider_value, max_slider_value, step_size, disabled = false, setValue }: SidebarSliderControlProps) {
    const [inputDisplayValue, setInputDisplayValue] = useState("");

    useEffect(() => {
        setInputDisplayValue("" + value);
    }, [value]);

    return <div>
        <div className="row align-items-center flex-nowrap">
            <div className="col">
                <label className="col-form-label" htmlFor={id_prefix + "-input"}>
                    <strong>
                        {name}
                    </strong>
                </label>
            </div>
            <div className="col-auto">
                <input id={id_prefix + "-input"} className="form-control text-center" disabled={disabled} type="text" style={{width: "4em", height: "2em"}} value={inputDisplayValue} 
                    onChange={(e) => {
                        setInputDisplayValue(e.target.value);
                        let val: number = parseFloat(e.target.value);
                        if (!Number.isNaN(val)) {
                            setValue(Math.min(Math.max(min_value, val), max_value));
                        }
                    }} 
                    onBlur={(e) => {
                        let val: number = parseFloat(e.target.value);
                        if (Number.isNaN(val)) {
                            setInputDisplayValue("" + min_slider_value);
                            setValue(min_slider_value);
                        }
                        else
                        {
                            val = Math.min(Math.max(min_value, val), max_value)
                            setInputDisplayValue("" + val);
                            setValue(val);
                        }
                    }}
                />
            </div>
        </div>
        <div className="row">
            <div className="col">
                <input id={id_prefix + "-slider"} className="form-range" disabled={disabled}  type="range" value={value} min={min_slider_value} max={max_slider_value} step={step_size} 
                    onChange={(e) => {
                        setValue(parseFloat(e.target.value));
                        setInputDisplayValue("" + e.target.value);
                    }}
                />
            </div>
        </div>
    </div>
}

export default SidebarSliderControl;