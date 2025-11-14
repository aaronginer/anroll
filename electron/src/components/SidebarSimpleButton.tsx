interface SidebarSimpleButtonProps {
    name: string;
    id: string;
    callback: () => void;
}

function SidebarSimpleButton({ name, id, callback }: SidebarSimpleButtonProps) {
    return <div>
        <label  id={id} className="label-button label-button-neutral" onClick={callback}>
            <strong>
                {name}
            </strong>
        </label>
    </div>
}

export default SidebarSimpleButton;