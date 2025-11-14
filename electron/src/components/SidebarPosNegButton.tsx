interface SidebarPosNegButtonProps {
    name: string;
    id: string;
    condition: boolean,
    callback: () => void;
}

function SidebarPosNegButton({ name, id, condition, callback }: SidebarPosNegButtonProps) {
    return <div>
        <label  id={id} className={"label-button " + (condition ? "label-button-pos" : "label-button-neg")} onClick={callback}>
            <strong>
                {name}
            </strong>
        </label>
    </div>
}

export default SidebarPosNegButton;