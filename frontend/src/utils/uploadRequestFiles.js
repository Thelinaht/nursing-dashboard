/**
 * After a request is created, upload any attached files to the server.
 * @param {number} requestId - the newly created request_id
 * @param {File[]} files     - array of File objects (not just names)
 */
export async function uploadRequestFiles(requestId, files) {
    if (!files || files.length === 0) return;
    for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        await fetch(`http://localhost:4000/api/requests/${requestId}/attachments`, {
            method: "POST",
            body: formData,
        });
    }
}