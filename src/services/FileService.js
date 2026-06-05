import { baseURL } from "../config/AxiosHelper";

export const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${baseURL}/api/v1/upload`, {
        method: "POST",
        body: formData,
    });

    if (!res.ok) {
        throw new Error("Upload failed");
    }

    return await res.text(); // backend returns image URL
};