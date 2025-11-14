interface SidebarImageUploadProps {
    name: string;
    id: string;
    imageUrl: string;
    setImageUrl: (value: string) => void;
}

function SidebarImageUpload({ name, id, imageUrl, setImageUrl }: SidebarImageUploadProps) {
    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;

        const file = e.target.files[0];

        if (file) {
            readFileData(file).then(result => {
                setImageUrl(result);
            }).catch(() => {
                setImageUrl("");
            });
        }
    }

    // https://stackoverflow.com/questions/58409695/when-does-browser-read-the-file-selected-in-input-type-file
    function readFileData(file: Blob): Promise<string>
    {
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
            reader.onload = e => {
                const result = e.target?.result;
                if (typeof result === "string")
                {
                    resolve(result);
                }
                else {
                    reject(new Error("Result must be a string."));
                }
            };

            reader.onerror = () => {
                reject(new DOMException("Problem parsing input file."));
            };
            reader.readAsDataURL(file);
        });
    }

    return <div>
        <input type="file" className="visually-hidden" id={id} accept="image/png" onChange={handleUpload}/>
        <label htmlFor={id} className={"label-button " + (imageUrl != "" ? "label-button-pos" : "label-button-neg")}>
            <strong>
                {name}
            </strong>
        </label>
    </div>
}

export default SidebarImageUpload;