interface SidebarCheckboxControlProps {
    name: string;
    id_prefix: string;
    value: boolean;
    disabled?: boolean;
    setValue: (value: boolean) => void; 
}

function SidebarCheckboxControl({ name, id_prefix, value, disabled = false, setValue }: SidebarCheckboxControlProps) {    
    return <div id="checkbox-control" className="row">
        <div className="col">
            <div className="form-check">
                {value && 
                    <input id={id_prefix + "-active"} className="form-check-input custom-checkbox" disabled={disabled} type="checkbox" checked
                        onChange={() => setValue(!value)}
                    />
                }
                {!value && 
                    <input id={id_prefix + "-active"} className="form-check-input custom-checkbox" disabled={disabled} type="checkbox"
                        onChange={() => setValue(!value)}
                    />
                }
                <label className="form-check-label" htmlFor={id_prefix + "-active"}>
                    <strong>
                        {name}
                    </strong>
                </label>
            </div>
        </div>
    </div>
}

export default SidebarCheckboxControl;