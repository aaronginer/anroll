interface SidebarLabelProps {
    children: React.ReactNode;
}

function SidebarLabel({ children }: SidebarLabelProps) {
    return (
        <div style={{ marginBottom: 10 }}>
            <strong>{children}</strong>
        </div>
    );
}

export default SidebarLabel;