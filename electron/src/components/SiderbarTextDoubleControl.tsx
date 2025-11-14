import { useEffect, useState } from "react";

interface SiderbarTextDoubleControlProps {
    name_left: string;
    name_right: string
    id_left: string;
    id_right: string;
    value_left: number;
    value_right: number;
    min_value_left?: number;
    max_value_left: number;
    min_value_right?: number;
    max_value_right: number;
    setValueLeft: (value: number) => void; 
    setValueRight: (value: number) => void;
}

function SiderbarTextDoubleControl({name_left, name_right, id_left, id_right, value_left, value_right, min_value_left = 0, max_value_left, min_value_right = 0, max_value_right, setValueLeft, setValueRight }: SiderbarTextDoubleControlProps) {
    const [valueLeftDisplay, setValueLeftDisplay] = useState("");
    const [valueRightDisplay, setValueRightDisplay] = useState("");
    
    useEffect(() => {
        setValueLeftDisplay("" + value_left);
        setValueRightDisplay("" + value_right);
    }, [value_left, value_right]);

    function setValue(val: number, min: number, max: number, set: (value: number) => void, setDisplay: (value: string) => void) {
        if (!Number.isNaN(val))
        {
            val = Math.min(Math.max(min, val), max);
            set(val);
            setDisplay("" + val);
        }
        else
        {
            set(min);
            setDisplay("" + min);
        }
    }
    
    return <div>
        <div className="row align-items-stretch">
            <div className="col-6 d-flex justify-content-center align-items-center">
                <label className="col-form-label" htmlFor={id_left}>
                    <strong>
                        {name_left}
                    </strong>
                </label>
            </div>
            <div className="col-6 d-flex justify-content-center align-items-center">
                <label className="col-form-label" htmlFor={id_left}>
                    <strong>
                        {name_right}
                    </strong>
                </label>
            </div>
        </div>
        <div className="row pb-1">
            <div className="col-6 d-flex justify-content-center align-items-center">
                <input id={id_left} className="form-control text-center" type="text" style={{width: "3em", height: "2em"}} value={valueLeftDisplay} 
                    onChange={(e) => setValueLeftDisplay(e.target.value)}
                    onBlur={(e) => {
                        let val: number = Math.round(parseFloat(e.target.value))
                        setValue(val, min_value_left, max_value_left, setValueLeft, setValueLeftDisplay);
                    }}
                />
            </div>
            <div className="col-6 d-flex justify-content-center align-items-center">
                <input id={id_right} className="form-control text-center" type="text" style={{width: "3em", height: "2em"}} value={valueRightDisplay} 
                    onChange={(e) => setValueRightDisplay(e.target.value)}
                    onBlur={(e) => {
                        let val: number = Math.round(parseFloat(e.target.value))
                        setValue(val, min_value_right, max_value_right, setValueRight, setValueRightDisplay);
                    }}
                />
            </div>
        </div>
    </div>
}

export default SiderbarTextDoubleControl;