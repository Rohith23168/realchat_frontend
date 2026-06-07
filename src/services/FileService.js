import { baseURL } from "../config/AxiosHelper.js";

const uploadImage = async (file) => {
    try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(`${baseURL}/api/v1/upload`, {
            method: "POST",
            body: formData,
        });

        if (!res.ok) {
            throw new Error("Upload failed");
        }

        const imageUrl = await res.text(); // backend returns plain string
        return imageUrl.trim();

    } catch (error) {
        console.error("Upload error:", error);
        return null;
    }
};

export default uploadImage;